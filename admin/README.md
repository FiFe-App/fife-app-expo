# FiFe Admin

Önálló admin app a hírlevelek küldéséhez és nyomon követéséhez. Vite + React + Mantine
frontend, Netlify Functions backend, ami a Supabase service role kulccsal ír/olvas a
`newsletters` táblába.

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

A lista 5 másodpercenként frissül, amíg van `pending`/`sending` állapotú hírlevél
(a tényleges kiküldés a `notify` function-ben aszinkron zajlik, a `status`/`sent_count`/
`failed_count` mezőket az írja vissza).
