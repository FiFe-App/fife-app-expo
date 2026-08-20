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
-- To every subscriber (user_settings.newsletter = true):
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
2. calls `newsletter_unsubscribe(email)` — sets `newsletter = false` on the
   user's `public.user_settings` row (and on the deprecated `profiles` column,
   for app versions that still read it) and records the address in
   `public.newsletter_unsubscribes`,
3. shows a FiFe-styled confirmation page.

Flipping the newsletter switch back on in the app clears the suppression entry
(trigger `on_newsletter_resubscribe` on `public.user_settings`, with a twin on
`public.profiles` for older app versions), so resubscribing works.

### Delivery

The function answers the webhook immediately and finishes the run in
`EdgeRuntime.waitUntil`, so a large send can't time out `pg_net`. Mails go out
in batches (default 10, 1s apart) over one pooled SMTP connection, and a single
bad address only increments `failed_count`. Re-delivery of the same webhook is
a no-op: only a row still in `pending` is claimed.

Tuning (optional secrets): `NEWSLETTER_BATCH_SIZE`, `NEWSLETTER_BATCH_DELAY_MS`.

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
| `notify_push` | Push enabled (default `false`) — from `user_settings` |
| `notify_email` | Transactional email enabled (default `true`) — from `user_settings` |
| `push_token` | Expo push token (set from app via `update_my_push_token`) |
| `email` | From `auth.users` |
| `full_name` | From `profiles` — used for greeting |

Notification preferences live on `public.user_settings`, one row per user. The
`profiles` columns of the same name are deprecated and kept only so app
versions already in the wild keep working; this function reads `profiles` as a
fallback for users without a settings row.

Function is `SECURITY DEFINER` and access is revoked from `anon`/`authenticated` — only callable with the service role key.

### Trigger function

`trigger_notify_on_record_created()` reads two `DATABASE`-level GUC settings that must be set once per environment (not in migrations — requires superuser):

```sql
-- Local dev (run once after supabase db reset):
ALTER DATABASE postgres SET "app.supabase_url" = 'http://supabase_kong_fife-app-expo:8000';
ALTER DATABASE postgres SET "app.service_role_key" = '<local-service-role-jwt>';

-- Production (run once after deploying):
ALTER DATABASE postgres SET "app.supabase_url" = 'https://<project-ref>.supabase.co';
ALTER DATABASE postgres SET "app.service_role_key" = '<production-service-role-jwt>';
```

The local service role JWT is `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU` (standard Supabase local dev token).

These settings are **wiped on `supabase db reset`** — run the two `ALTER DATABASE` commands again afterwards.

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
2. After any `supabase db reset`, re-apply the DB settings (see above)
3. Set `notify_email = true` on a test user's `user_settings` row in Studio (`http://127.0.0.1:54323`)
4. Insert a row into any trigger table
5. Check Mailpit at `http://127.0.0.1:54324` for the rendered email
6. Check push in edge runtime logs: `docker logs supabase_edge_runtime_fife-app-expo --tail 50`

For the newsletter, set `newsletter = true` on a few `user_settings` rows, insert a row
into `public.newsletters`, then check Mailpit — one mail per subscriber — and
click the unsubscribe link in the footer. Locally the link resolves to
`http://127.0.0.1:54321/functions/v1/newsletter-unsubscribe`.

## Deployment

```bash
supabase functions deploy notify
supabase functions deploy newsletter-unsubscribe   # public, verify_jwt = false
supabase secrets set SMTP_HOST=... SMTP_PASS=... # etc.
```

After first-time production deploy, run the `ALTER DATABASE` commands in the Supabase SQL editor (production).
