# FiFe Admin

Önálló admin app. Vite + React + Mantine frontend, Netlify Functions backend, ami a
Supabase service role kulccsal olvas és ír. Az oldalak a bal oldali menüből érhetők el
(mobilon a ☰ gombbal):

**Kommunikáció**
- **Hírlevelek** (`#hirlevelek`): kiküldés és nyomon követés, lásd lent.
- **App üzenet** (`#app-uzenet`): az appban felugró üzenet szerkesztése.

**Közösség**
- **Felhasználók** (`#felhasznalok`): név, email, regisztráció, utolsó belépés, bizniszek
  és feljelentések száma. Kereshető név/felhasználónév/email alapján, szűrhető badboyokra és
  a feljelentettekre. A badboy kapcsoló megerősítés után azonnal átállítja a
  `profiles.bad_boy`-t.
- **Bizniszek** (`#bizniszek`): cím (linkkel az appbeli oldalra), szerző, létrehozás,
  láthatóság és a feljelentések száma (a bizniszre és a kommentjeire együtt). Kereshető,
  szűrhető láthatóságra és a feljelentettekre; a szerző badboy állapota itt is állítható.
- **Kérések** (`#kerelmek`): a Közösség részben feladott kérések — cím (linkkel a
  `/kerelmek/<id>` oldalra), címkék, szerző, állapot (nyitott / megoldott) és a
  feljelentések száma. Kereshető címben, leírásban, címkében és szerzőben, szűrhető
  állapotra és a feljelentettekre.
- **Segítség kontaktok** (`#segitseg`): a „Segítség kell?” oldal elérhetőségei. A
  felhasználók javaslatai jóváhagyásig rejtve maradnak; itt lehet őket jóváhagyni,
  elrejteni vagy törölni. A menüben a várakozók száma látszik.

**Moderáció**
- **Feljelentések** (`#feljelentesek`): a „Tartalom” oszlop mutatja, mit jelentettek
  (profil, üzenet, csoportüzenet, biznisz, kérés vagy komment), a tartalom akkori
  szövegét, és biznisznél / kérésnél / a hozzájuk írt kommentnél a tartalom linkjét.
  Szűrhető típusra, indokra, felhasználóra és tartalomra. A Felhasználók, Bizniszek és
  Kérések oldalon a feljelentésszámra kattintva ide jutsz, arra szűrve.
- **Biztonság** (`#biztonsag`): a kitiltott IP címek feloldással, és az utolsó 24 óra
  sikertelen belépései.

A listák az `admin_list_*` adatbázis-függvényekből jönnek
(`supabase/migrations/20260930120000_admin_insights.sql`, `20261124120000_admin_content.sql`).
Ezek csak a service role kulccsal hívhatók, mert emailt adnak vissza.

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
| `ADMIN_IP_ALLOWLIST`         | Opcionális. Vesszővel elválasztott IP címek, amelyeket a login soha nem tilt ki |

## Biztonság

Az admin felületről minden felhasználó emailje olvasható, bárki badboy-já tehető, és
hírlevél küldhető mindenkinek, ezért:

- Az `ADMIN_PASSWORD` legyen hosszú, véletlenszerű jelszó (legalább 20 karakter), pl.
  `openssl rand -base64 24`.
- **Végleges IP-tiltás:** ha egy IP címről 15 percen belül 10 hibás jelszó érkezik, az IP
  véglegesen ki lesz tiltva (403), akkor is, ha később jó jelszót írnak be. A tiltás
  addig marad, amíg kézzel fel nem oldod a **Biztonság** oldalon. A próbálkozásokat az
  `admin_login_attempts`, a tiltásokat az `admin_ip_bans` tábla tárolja; mindkettőt csak a
  service role éri el. Az IP a Netlify által beállított `x-nf-client-connection-ip`
  headerből jön, amit a kliens nem tud hamisítani. Ha a Supabase nem érhető el, a login
  korlát nélkül működik tovább (a hibát naplózza), hogy egy beállítási hiba ne zárja ki
  az admint.
- **Ha kizártad magad:** egy másik IP-ről (pl. mobilnet) belépve a Biztonság oldalon
  feloldhatod, vagy a Supabase SQL editorban:

  ```sql
  delete from public.admin_ip_bans where ip = '1.2.3.4';
  ```

  Hogy ne forduljon elő: tedd a saját fix IP-d az `ADMIN_IP_ALLOWLIST`-be.
