# FiFe Admin

Önálló admin app. Vite + React + Mantine frontend, Netlify Functions backend, ami a
Supabase service role kulccsal olvas és ír. Három fül:

- **Hírlevelek** (`#hirlevelek`): kiküldés és nyomon követés, lásd lent.
- **Felhasználók** (`#felhasznalok`): név, email, regisztráció, utolsó belépés, bizniszek
  és feljelentések száma. Kereshető név/felhasználónév/email alapján, szűrhető badboyokra és
  a feljelentettekre. A badboy kapcsoló megerősítés után azonnal átállítja a
  `profiles.bad_boy`-t. A feljelentések számára kattintva a Feljelentések fül nyílik meg,
  erre a felhasználóra szűrve.
- **Feljelentések** (`#feljelentesek`): a `reports` tábla, a bejelentővel és a
  bejelentettel együtt. Szűrhető indokra és bejelentett felhasználóra, és innen is át
  lehet állítani a badboy állapotot.

A listák a `admin_list_users` / `admin_list_reports` adatbázis-függvényekből jönnek
(`supabase/migrations/20260930120000_admin_insights.sql`). Ezek csak a service role
kulccsal hívhatók, mert emailt adnak vissza.

## Helyi futtatás

```bash
cd admin
npm install
cp .env.example .env      # töltsd ki a változókat
npx netlify dev            # frontend + functions együtt, http://localhost:8888
```

A `netlify dev` szükséges ahhoz, hogy a `/api/*` hívások eljussanak a
`netlify/functions` alatti function-ökhöz helyben is.

## Környezeti változók

| Változó                    | Leírás                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `SUPABASE_URL`               | A projekt Supabase URL-je                                        |
| `SUPABASE_SERVICE_ROLE_KEY`  | Service role kulcs — csak a Netlify function-ök látják, sosem kerül a böngészőbe |
| `ADMIN_PASSWORD`             | A belépéshez használt jelszó                                     |
| `ADMIN_SESSION_SECRET`       | Hosszú random string a bejelentkezési süti aláírásához (pl. `openssl rand -hex 32`) |

## Netlify deploy

1. Hozz létre egy **új** Netlify site-ot, ami ugyanerre a repóra mutat.
2. Site settings → Build & deploy → **Base directory**: `admin`
   (a `netlify.toml` az `admin` mappán belül van, ez alapján a build/publish/functions
   útvonalak is onnan relatívak).
3. Site settings → Environment variables: állítsd be a fenti négy változót.
4. Deploy — a site a `/` alatt a login oldalt, `/api/*` alatt a function-öket szolgálja ki.

## Hogyan működik a küldés

Egy `INSERT` a `newsletters` táblába azonnal kiküldi a hírlevelet (lásd
`supabase/migrations/20260811120000_add_newsletters.sql` — `on_newsletter_created`
trigger hívja a meglévő `notify` edge function-t). Emiatt:

- **Teszt küldés**: a `recipients` mezőbe csak a megadott teszt email kerül — a
  listában sárga "TESZT" jelöléssel jelenik meg.
- **Éles küldés**: `recipients = NULL`, a címzetteket az `audience` mező dönti el.
  Megerősítő dialógus védi a véletlen küldést, mert ez a művelet nem vonható vissza.

Az `audience` a form tetején állítható:

| Célcsoport | `audience` | Kik kapják meg |
|---|---|---|
| Feliratkozók (alapértelmezés) | `subscribers` | Akiknél a hírlevél kapcsoló be van kapcsolva |
| Minden regisztrált felhasználó | `all` | Minden felhasználó megerősített email címmel, feliratkozástól függetlenül — a listában narancs "MINDENKI" jelölést kap |

A leiratkozottak mindkét esetben kimaradnak. A küldés gomb fölött mindig ott a
címzettek aktuális száma: ha ez nem az, amire számítasz, akkor a célcsoport a
rossz, nem a kiküldés.

A **Kivételek** mezőbe felsorolt címek kimaradnak, bármit is mond a célcsoport —
vesszővel, pontosvesszővel vagy soronként, kis- és nagybetű mindegy. Ezt
ugyanaz az adatbázis-függvény vonja le, amelyik a kiküldést is hajtja, így a
kiírt címzettszám már a kivételek nélkül értendő. Egyszeri, erre a hírlevélre
szóló kihagyás — nem ugyanaz, mint a végleges leiratkozás.

A lista 5 másodpercenként frissül, amíg van `pending`/`sending` állapotú hírlevél
(a tényleges kiküldés a `notify` function-ben aszinkron zajlik, a `status`/`sent_count`/
`failed_count` mezőket az írja vissza).

## Heti riport email

Minden hétfőn 8:00-kor (budapesti idő) megy ki egy riport az előző hétről: új
felhasználók, új bizniszek (címmel felsorolva), új feljelentések, új regisztrált
badboyok, mindegyiknél a változás az előző héthez képest, és az összesített számok.

- Küldi a `weekly-report` edge function (`supabase/functions/weekly-report`). Ugyanazokat
  az `SMTP_*` secreteket használja, mint a `notify`.
- Ütemezi a pg_cron `weekly-admin-report` jobja: hétfőn 05:00-kor és 06:00-kor (UTC)
  hívja a functiont. A két időpont közül nyáron az egyik, télen a másik esik 8:00-ra
  Budapesten; a function csak akkor küld, ha éppen 8 óra van, így a riport mindig egyszer
  megy ki.
- Opcionális Supabase secretek:
  - `ADMIN_REPORT_EMAIL`: a címzett. Alapértéke `kristofakos1229@gmail.com`.
  - `ADMIN_URL`: az admin site címe. Ha be van állítva, a levélben egy „Admin megnyitása”
    gomb mutat rá.

Élesítés:

```bash
supabase db push                          # migráció (pg_cron + a függvények + a job)
supabase functions deploy weekly-report
supabase secrets set ADMIN_URL=https://<admin site>
```

Ha a `db push` a pg_cron miatt elhasal, kapcsold be a Dashboardon (Database →
Extensions → pg_cron), és futtasd újra.

Kézi tesztküldés, az időponttól függetlenül:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/weekly-report?force=1" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Az ütemezés ellenőrzése SQL-ből: `select * from cron.job;`, a lefutásoké:
`select * from cron.job_run_details order by start_time desc limit 5;`.
