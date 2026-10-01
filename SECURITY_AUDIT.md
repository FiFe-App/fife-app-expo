# Security audit — 2026-09

Scope: npm dependencies, Supabase database (all migrations, RLS, grants,
functions, storage), Supabase edge functions, and client code.

**Deploy note:** the database fixes take effect only after
`npm run db:push`. The edge-function fixes need `npm run functions:deploy`.

## Fixed in this branch

| Sev | Issue | Where | Fix |
|---|---|---|---|
| Critical | Anyone holding the public anon key could read every user's exact home location, Expo push token, `bad_boy` flag and notification settings. | `20260427130000_fix_profiles_select_grant.sql` granted table-wide SELECT, which undid the column lockdown. | `20260926120000_security_hardening.sql`: column-level SELECT, INSERT and UPDATE grants only. The chat screens no longer `select("*")`. |
| Critical | "hide blocked profiles" was PERMISSIVE, so it was OR'd with the same-world policy. Ghost (`bad_boy`) profiles became visible to everyone, and blocking didn't hide anyone. | `20260608000000_add_blocked_users.sql` | The policy is recreated `AS RESTRICTIVE`. |
| High | A ghosted user could clear their own `bad_boy` flag; UPDATE was granted on every column. | profiles grants | UPDATE is granted only on the user-editable columns. |
| High | New sign-ups never got `bad_boy`, because `handle_new_user` stopped writing it in `20260604120100`. | `handle_new_user` | It persists `bad_boy` again (default `false`). |
| High | `nearest_profiles` returned exact coordinates, accepted an unbounded radius and page size, and ignored blocks. | RPC | Radius capped at 100 km, page size capped at 50, coordinates rounded to about 1 km, distance rounded to 100 m, blocked users excluded. |
| High | `contacts` ignored its `public` flag. | contacts SELECT policy | Rows with `public = false` are visible only to their author. |
| High | Notification emails interpolated user-controlled names, titles and message text as raw HTML, allowing phishing from `info@fifeapp.hu`. | `functions/_shared/email.ts`, `notify` | Added `escapeHtml()` and applied it to every user value. |
| High | The notify rate limit was 3.6 s instead of 60 s, and was keyed on the client-writable `created_at`. Blocked users still triggered notifications. | `functions/notify` | The window now uses server time and excludes the current row by id. Notifications across a block are skipped. |
| Medium | A message could reference another user's image path, which made that image readable by the recipient. | messages INSERT + `messageImages` storage policy | The image folder must equal the message author. |
| Medium | Blocked users could still send messages. | messages INSERT | Added `NOT is_blocked_by("to")`. |
| Medium | `eventResponses` had `FOR ALL USING (true)`, so any user could rewrite anyone's responses. | policy | Owner-only writes. |
| Medium | Business owners could write `embedding` / `embedding_text` directly and rig search ranking. | buziness grants | INSERT and UPDATE are column-limited; embeddings are written only by the service role. |
| Medium | `get_popular_search_queries` exposed every user's raw search text to anon. | RPC | Signed-in users only, `hit_count >= 3`, limit at most 20, LIKE wildcards escaped. |
| Medium | business-search had no cap on query length, and `take: -1` meant LIMIT NULL (the whole table). | `functions/business-search` | Query capped at 200 chars, `take` capped at 500 (the map view's -1 now means 500), `skip` is at least 0, `max_output_tokens` set, and raw DB errors are no longer returned. |
| Medium | create-buziness sent unbounded text to OpenAI. | `functions/create-buziness` | Title capped at 1,000 chars, description at 10,000, `max_output_tokens` set. |
| Medium | The web app sent no security headers (clickjacking). | `netlify.toml` | Added `frame-ancestors 'none'`, X-Frame-Options, nosniff, Referrer-Policy, HSTS and Permissions-Policy. |
| Low | Access and refresh tokens were written to the console. | `app/login/index.tsx` | Removed the log. |
| — | `is_blocked_by` had no fixed `search_path`. | function | `SET search_path = public`. |

### npm

- Ran `npm audit fix` (non-breaking fixes only).
- Moved `netlify-cli` from `dependencies` to `devDependencies` and upgraded it from 17 to 27. It is a deploy tool and never ships in the app.
- Result: **85 → 25** vulnerabilities, and **5 critical → 0**.
- Production-only (`npm audit --omit=dev`): 15 remain, 1 of them high:
  - `image-size` sits inside Metro, the bundler, so it runs only at build time.
  - The moderates are transitive through expo, react-native and expo-router: `uuid` via `xcode`, and `decode-uri-component` via `query-string`. `npm audit` suggests "fixing" these by downgrading expo to 46; ignore that. They will clear with future Expo releases.

## Open follow-ups (not changed here)

1. **Login CSRF / session fixation.** `/login`, `/user/password-reset` and `/csatlakozom/elso-lepesek` call `setSession()` with any tokens in the URL fragment. Move Supabase auth to `flowType: 'pkce'` with `exchangeCodeForSession`.
2. **`bad_boy` is still client-controlled at sign-up.** It comes from `raw_user_meta_data`, so the pledge should be recorded server-side.
3. **Admin panel login** (`admin/netlify/functions/login.ts`):
   - One shared password with no rate limit.
   - Stateless 7-day sessions that can't be revoked.
   - `cta_url` isn't restricted to `https://`.
4. **Sensitive data in browser storage.** On web, redux-persist stores decrypted emotion-log notes (and chat) in localStorage. The emotion encryption key sits next to the ciphertext in `emotion_keys`, so it only protects against other users. The key isn't cleared on logout.
5. **Service role key in a plain table.** It lives in `private.app_config` and is sent through pg_net. Move it to Vault, or use a dedicated webhook secret.
6. **Stale trigger.** Drop `send_notification_on_new_event`; it posts to a `push` function that no longer exists.
7. **Hosted-dashboard auth settings.** `config.toml` only affects local dev. In the dashboard, set:
   - email confirmation on
   - minimum password length of 8 or more
   - email rate limits
   - secure password change
8. **Restrict the Google API keys.** Lock the Firebase/Maps keys in Google Cloud to the package name/SHA-1 and HTTP referrers.
9. **Check the logs** for calls to `get_notification_prefs_for` between `20260404120000` and `20260817120000`. During that window it returned any user's email and push token.
10. **Minor items:**
    - Newsletter unsubscribe tokens fall back to the service role key as their HMAC key and never expire.
    - `count_user_contacts(uuid)` and `user_has_buziness(uuid)` accept any user id.
    - Default privileges give anon and authenticated ALL on new tables.
11. **Full script/style CSP** for the web build. It needs testing with Expo web and the maps SDK.

## How the database fix was verified

The new migration was applied to a scratch Postgres 16 with stub versions of the affected tables, set up in the pre-fix state. Before the fix, anon read every push token and the ghost profiles. After the fix:

- **Anon:** SELECT on `push_token` or `location` → permission denied; SELECT on `full_name` → only normal-world rows.
- **A ghost user:** cannot update `bad_boy`, and sees only its own world.
- **A blocked pair:** they can't see each other or send messages.
- **Messages:** a foreign image path is rejected.
- **Buziness:** writing `embedding` → permission denied.
- **eventResponses:** a write for another user's `user_id` is rejected.
- **Profile upsert:** the upsert `app/user/edit.tsx` performs still works.
- **Anon RPCs:** `nearest_profiles` and `get_popular_search_queries` → permission denied.
