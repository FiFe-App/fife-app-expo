# notify — Edge Function

Handles all transactional notifications for FiFe. Triggered by database webhooks (via `pg_net`) when rows are inserted into key tables.

## Trigger tables

| Table | Notification sent to |
|---|---|
| `buzinessRecommendations` | Buziness owner |
| `profileRecommendations` | Recommended profile |
| `comments` (key `buziness/{id}`) | Buziness owner |
| `messages` | Message recipient |
| `newsletters` | The issue's audience — subscribers or every registered user — or an explicit address list. See [Newsletter](#newsletter) |

## Architecture

```
DB INSERT
  └─ Postgres trigger (trigger_notify_on_record_created)
       └─ pg_net HTTP POST → /functions/v1/notify
            └─ notify/index.ts
                 ├─ getNotificationPrefs()  — calls get_notification_prefs_for() RPC
                 ├─ sendPushNotification()  — Expo Push API
                 ├─ sendEmailNotification() — nodemailer → Rackhost SMTP
                 │    └─ html from _shared/email.ts templates
                 └─ sendNewsletter()        — newsletters table only
                      ├─ get_newsletter_recipients() RPC → who + their name
                      └─ batched sends, each with its own unsubscribe link
                           └─ /functions/v1/newsletter-unsubscribe (verify_jwt = false)
                                └─ newsletter_unsubscribe() RPC
```

## Newsletter

Sending a newsletter is one `INSERT`. The `AFTER INSERT` trigger on
`public.newsletters` posts to this function, exactly like every other
notification — no separate cron, queue or admin service.

```sql
-- To the newsletter opt-ins (the default audience):
INSERT INTO public.newsletters (subject, title, body, cta_label, cta_url)
VALUES (
  'Nyári FiFe hírlevél',
  'Mi történt a nyáron?',
  '<p>Új funkciók érkeztek a FiFe Appba!</p>',
  'Irány a FiFe App',
  'https://fifeapp.hu'
);

-- To every registered user, opted in or not — announcements and win-back:
INSERT INTO public.newsletters (subject, body, audience)
VALUES ('Itt az új FiFe App', '<p>Nézd meg, mi változott.</p>', 'all');

-- To specific addresses only (test send, targeted mail):
INSERT INTO public.newsletters (subject, body, recipients)
VALUES ('Teszt', '<p>Csak nekem.</p>', ARRAY['kristofakos1229@gmail.com']);

-- Everyone except a few (announcement with exceptions):
INSERT INTO public.newsletters (subject, body, audience, excluded)
VALUES ('Itt az új FiFe App', '<p>Nézd meg.</p>', 'all', ARRAY['kollega@fifeapp.hu']);
```

| Column | Meaning |
|---|---|
| `subject` | Email subject (required) |
| `title` | Headline above the body. Falls back to `subject` |
| `body` | HTML fragment (required). Inline styles only — Gmail strips `<style>` |
| `cta_label` + `cta_url` | Optional red CTA button. Both or neither |
| `audience` | `subscribers` (default) → the newsletter opt-ins. `all` → every registered user with a confirmed address. Ignored when `recipients` is set |
| `recipients` | `NULL`/empty → resolve from `audience`. Otherwise exactly these addresses |
| `excluded` | Addresses to skip for this issue only, whatever the audience says. Overrides `recipients` too |
| `status` | `pending` → `sending` → `sent` \| `failed`, written back by this function |
| `sent_count`, `failed_count`, `sent_at`, `error` | Run result, written back by this function |
| `sent_recipients`, `failed_recipients` | Which addresses were reached and which errored. Checkpointed as the run progresses |

Check how a send went:

```sql
SELECT id, subject, status, sent_count, failed_count, sent_at, error
FROM public.newsletters ORDER BY id DESC;
```

The table has RLS on with **no policies**, so only the SQL editor / service role
can read or write it — the app can't send newsletters or read past ones.

### Who receives it

`get_newsletter_recipients(p_emails, p_audience)` resolves the audience and
returns `email` + `full_name`, so every mail is greeted with the recipient's own
name (`Szia Anna!`).

| Call | Who comes back |
|---|---|
| `p_emails` non-empty | Exactly those addresses. Subscription state and `p_audience` both ignored |
| `p_audience = 'subscribers'` | `COALESCE(user_settings.newsletter, profiles.newsletter) = true` |
| `p_audience = 'all'` | Every profile whose `auth.users.email_confirmed_at` is set |

The suppression list is applied to **all three** — an unsubscribed person is not
mailed even when named explicitly, and `all` means "everyone who has not said
no", never "everyone". Explicit addresses do not have to belong to a user;
unknown ones simply get `Szia!`.

