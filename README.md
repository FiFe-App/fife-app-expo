
# Üdvözöllek a FiFe app repójában!
Nonprofit, open-source Expo (React Native) app, Supabase backenddel.

# Egy segítői hálózat
A FiFe app egy megbízhatóságon és helyzeten alapuló online eszköz. Megoszthatod, hogy mihez értesz, és ez alapján találhatnak meg mások téged. Így egy olyan közösséget építünk, amely biztonságos és hasznos.

## Miben lesz más a FiFe App, mint a mai közösségi alkalmazások?

### Közösségi oldal

Hányszor hallottuk ezt? A legtöbb “közösségi”-nek mondott oldal kimerül a tagok közötti kommunikációban. Mi úgy gondoljuk, ez nem elég. Egy valódi közösség tagjai összetartanak, segítik egymást. Komment-háborúk helyett a FiFe app funkciói lehetőséget nyújtanak, hogy megtudd ki, miben lehet a segítségedre, és fordítva, megoszthatod, hogy te miben lehetsz a közösség hasznára.

### Több kontroll

Ma már mindent a neten csinálunk. Fontos lenne, hogy olyan felületeket használjunk, ami figyel az emberi igényekre, hogy mikor és mennyi időt szeretnél az interneten tölteni. Milyen tartalommal szeretnél találkozni és milyennel nem. Egyszóval több kontrollt ad a felhasználónak. A Fife appon kiemelt cél, hogy figyeljünk az emberek testi- és lelki egészségére: testreszabhatósággal és ajánlásokkal.

### Segít a mindennapi életben

A különböző emberek nagyon különböző problémákkal küzdenek az internet korában. Sok olyannal amiről nincs elég párbeszéd, nincs meg rá a megfelelő eszköz, támogatás. Ezen a platformon igyekszünk valódi problémákra valódi, a mindennapokban használható funkciókat adni.

### Meghallgatunk

Ahogy egy jó demokráciában, úgy egy jó alkalmazásban is meghallgatjuk a felhasználók igényeit. Célunk, hogy minél több igényre tudjunk majd választ adni.


# Közreműködés

