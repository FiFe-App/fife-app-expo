# notify — Edge Function

Handles all transactional notifications for FiFe. Triggered by database webhooks (via `pg_net`) when rows are inserted into key tables.

## Trigger tables

| Table | Notification sent to |
|---|---|
| `buzinessRecommendations` | Buziness owner |
| `profileRecommendations` | Recommended profile |
| `comments` (key `buziness/{id}`) | Buziness owner |
| `messages` | Message recipient (rate-limited) |

## Architecture

```
DB INSERT
  └─ Postgres trigger (trigger_notify_on_record_created)
       └─ pg_net HTTP POST → /functions/v1/notify
            │    Authorization: Bearer <service role key>   (private.app_config)
            │    x-notify-secret: <secret>                  (optional, preferred)
            └─ notify/index.ts
                 ├─ authorizeWebhook()      — the caller check, see "Authentication"
                 ├─ getNotificationPrefs()  — calls get_notification_prefs_for() RPC
                 ├─ sendPushNotification()  — Expo Push API
                 └─ sendEmailNotification() — nodemailer → Rackhost SMTP
                      └─ html from _shared/email.ts templates
```

## Authentication

`notify` is never called by a signed-in user, only by the database. It runs with
`verify_jwt = false` (set in [`supabase/config.toml`](../../config.toml)) and checks the
caller itself, accepting either of:

- `x-notify-secret` matching the function's `NOTIFY_WEBHOOK_SECRET` secret, or
- `Authorization: Bearer <key>` matching the function's injected `SUPABASE_SERVICE_ROLE_KEY`.

Anything else gets a 401 and a log line naming what was presented (e.g. `caller
presented a JWT with role "anon", expected the service role key`).

The platform's JWT gate is deliberately not used here. It accepts *any* valid project
key, so calling with the anon key looks fine right up until it isn't — and it rejects
keys it does not recognise with a bare gateway 401 that never reaches this function's
logs. Checking the key here means a wrong or rotated credential says so out loud.

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
| `service_role_key` | The **service role** key. Not the anon key — see [Troubleshooting](#troubleshooting-401-from-notify). |
| `notify_secret` | Optional. When set, must equal the function's `NOTIFY_WEBHOOK_SECRET`. |

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
SELECT * FROM private.notify_config_status();
```

`looks_correct = true` means the URL is set and the stored key is a service role key.

## Troubleshooting: 401 from notify

The edge function logs show `POST | 401 | .../functions/v1/notify` with
`user_agent: pg_net/0.14.0`, and no notifications arrive.

`request.sb.jwt.authorization.payload.role` in the log entry says which key the database
sent. If it is `anon`, `private.app_config.service_role_key` holds the anon key rather
than the service role key. Fix it with:

```sql
UPDATE private.app_config SET value = '<service role key>' WHERE key = 'service_role_key';
SELECT * FROM private.notify_config_status();   -- expect key_role = service_role
```

The trigger also raises a warning on every insert while the stored key carries a role
other than `service_role`, so this shows up in the Postgres logs as it happens.

To see what the function actually answered — `net.http_post()` is fire-and-forget, so
failures are otherwise silent:

```sql
SELECT * FROM private.notify_recent_calls(20);
```

A 401 whose stored key *is* the service role key means the key is stale: the project's
API keys were rotated, or it has moved off legacy JWT keys. Copy the current service role
key from the dashboard into `private.app_config` and redeploy nothing — the function reads
its own copy from the environment.

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
| `EXPO_ACCESS_TOKEN` | `supabase secrets set` | Expo Push API access token |
| `NOTIFY_WEBHOOK_SECRET` | `supabase secrets set` | Optional. Must match `private.app_config.notify_secret` |

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

## Deployment

```bash
supabase functions deploy notify
supabase secrets set SMTP_HOST=... SMTP_PASS=... # etc.
```

After a first-time production deploy, insert the `private.app_config` rows in the Supabase
SQL editor (see [Trigger function](#trigger-function)) and verify with
`select * from private.notify_config_status();`.