`p_exclude` drops addresses from whichever of the three produced them, matched
case- and whitespace-insensitively. An address in both `p_emails` and
`p_exclude` is skipped: excluding someone is always the safe answer. It is a
per-issue exception list set by the sender, not a substitute for
`newsletter_unsubscribes`, which is permanent and belongs to the recipient — so
it does not carry over to the next issue.

The count the admin shows before sending comes from this same function with the
same arguments, so what the sender is told and what the run walks cannot drift
apart.

`all` additionally requires a confirmed address because unconfirmed sign-ups are
where the dead addresses are, and a bulk send to a dormant list is the worst
moment to hand a pile of bounces to the receiving side. Opt-ins are not filtered
that way — they asked for the mail.

The audience is named in the run's first log line, so a surprising `sent_count`
can be traced to the audience rather than to delivery:

```
Newsletter 21: 412 recipient(s) (every registered user)
Newsletter 19: 6 recipient(s) (newsletter subscribers only)
```

### Unsubscribe

Every newsletter mail ends with a personal unsubscribe link and carries
`List-Unsubscribe` / `List-Unsubscribe-Post` headers, so Gmail and Outlook show
their own native unsubscribe button. Transactional mails are unaffected — they
have no unsubscribe link.

The link points at the [`newsletter-unsubscribe`](../newsletter-unsubscribe/index.ts)
function and carries `?email=…&token=…`, where the token is
`HMAC-SHA256(email, NEWSLETTER_SECRET)`. Nothing per-recipient is stored, and
an address can only be unsubscribed by someone who actually received a mail for
it. Clicking it:

1. verifies the HMAC (constant-time),
2. calls `newsletter_unsubscribe(email)` — clears the newsletter flag in both
   `public.user_settings` and `public.profiles`, and records the address in
   `public.newsletter_unsubscribes`,
3. shows a FiFe-styled confirmation page.

The link is clicked from a mail client, with no session and no JWT, so the
function needs `verify_jwt = false` — and that lives in the root
[`supabase/config.toml`](../../config.toml) under `[functions.newsletter-unsubscribe]`.
A `config.toml` inside a function's own directory is **not** read by the CLI:
having one there leaves the default in place and every click comes back
`{"code":"UNAUTHORIZED_NO_AUTH_HEADER"}` from the gateway. `verify_jwt` is applied
when the function is deployed, so changing it needs a redeploy to take effect.

Flipping the newsletter switch back on in the app clears the suppression entry
(trigger `on_newsletter_resubscribe`), so resubscribing works.

### Delivery

The function answers the webhook immediately and finishes the run in
`EdgeRuntime.waitUntil`, so a large send can't time out `pg_net`. Mails go out
in batches (default 10, 1s apart) over one pooled SMTP connection, and a single
bad address only increments `failed_count`. Re-delivery of the same webhook is
a no-op: only a row still in `pending` is claimed.

Tuning (optional secrets): `NEWSLETTER_BATCH_SIZE`, `NEWSLETTER_BATCH_DELAY_MS`.

Each mail goes out as multipart/alternative — the HTML template plus a text part
derived from it by `htmlToText()`. HTML-only bulk mail filters badly.

### Provider rate limits, and finishing a partial send

Shared SMTP hosting is not a bulk sender. Two replies say so:

```
451 4.7.1 Mailbox rate limit reached, please try again later
421 4.7.0 <host> Error: too many connections from <ip>
```

The first is a per-mailbox message rate, the second a per-IP connection cap —
and the edge runtime's outbound IP is shared with other tenants, so the
connection cap can be reached by traffic that is not even ours. Both are 4xx,
i.e. temporary: each recipient is retried (`NEWSLETTER_MAX_RETRIES`) before
being counted as failed.

Retrying does not create capacity. **Ask the provider for the actual per-hour
limit and set `SMTP_RATE_LIMIT` / `SMTP_RATE_DELTA_MS` to match** before a bulk
send. Keep `SMTP_MAX_CONNECTIONS` at `1` unless they say otherwise.

If a run still stops short, it is recoverable: `sent_recipients` is checkpointed
after every batch, so send the remainder as a new issue that excludes whoever
has already been reached.

```sql
-- Who is still owed issue 21, without mailing anyone twice
INSERT INTO public.newsletters (subject, title, body, cta_label, cta_url, audience, excluded)
SELECT n.subject, n.title, n.body, n.cta_label, n.cta_url, n.audience,
       COALESCE(n.sent_recipients, ARRAY[]::text[])
FROM public.newsletters n WHERE n.id = 21;

-- Or retry just the ones that errored
INSERT INTO public.newsletters (subject, title, body, cta_label, cta_url, recipients)
SELECT n.subject, n.title, n.body, n.cta_label, n.cta_url, n.failed_recipients
FROM public.newsletters n WHERE n.id = 21 AND n.failed_recipients IS NOT NULL;
```