- **HTTP headerek:** a `netlify.toml` szigorú Content-Security-Policy-t, `X-Frame-Options:
  DENY`-t, HSTS-t és `noindex`-et állít be; a `robots.txt` is tiltja az indexelést.
- **Session visszavonása:** a süti 7 napig érvényes, és a kijelentkezés csak az adott
  böngészőből törli. Minden kiadott session azonnali érvénytelenítéséhez cseréld le az
  `ADMIN_SESSION_SECRET`-et, és deployold újra a site-ot.

## Deploy checklist

Az admin címe: **https://admin.fifeapp.hu**

Az admin adatbázis-függvényei a `requests` táblára is hivatkoznak, ami a `dev` ágon jött
be, ezért ezt az ágat a **`dev`** felé kell merge-ölni, onnan megy tovább a masterre.

1. **Merge** `dev`-be, majd `dev` → `master`.
2. **Supabase — automatikus.** A `.github/workflows/supabase-deploy.yml` minden masterre
   pusholt migráció- vagy function-változásnál lefuttatja a `supabase db push`-t és
   deployolja az összes edge function-t (köztük a `notify`-t és a `weekly-report`-ot).
   Kézi teendő nincs. Ha az Action a pg_cron miatt elhasal: Dashboard → Database →
   Extensions → pg_cron bekapcsolása, majd az Action újrafuttatása a GitHubon
   (Actions → Deploy Supabase → Re-run).
3. **Netlify site** (egyszer kell létrehozni):
   1. Hozz létre egy **új** Netlify site-ot, ami ugyanerre a repóra mutat.
   2. Site settings → Build & deploy → **Base directory**: `admin`
      (a `netlify.toml` az `admin` mappán belül van, ez alapján a build/publish/functions
      útvonalak is onnan relatívak). **Production branch**: `master`.
   3. Site settings → Environment variables: a fenti változók
      (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`,
      `ADMIN_SESSION_SECRET`, és ajánlott: `ADMIN_IP_ALLOWLIST`).
   4. Deploy — a site a `/` alatt a login oldalt, `/api/*` alatt a function-öket
      szolgálja ki. Ezután minden masterre pusholt változásnál magától újraépül.
4. **Domain:**
   1. Netlify → Domain management → Add a domain → `admin.fifeapp.hu`.
   2. A fifeapp.hu DNS-ében egy CNAME rekord: név `admin`, érték
      `<a-site-neve>.netlify.app` (a Netlify a domain hozzáadásakor pontosan kiírja).
   3. A HTTPS tanúsítványt a Netlify magától intézi, amint a DNS beállt (pár perc, néha
      pár óra).
5. **Első belépés** az admin.fifeapp.hu-n, és körbenézés: Felhasználók, Bizniszek,
   Kérések, Feljelentések, Biztonság.
6. **Heti riport teszt:**

   ```bash
   curl -X POST "$SUPABASE_URL/functions/v1/weekly-report?force=1" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
   ```

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
felhasználók, új bizniszek (címmel felsorolva), új kérések, új feljelentések, új
regisztrált badboyok, mindegyiknél a változás az előző héthez képest, az összesített
számok, és ha van, hány segítség kontakt javaslat vár jóváhagyásra.

- Küldi a `weekly-report` edge function (`supabase/functions/weekly-report`). Ugyanazokat
  az `SMTP_*` secreteket használja, mint a `notify`.
- Ütemezi a pg_cron `weekly-admin-report` jobja: hétfőn 05:00-kor és 06:00-kor (UTC)
  hívja a functiont. A két időpont közül nyáron az egyik, télen a másik esik 8:00-ra
  Budapesten; a function csak akkor küld, ha éppen 8 óra van, így a riport mindig egyszer
  megy ki.
- Opcionális Supabase secretek:
  - `ADMIN_REPORT_EMAIL`: a címzett. Alapértéke `kristofakos1229@gmail.com`.
  - `ADMIN_URL`: a levél „Admin megnyitása” gombjának célja. Alapértéke
    `https://admin.fifeapp.hu`, csak más cím esetén kell beállítani.

Élesítés: a migrációt és a function-t a masterre merge-ölés után a GitHub Action
deployolja (lásd a Deploy checklistet). Ha a pg_cron miatt elhasal, kapcsold be a
Dashboardon (Database → Extensions → pg_cron), és futtasd újra az Actiont.

Kézi tesztküldés, az időponttól függetlenül:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/weekly-report?force=1" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Az ütemezés ellenőrzése SQL-ből: `select * from cron.job;`, a lefutásoké:
`select * from cron.job_run_details order by start_time desc limit 5;`.