Nagyon szívesen látunk mindenkit!:)
Ha tesztelnél, vagy fejlesztenél vagy ötletelnél a projektről, írj nekem egy [emailt](kristofakos1229@gmail.com) vagy keress meg [facebookon](https://www.facebook.com/kristof.akos.37/)

## Futtatás
A projektet első körben webes környezetben fejlesztjük, mobilra.
 1. Duplikáld az example.env fájlt és nevezd át .env-re.
 2. ```npm install```
 3. ```npm start -w```
 4. Az alapértelmezett böngészőben megnyílik az app.


## Verziókezelés (régi verziók blokkolása)

Kiadáskor a régi kliensek kizárhatók, hogy ne beszéljenek olyan backenddel,
amihez már nem passzolnak. A szabályok a `public.app_versions` táblában
laknak, platformonként egy sorban:

| oszlop | mit csinál |
| --- | --- |
| `min_version` | ez alatt az app el sem indul (kötelező frissítés) |
| `latest_version` | ez alatt eldobható "van új verzió" kártya jelenik meg |
| `update_url` | ide visz a Frissítés gomb (weben mindig újratöltés) |
| `blocked_message` / `update_message` | opcionális saját szöveg a két esethez |

Kiadás menete:

1. Emeld a verziót az `app.config.js` **és** a `package.json` `version`
   mezőjében (ezt a számot jelenti a kliens magáról).
2. Buildelj és tölts fel (`eas build` / `npm run deploy-prod`).
3. Ha a bolt/deploy már kiszolgálja az új verziót, futtasd a Supabase SQL
   editorban (vagy `psql`-lel):

```sql
-- csak jelezzük, hogy van új verzió
update public.app_versions
   set latest_version = '1.1.0', updated_at = now()
 where platform in ('android', 'ios', 'web');

-- ha a réginek tényleg le kell állnia (kötelező frissítés)
update public.app_versions
   set min_version = '1.1.0',
       blocked_message = 'Ez a verzió már nem használható, kérlek frissíts.',
       updated_at = now()
 where platform = 'android';
```

`min_version` sosem lehet nagyobb `latest_version`-nél — erre külön
constraint vigyáz, hogy ne lehessen véletlenül mindenkit kizárni.

A kliens az indításkor és minden előtérbe hozáskor (max. 5 percenként)
megkérdezi a `get_app_version_status` függvényt. Ha a hívás hibázik vagy
nincs sor az adott platformra, az app **nem** blokkol: a kapu udvariassági
kérés a felhasználó felé, a tényleges jogosultságokat továbbra is az RLS és
az edge functionök tartják be.

## Nyilvános bizniszek és a link előnézete

Egy biznisz alapból csak belépve látszik. A szerkesztőben a **Megosztható
link** kapcsoló írja a `buziness.public` oszlopot; ha be van kapcsolva, a
`/biznisz/<id>` oldal fiók nélkül is megnyílik. Ezt nem a kliens dönti el,
hanem a SELECT policy: az anon kulcs csak a `public = true` sorokat látja
(lásd `supabase/migrations/20260908120000_add_buziness_public.sql`).

A belépés nélküli látogatónak nem jelenik meg az alsó menü, az ajánlás és a
mentés gomb, és az „Üzenet" elérhetőség sem — helyette a Csatlakozom gomb.

A weboldal minden URL-en ugyanazt az `index.html`-t szolgálja ki, ezért a
Facebook (Messenger, WhatsApp, Slack) crawlere magától mindig az app
általános előnézetét látná. Ezt a `netlify/edge-functions/social-preview.ts`
javítja: a CDN-en megnézi a biznisz adatait az anon kulccsal, és beírja a
címét, leírását és első képét a HTML fejlécébe. Az alapértelmezett tagek
(`app/+html.tsx`) és a hozzájuk tartozó kép (`public/og-image.png`) maradnak
minden más oldalra.

A Supabase címét és anon kulcsát a Netlify környezeti változóiból olvassa
(`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`); ha nincsenek
beállítva, a produkciós projekt nyilvános értékeivel dolgozik.

### Belépés utáni visszairányítás

Ha valaki kilépve nyit meg egy csak tagoknak szóló linket (`/chats`,
`/user/<id>`, …), a router a belépés képernyőre teszi, és a cím elveszne. Ezt
a `lib/auth/loginRedirect.ts` őrzi meg: weben a bundle betöltésekor olvassa ki
a címet (még mielőtt a router átírná), mobilon a megnyitó deep linkből. A
belépés után a login képernyő oda navigál tovább, nem a főoldalra.

Az appon belüli, zárt oldalra mutató gombok maguk viszik a célt:
`getLoginHref("/user/abc")` → `/login?redirected_from=/user/abc`. A cél mindig
csak appon belüli útvonal lehet (`sanitizeRedirectTarget`), így külső URL-re
nem lehet kicsalni a felhasználót belépés után.

A regisztráció is ugyanezt a célt viszi: a `/csatlakozom` folyamat a
`redirectAfterAuth` mezőben (app slice, `invitedBy` mintájára) teszi el, mert a
megerősítő e-mail újraindítja az appot, amit egyetlen route paraméter sem élne
túl. Az utolsó lépés (`elso-lepesek`) a sikeres regisztráció után oda navigál.


## Napi hangulat-emlékeztető (esti értesítés)

Az esti "Hogy vagy?" értesítés **a telefonon ütemezett** helyi értesítés, nem a
szerver küldi. Ezért magától is eltűnhet: app frissítés, másik telefonra
visszaállítás, "adatok törlése", vagy ha az értesítési engedélyt visszavonják
és újra megadják.

Korábban csak belépéskor lett beütemezve, így ha egyszer eltűnt, a bejelentkezve
maradó felhasználó soha nem kapta vissza. Most a `hooks/useDailyEmotionReminder.ts`
tartja karban: minden előtérbe hozáskor és a beállítás változásakor ellenőrzi,
hogy ott van-e még, és csak akkor ütemez újra, ha tényleg hiányzik. Kilépéskor
törli — a következő ember, aki kézbe veszi a telefont, ne kapjon kérdést egy
másik fiók nevében.

Két további csapda, amit ugyanez a kör javít:

- az ütemezés törlése már csak azután történik, hogy tudjuk: van OS-engedély
  (korábban egy sikertelen engedély-ellenőrzés kitörölte a működő emlékeztetőt,
  és nem tett a helyére semmit);
- ha a kapcsoló be van kapcsolva, de az OS-engedély hiányzik, a felhasználó
  kap egy figyelmeztetést (eddig csak a konzolra ment egy warning).

Androidon saját értesítési csatornán (`daily-emotion-reminder`) érkezik.


## Újraindulás után ott folytatjuk, ahol abbahagytad

Androidon a rendszer bármikor felszabadíthatja a háttérben lévő appot, ezért a
visszaváltás sokszor nem folytatás, hanem hideg indítás: splash, majd az app
eleje. Magát a folyamat kilövését nem tudjuk megakadályozni — azt viszont igen,
hogy ne számítson:

- `hooks/useLastRoute.ts` megjegyzi, melyik képernyőn volt a felhasználó, és a
  következő hideg indításnál (ha az app a saját kezdőképernyőjén indul, tehát
  nem deep linkről) oda navigál vissza. 24 óránál régebbi állapotot már nem
  állít vissza, és weben egyáltalán nem fut: ott a címsor az igazság.
  Óvatosságból: megvárja, amíg a router elindul (előtte navigálni kivételt dob,
  ami indításkor szó nélkül kilövi az appot), a navigálás előtt törli a tárolt
  útvonalat (így egy problémás képernyő nem tud végtelen indítás–összeomlás
  kört csinálni), és a biznisz szerkesztőt szándékosan nem állítja vissza — az
  a legnehezebb képernyő (térkép, médiaválasztó), és nem szerencsés vele
  kezdeni egy hideg indítást. Nem is veszik el vele semmi: a begépelt tartalmat
  a piszkozat őrzi.
- A splash animáció (kb. 9 másodperc) belépett felhasználónak már nem játszik
  le — a webes build eddig is kihagyta, most a telefon is. Aki be van lépve,
  annak ez nem márkaélmény, hanem várakozás.

## Űrlap-piszkozatok (biznisz szerkesztő)

A biznisz szerkesztőbe gépelt tartalom eddig csak a képernyő state-jében élt,
így az app újraindulásakor elveszett. Mostantól a `hooks/useBuzinessDraft.ts`
menti (redux-persist, a gépelés után ~0,6 mp-cel, nem minden leütésnél), külön
kulcson az új (`new`) és a szerkesztett bizniszek (`<id>`) alatt.

Megnyitáskor a szerkesztő előbb betölti a szerverről a bizniszt, és csak utána
teszi rá a piszkozatot — így a mentetlen gépelés nem vész el, az olyan
piszkozat viszont, ami csak megismétli a szerveren lévő állapotot, szó nélkül
törlődik. Ha tényleg volt mentetlen változás, a felhasználó kap egy
"Folytathatod, ahol abbahagytad." üzenetet "Elvetem" gombbal. Sikeres mentés
után a piszkozat törlődik. A médiafájlok szándékosan nem részei: azok eszközön
lévő fájlok, saját feltöltési folyamattal. A lemezről visszaolvasott piszkozat
nem megbízható adat (írhatta régebbi verzió, félbeszakadhatott a mentés), ezért
a hook ellenőrzi és szükség esetén eldobja, mielőtt a szerkesztő megkapná.

## Mi nem marad meg újraindítás után

Az `info` slice azt tartja, ami épp a képernyőn van: nyitott dialógusok, a
"Kérlek várj" overlay, snackbarok, az appbar menüje — mindegyikben callback
függvényekkel, amik nem élik túl a lemezre írást. Ezeket eddig a redux-persist
mentette, így egy háttérben kilőtt app úgy jött vissza, hogy volt benne egy
dialógus, aminek a gombja nem csinál semmit, vagy — a legrosszabb — egy
elbocsáthatatlan betöltő overlay egy feltöltésről, ami az appal együtt ért
véget. Mostantól az `info`-ból csak a `policiesAccepted` és a
`notificationToken` marad meg (`redux/store.ts`).
