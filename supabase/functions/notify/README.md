# notify — Edge Function

Handles all transactional notifications for FiFe. Triggered by database webhooks (via `pg_net`) when rows are inserted into key tables.

## Trigger tables

| Table | Notification sent to |
|---|---|
| `buzinessRecommendations` | Buziness owner |
| `profileRecommendations` | Recommended profile |
| `comments` (key `buziness/{id}`) | Buziness owner |
| `messages` | Message recipient |
| `newsletters` | Every newsletter subscriber, or an explicit address list — see [Newsletter](#newsletter) |

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
-- To every subscriber (profiles.newsletter = true):
INSERT INTO public.newsletters (subject, title, body, cta_label, cta_url)
VALUES (
  'Nyári FiFe hírlevél',
  'Mi történt a nyáron?',
  '<p>Új funkciók érkeztek a FiFe Appba!</p>',
  'Irány a FiFe App',
  'https://fifeapp.hu'
);

-- To specific addresses only (test send, targeted mail):
INSERT INTO public.newsletters (subject, body, recipients)
VALUES ('Teszt', '<p>Csak nekem.</p>', ARRAY['kristofakos1229@gmail.com']);
```

| Column | Meaning |
|---|---|
| `subject` | Email subject (required) |
| `title` | Headline above the body. Falls back to `subject` |
| `body` | HTML fragment (required). Inline styles only — Gmail strips `<style>` |
| `cta_label` + `cta_url` | Optional red CTA button. Both or neither |
| `recipients` | `NULL`/empty → **all subscribers**. Otherwise exactly these addresses |
| `status` | `pending` → `sending` → `sent` \| `failed`, written back by this function |
| `sent_count`, `failed_count`, `sent_at`, `error` | Run result, written back by this function |

Check how a send went:

```sql
SELECT id, subject, status, sent_count, failed_count, sent_at, error
FROM public.newsletters ORDER BY id DESC;
```

The table has RLS on with **no policies**, so only the SQL editor / service role
can read or write it — the app can't send newsletters or read past ones.

### Who receives it

`get_newsletter_recipients(p_emails)` resolves the audience and returns
`email` + `full_name`, so every mail is greeted with the recipient's own name
(`Szia Anna!`). Addresses on the suppression list are dropped in both modes —
an unsubscribed person is not mailed even if listed explicitly. Explicit
addresses do not have to belong to a user; unknown ones simply get `Szia!`.

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
2. calls `newsletter_unsubscribe(email)` — sets `profiles.newsletter = false`
   and records the address in `public.newsletter_unsubscribes`,
3. shows a FiFe-styled confirmation page.

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

### "Status is sent but nothing arrived"

`sent_count` counts mails the SMTP server **accepted**, which is not the same as
delivered. Start from the function logs, which carry the server's own answer:

```
Email sent to someone@example.com — 250 2.0.0 Ok: queued as 4b1f… messageId=<…@fifeapp.hu>
```

- **No `Email sent to …` line at all**, but the row still says `sent` → nothing was
  handed to SMTP. The likely cause is missing credentials; look for
  `Missing SMTP credentials`, and check `newsletters.error`, which now carries the
  reason for every failed recipient.
- **A `250` queue id and still nothing in the inbox** → the mail was accepted and
  then dropped or filtered downstream. Check the spam/promotions folder first, then
  the `SMTP_FROM` mailbox for an asynchronous bounce, then that SPF/DKIM/DMARC for
  the `SMTP_FROM` domain authorise the SMTP host. Quote the queue id to the mail
  provider — that is what they trace on.

## Email templates

All templates live in [`../_shared/email.ts`](../_shared/email.ts).

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

For the newsletter, set `newsletter = true` on a few test profiles, insert a row
into `public.newsletters`, then check Mailpit — one mail per subscriber — and
click the unsubscribe link in the footer. Locally the link resolves to
`http://127.0.0.1:54321/functions/v1/newsletter-unsubscribe`.

## Deployment

```bash
supabase functions deploy notify
supabase functions deploy newsletter-unsubscribe   # public, verify_jwt = false
supabase secrets set SMTP_HOST=... SMTP_PASS=... # etc.
```

After a first-time production deploy, insert the `private.app_config` rows in the Supabase
SQL editor (see [Trigger function](#trigger-function)) and verify with
`select * from private.notify_config_status();`.