A run that is killed by the edge runtime's wall-clock limit leaves `status` at
`sending` and never reaches `sent`; its `sent_recipients` is still accurate up
to the last completed batch, so the same recovery applies.

### "Status is sent but nothing arrived"

`sent_count` counts mails the SMTP server **accepted**, which is not the same as
delivered. Start from the function logs, which carry the server's own answer:

```
SMTP config: host=smtp.rackhost.hu port=465 secure=true from=info@fifeapp.hu (from SMTP_FROM)
Email sent to someone@example.com from info@fifeapp.hu — 250 2.0.0 Ok: queued as 4b1f… messageId=<…@fifeapp.hu>
```

- **No `Email sent to …` line at all**, but the row still says `sent` → nothing was
  handed to SMTP. The likely cause is missing credentials; look for
  `Missing SMTP credentials`, and check `newsletters.error`, which now carries the
  reason for every failed recipient.
- **A `250` queue id and still nothing in the inbox** → the mail was accepted and
  then dropped or filtered downstream. In order: search the whole mailbox, not just
  the inbox (in Gmail, `in:anywhere from:fifeapp.hu`); check the `SMTP_FROM` mailbox
  for an asynchronous bounce, which is where the receiving side's real reason ends
  up; then check that the `from=` address in the log is one the SMTP host is
  authorised to send for:

  ```bash
  dig +short TXT fifeapp.hu          # SPF must cover the Rackhost sending host
  dig +short TXT _dmarc.fifeapp.hu   # p=reject/quarantine punishes any misalignment
  ```

  Quote the queue id to the mail provider — that is what they trace on.

  `from=` falling back to `SMTP_USER` is worth ruling out early: `supabase secrets
  list` shows only digests, so the log line above is the only place the effective
  From address is visible.

## Email templates

All templates live in [`../_shared/email.ts`](../_shared/email.ts).

Images are served from [`public/email/`](../../../public/email), which the web
export copies to the site root unchanged — `https://fifeapp.hu/email/logo.png`.
Never point a mail at `/assets/assets/<name>.<hash>.<ext>`: those names are build
output hashed from the file's contents, so replacing an image silently 404s every
mail already sent. Add a new image by dropping it in `public/email/` (sized for the
slot it renders in — mail clients download the file at full size whatever the
`width` attribute says).

Every email includes:
- **Header**: FiFe logo + smiley, linked to `https://fifeapp.hu`
- **Greeting**: `Szia {recipientName}!` (falls back to `Szia!` if no name)
- **Body**: Event-specific message
- **CTA button**: Links to the related page on fifeapp.hu
- **Footer**: `Legyen szép napod! :)` + smiley

### Adding a new email type

1. Export a new function from `_shared/email.ts`:
   ```ts
   export function myNewHtml(
     recipientName: string | null,
     // ...event-specific params
   ): string {
     const body = `
       <p style="...">Your message here</p>
       ${ctaButton("CTA Label", "https://fifeapp.hu/target-page")}`;
     return layout(recipientName, body);
   }
   ```
2. Import it in `notify/index.ts` and add a branch in `Deno.serve`:
   ```ts
   } else if (table === "myNewTable") {
     const message = "Short push text";
     await sendNotification(supabase, targetUserId, message, {
       subject: "Email subject",
       htmlBuilder: (name) => myNewHtml(name, /* params */),
     });
   }
   ```
3. Add a `AFTER INSERT` trigger on that table in a new migration:
   ```sql
   CREATE TRIGGER on_my_new_table_created
     AFTER INSERT ON public."myNewTable"
     FOR EACH ROW
     EXECUTE FUNCTION public.trigger_notify_on_record_created();
   ```

## DB dependencies

### `get_notification_prefs_for(user_id uuid)`

Returns one row per user:

| Column | Description |
|---|---|
| `notify_push` | Push enabled (default `true`) |
| `notify_email` | Email enabled (default `false`) |
| `push_token` | Expo push token (set from app via `update_my_push_token`) |
| `email` | From `auth.users` |
| `full_name` | From `profiles` — used for greeting |

Function is `SECURITY DEFINER` and access is revoked from `anon`/`authenticated` — only callable with the service role key.

### Trigger function

`trigger_notify_on_record_created()` reads its configuration from the
`private.app_config` table (hosted Supabase does not allow custom `app.*` GUCs, so the
older `ALTER DATABASE ... SET` approach was replaced in migration
`20260417120000_app_config_table.sql`):

| `key` | `value` |
|---|---|
| `supabase_url` | `https://<project-ref>.supabase.co` — or `http://supabase_kong_fife-app-expo:8000` locally |
| `service_role_key` | The **service role** key. `notify` compares the bearer token against its own copy and 401s on anything else. |

Local dev values are in [`../../seed.sql`](../../seed.sql) and are restored by
`supabase db reset`. Production values must be set once, by hand:

```sql
INSERT INTO private.app_config (key, value) VALUES
  ('supabase_url',     'https://<project-ref>.supabase.co'),
  ('service_role_key', '<service role key>')
ON CONFLICT (key) DO UPDATE SET value = excluded.value;
```

Check them at any time — the key itself is never printed, only its role and an md5 prefix:

```sql
SELECT * FROM private.notify_config_status();   -- expect key_role = service_role
```

The trigger also raises a warning on every insert while the stored key carries a role
other than `service_role`, which is what a `401` from `notify` looks like from the
database side. `net.http_post()` is fire-and-forget, so to see what the function
actually answered:

```sql
SELECT * FROM private.notify_recent_calls(20);
```

## Environment variables / secrets

| Variable | Where set | Purpose |
|---|---|---|
| `SUPABASE_URL` | Auto-injected by Edge Runtime | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Edge Runtime | Service role access |
| `SMTP_HOST` | `supabase secrets set` | e.g. `smtp.rackhost.hu` |
| `SMTP_PORT` | `supabase secrets set` | `465` for implicit TLS |
| `SMTP_USER` | `supabase secrets set` | SMTP username/email |
| `SMTP_PASS` | `supabase secrets set` | SMTP password |
| `SMTP_FROM` | `supabase secrets set` | From address (e.g. `info@fifeapp.hu`) |
| `NEWSLETTER_SECRET` | `supabase secrets set` (optional) | HMAC key for unsubscribe links. Defaults to the service role key. Changing it invalidates links in already-sent mails |
| `FUNCTIONS_BASE_URL` | `supabase secrets set` (optional) | Base URL used to build unsubscribe links. Defaults to `$SUPABASE_URL/functions/v1` |
| `NEWSLETTER_BATCH_SIZE` | `supabase secrets set` (optional) | Mails per batch, default `10` |
| `NEWSLETTER_BATCH_DELAY_MS` | `supabase secrets set` (optional) | Pause between batches, default `1000` |
| `NEWSLETTER_MAX_RETRIES` | `supabase secrets set` (optional) | Retries per recipient on a **temporary** SMTP reply, default `2` |
| `NEWSLETTER_RETRY_DELAY_MS` | `supabase secrets set` (optional) | Base backoff between retries, default `5000`, multiplied by the attempt number |
| `SMTP_MAX_CONNECTIONS` | `supabase secrets set` (optional) | Simultaneous SMTP connections, default `1`. Raise only if the provider says it is safe |
| `SMTP_RATE_LIMIT` | `supabase secrets set` (optional) | Max messages per `SMTP_RATE_DELTA_MS`. `0` (default) disables the limiter |
| `SMTP_RATE_DELTA_MS` | `supabase secrets set` (optional) | Window for `SMTP_RATE_LIMIT`, default `60000` |

Set secrets for production:
```bash
supabase secrets set SMTP_HOST=smtp.rackhost.hu SMTP_PORT=465 SMTP_USER=... SMTP_PASS=... SMTP_FROM=info@fifeapp.hu
```

## Testing locally

1. Start Supabase: `supabase start`
2. Confirm the config survived: `select * from private.notify_config_status();`
3. Set `notify_email = true` on a test profile in Studio (`http://127.0.0.1:54323`)
4. Insert a row into any trigger table
5. Check Mailpit at `http://127.0.0.1:54324` for the rendered email
6. Check push in edge runtime logs: `docker logs supabase_edge_runtime_fife-app-expo --tail 50`

For the newsletter, set `newsletter = true` on a few test users **in
`public.user_settings`** — the resolver reads
`COALESCE(user_settings.newsletter, profiles.newsletter)`, and because
`user_settings.newsletter` is `NOT NULL DEFAULT false` it never falls through, so
setting it on `profiles` alone produces a subscriber nobody mails. Then insert a
row into `public.newsletters`, and check Mailpit — one mail per subscriber — and
click the unsubscribe link in the footer. Locally the link resolves to
`http://127.0.0.1:54321/functions/v1/newsletter-unsubscribe`.

To exercise the `all` audience, insert with `audience => 'all'` and confirm the
mail also reaches users who never opted in. `npm run test:edge` covers the
resolver itself (`__tests__/edge/newsletter-recipients.integration.test.ts`)
without sending anything.

## Deployment

```bash
supabase functions deploy notify
supabase functions deploy newsletter-unsubscribe   # public, verify_jwt = false
supabase secrets set SMTP_HOST=... SMTP_PASS=... # etc.
```

After a first-time production deploy, insert the `private.app_config` rows in the Supabase
SQL editor (see [Trigger function](#trigger-function)) and verify with
`select * from private.notify_config_status();`.
