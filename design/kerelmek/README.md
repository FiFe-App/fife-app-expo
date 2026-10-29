# Kérések — design tervek

Új funkció: **Kérések** a Közösségben. A tervek a meglévő arculatot követik (`assets/theme.ts`, `constants/spacing.ts`, `constants/borderRadius.ts`, `BuzinessItem`, `CategoryChip`, `MetaStat`, `BottomNavigation`, `Comments`, `ReportContentModal`, `BuzinessEditScreen`). Az app kódját nem módosítottuk.

## Fájlok

| Fájl | Tartalom |
|---|---|
| `lista.html` | `/kerelmek` lista (Neked / Mind / Saját / Megoldott, ⋮ menük, betöltő és üres állapot), home „Kérések neked” szekció (+ üres/betöltő/hiba), keresés 3. chip + találatok, bottom nav új változata |
| `uj-kereses.html` | `/kerelmek/new` űrlap: üres, kitöltött, hibás, feltöltés közbeni állapot, helyválasztó modal |
| `kerelem.html` | `/kerelmek/[id]`: idegen és saját nézet, megerősítő dialógus, megoldott/archivált állapot, jelentés modal, betöltés, nem található |
| `screens/*-390.png` | teljes oldal 390 px széles viewporttal (a keretek egymás alatt: világos, sötét) |
| `screens/*-overview.png` | ugyanez 860 px széles viewporttal (világos és sötét egymás mellett) |
| `_src/` | a HTML-eket generáló szkriptek (Node), részhalmazolt betűtípusok, MDI ikon-útvonalak. Nem része a terveknek, lásd a végén |

Minden mockup önálló HTML+CSS: nincs CDN, a betűtípusok (RedHatText, Piazzolla — a repo `assets/fonts` fájljaiból, latin/latin-ext részhalmaz) base64-ben beágyazva. A színek, a `Spacing` és a `BorderRadius` CSS változók (`--primary`, `--sp-md`, `--r-lg`, …), a két téma `.theme-light` / `.theme-dark` osztályon váltható. Az ikonok a valódi Material Design Icons útvonalai (`@mdi/js` 7.4.47), az SVG-n `data-mdi="map-marker"` jelzi a React Native Paper `source` nevet.

---

## Döntések és indoklásuk

### Elhelyezés

* **Home (`app/home.tsx`)**: „Kérések neked” szekció a FiFeRadar fölött, a Radar fejlécével azonos felépítéssel (`labelLarge` bold `secondary` + ikon, jobbra „Mind ›”). Az ikon `hand-heart-outline` (kérés = segítségkérés); ugyanez az ikon a keresés 3. chipjén.
* **Külön oldal `/kerelmek`**: ugyanaz a váz, mint a `/biznisz` (`MyAppbar` + `FakeSearchInput`, majd lista, FAB). Közösség alatti oldal, így a bottom nav-on a **Közösség** marad aktív.
* **Keresés**: a `MODES` tömb 3. eleme (`Kérések`). Enter után `router.replace("/kerelmek")` a keresőszóval, ugyanúgy, ahogy a Bizniszeknél a `/biznisz`.
* **Bottom nav**: a Közösség és az Otthon közé 24 px (`Spacing.xxl`) széles elválasztó hely, benne 1 px × 36 px `outlineVariant` vonal. Üzenetek nélkül (`messagingEnabled=false`) is a Közösség és az Otthon között van. Dekoratív elem (`importantForAccessibility="no"`, `accessibilityElementsHidden`). A csoportosítás értelme: balra a „társas” (Üzenetek, Közösség), jobbra a „személyes” (Otthon, Profilod) rész. Az elválasztó miatt a gombok ~4 px-szel keskenyebbek, a legszűkebb gomb így is ~90 px, a szöveg ráfér.

### A home szekció formája: vízszintes kártyasor, nem függőleges lista

* A home már most hosszú függőleges feed (Radar + a végtelen görgetésű, sticky fejlécű Bizniszek-lista). Egy 3–5 elemű függőleges lista a Bizniszeket a képernyő aljára tolná, és a „Közeli Bizniszek neked” sticky fejléc a mostani helyén többé nem lenne az első dolog, amit az ember lát.
* A vízszintes sor **fix ~200 px** magas, bármennyi kérés van. A kártya 264 px széles, így a második kártyából ~100 px kilóg: ez a görgethetőség jele. A sor végén „Mind a N kérés” kártya van, így a „Mind” link nem az egyetlen út a listához.
* Ez a FiFeRadarral is egy mintát követ (vízszintes strip a home-on, részletek külön oldalon).
* Hátrány: a vízszintes görgetés kevésbé felfedezhető és a képernyőolvasóval körülményesebb. Ezért: peek, „Mind” link 44 px magas, minden kártya egy összefoglaló `accessibilityLabel`-lel, és legfeljebb 6 kártya.
* Üres állapot: „Nincs kérés a környékeden” + `Kérj te valamit` (`contained-tonal`, a „Hirdesd meg te az elsőt!” testvére). Betöltés: két vázlat-kártya. Hiba: `errorContainer` sáv „Újra” gombbal.

### Kérés-kártya: a BuzinessItem testvére, posztszerűbben

Ugyanaz a `Surface elevation=2` (`elevation.level2`), `BorderRadius.lg`, `Spacing.md` belső tér, `Spacing.sm` gap, ugyanazok a `CategoryChip` és `MetaStat` elemek. Ami más (poszt-jelleg):

* fejléc: 40 px-es szerzői avatar (az app domináns avatar-alakja: `BorderRadius.md` lekerekített négyzet, mint a Radarban és a nav-on), név (`titleSmall`), alatta „2 órája · 📍 Újpest, 5 km” (`map-marker-radius` ikon = hely + körzet sugara; „Bárhol” kérésnél `wifi`, mint a bizniszeknél), jobbra ⋮ (44×44 px),
* törzs: a kérés szövege `bodyMedium` (17/24), max. 5 sor,
* képek: FB-szerű rács 1/2/3/4 képhez (2 px rés, `BorderRadius.md`),
* kulcsszó-chipek: a **felhasználó bizniszeivel egyező kulcsszó `secondaryContainer`** háttérrel kiemelt (ugyanaz a szín, mint a TagInput chipjein), plusz „Illik a bizniszedhez: kertészet” jelvény (`tertiaryContainer` / `onTertiaryContainer`, ikon: `briefcase-check-outline`),
* lábléc (poszt-szerű akciósor, `outlineVariant` vonallal elválasztva, 44 px magas): bal oldalon „4 hozzászólás” (`comment-outline`), jobb oldalon az akció: idegennek „Hozzászólok”, a létrehozónak nyitott kérésnél „Megoldva”, megoldottnál „Megnézem”.
* **Megoldva állapot**: „Megoldva · 3 napja” jelvény a szöveg fölött. A jelvény `nature` színű keret + áttetsző nature háttér + **`check-circle` ikon + szöveg** (`onBackground`), nem színes kitöltés fehér szöveggel: a meglévő `nature`/`onNature` páros világos módban csak 3,66:1 (lásd kontrasztok). A kártya nem halványodik (az opacitás rontaná a kontrasztot).

### Szűrők

`Neked | Mind | Saját | Megoldott` — a `search.tsx` típusválasztó chip-stílusa (kiválasztott: `secondaryContainer` + `onSecondaryContainer`, többi: outlined `outlineVariant`, `BorderRadius.full`, `showSelectedCheck={false}`). Ikon nélkül, hogy a 4 chip 390 px-en kiférjen (~330 px); 360 px alatt a sáv vízszintesen görgethető. A chip 32 px magas, 44 px-es érintési felületet `hitSlop` (6 px fent/lent) ad.

| Szűrő | Tartalom |
|---|---|
| **Neked** (alapértelmezett) | Nyitott kérések. Sorrend: 1. a felhasználó bizniszeinek kulcsszavaira illeszkedők (előre), 2. a lokációjához illeszkedők (a kérés körzete tartalmazza a felhasználó helyét, vagy „Bárhol”), 3. többi a környéken, az „Egyéb kérések a környéken” elválasztó mögött (ugyanaz a minta, mint a home Bizniszek-listájában). |
| **Mind** | Minden nyitott kérés a beállított keresési körben (`searchCircle`), legújabb elöl. Szöveges keresésnél ez áll be. |
| **Saját** | A felhasználó összes kérése: nyitott és megoldott is, megoldottnál jelvénnyel. |
| **Megoldott** | Archivált kérések, legutóbb megoldott elöl. Alapértelmezés: mindenkié a körzetben (lásd nyitott kérdések). |

Alatta egysoros fejléc (mint a `/biznisz` `listTitle` + „Finomítás”): „Kérések neked” / „Összes kérés” / „Saját kéréseid” / „Megoldott kérések”, jobbra a `Finomítás` a meglévő MapSelector-os körzetmódosítást nyitja.

### Archiválás („Megoldva”)

1. Csak a létrehozó jelölheti: a részletező oldalon az elsődleges gomb („Megoldódott”), a kártya láblécében gyors gomb, vagy a ⋮ menü. **Mindig megerősítéssel** (`showDialog`, az `InfoLayer` Dialogja): cím „Megoldódott?”, szöveg „Archiváljuk. …” + a következmény elmondása; gombok: „Mégsem” + „Megoldva”.
2. Hatás: kikerül a feedekből (`Neked`, `Mind`, home szekció, keresés alapból), megmarad a létrehozónak (`Saját`) és a `Megoldott` szűrőben, „Megoldva” jelvénnyel. A közvetlen link továbbra is működik (aki hozzászólt, látni akarja a végét).
3. **Újranyitható** („Újranyitás” gomb a létrehozó nézetében): egy véletlen koppintás ne legyen visszafordíthatatlan. Ez a briefhez képest kis kiegészítés, lásd nyitott kérdések.
4. Törlés külön művelet (⋮ / fejléc ikon), megerősítéssel, mint a `BuzinessItem.showDelete`. A hozzá tartozó képeket és kommenteket is törölni kell.
5. Az archiválás a szerveren is érvényesüljön (`solved_at` oszlop, a feed-lekérdezés kiszűri), ne csak a kliensen.

### Komment megoldott kérésnél: **olvasható marad, de a mező le van zárva**

* Indok: a megoldott kérés kommentjei értéket hordoznak (ki segített, milyen tipp jött), ezért nem tűnnek el. Új komment viszont már csak zaj: értesítést küldene olyannak, aki már nem vár segítséget, és a későn érkező segítő azt hinné, még számít a válasza.
* A mező halványított, fölötte lakat-ikonos magyarázat: „A kérés megoldódott, ezért új hozzászólás nem írható.” (a létrehozónak kiegészítve: „Újranyitással újra lehet írni.”), így nem tűnik hibának.
* A komment-menü (jelentés, letiltás, saját komment törlése) **nem** záródik le: az archivált tartalom moderálható marad.
* A létrehozónak sincs kivétel (egyszerű szabály, nincs „köszi” kivétel): újranyitás után ír. Ez a nyitott kérdések között is szerepel.
* Megvalósítás: `Comments` kap egy `closed?: boolean` propot (`TextInput disabled`, placeholder csere), és a szerveren a `comments` insert policy ellenőrzi a kérés státuszát.

### Új kérés űrlap

* Váz: a `BuzinessEditScreen` mintája (`SectionLabel` + `Surface elevation=1`, `gap: Spacing.lg`, alul rögzített beküldő sáv, 56 px magas gomb `BorderRadius.lg`-vel, „Közzététel”, `send` ikon). Az űrlapon nincs bottom nav (mint a `/biznisz/new`-n).
* **Szöveg**: egyetlen mező („Kérésed *”, 10–600 karakter, számláló). A „cím/szöveg” egy mezőként oldottuk meg, mert a kártyán a szöveg a tartalom és a poszt-jelleg így természetes (lásd nyitott kérdések).
* **Képek**: 0–4, 77 px-es négyzetes csempék, a törlés ikon 24 px-es, de 44×44 px-es érintési felülettel; a „Kép” hozzáadó csempe a 4. kép után eltűnik; számláló „2 / 4”. A `BuzinessMediaUpload` videót/hangot is kezel és 200 px magas vízszintes sávot használ, ezért új, egyszerűbb képválasztó-rács javasolt; az `expo-image-picker` hívás és a feltöltési logika (`getUploadData`, `supabase.storage`) újrahasználható.
* **Hely**: `SegmentedButtons` „Bárhol / Térképen” (ez a BuzinessEditScreen „Bárhol” kapcsolója: két explicit állapot, nincs elrejtett al-állapot). Térképen: 200 px-es előnézet körrel és ponttal, „Környék módosítása” → a **változtatás nélküli `MapSelector`** (`markerOnly`) 90%-os modalban. **Sugár**: választó-chipek (1 / 3 / 5 / 10 / 25 km), mert a MapSelectornak nincs sugár-vezérlője, a chipek egy érintéssel, új függőség nélkül használhatók, és 44 px-esek. Alapértelmezés: a profil helye + 5 km; ha nincs mentett hely, „Bárhol”.
* **Kulcsszavak**: `TagInput suggest` változtatás nélkül (a felhasználó-felületen a meglévő szó a „kulcsszó”, a briefben „címke”; a bizniszekkel közös szótár miatt az app szóhasználatát követtük). Legalább 1 kötelező.
* **Előnézet**: „Így látják majd mások a kérésed” — a kérés-kártya `preview` módja (mint a `BuzinessItem preview`).
* **Validáció**: a gomb aktív marad, kattintásra jelöli a hibákat (error keret, ikonos HelperText **12 px**-en, mert a téma `bodySmall` mobilon 10 px), első hibához görget, Snackbar jelez. Letiltott gomb nem mondja meg, miért.
* **Feltöltés**: blokkoló `showLoading` (mint a biznisznél) a képek haladásával. A kérés sora előbb jön létre, a képek utána (mint a komment-képeknél); képhiba nem veszíti el a kérést, csak Snackbar jelez. A vázlat-mentés (`useBuzinessDraft` mintája) opcionális, hasznos lenne.

### Meglévő kérés oldal

* Fejléc: `MyAppbar title="Kérés"`; `setOptions` mint a biznisznél: idegennek 2 elem (Jelentés, Felhasználó letiltása → ⋮ menü), a létrehozónak 1 elem (Törlés, egy ikon).
* Hero: szerző (koppintásra profil), idő · hely, teljes szöveg, galéria (swipe, „1 / 3” + pontok, koppintásra teljes képernyő a komment-képekhez hasonló modalban), kulcsszavak, 50 px magas pill elsődleges gomb: idegennek „Hozzászólok”, létrehozónak „Megoldódott”.
* „Hol kérik?” kártya: térkép-előnézet kör + pont (`FiFeMap` + `Circle`), körzet, távolság tőled; „Bárhol” kérésnél ikonos szöveg-kártya.
* „Hozzászólások (N)”: a `Comments` komponens (`path="kerelem/" + id`), a stílus a meglévő.
* **Saját / idegen különbségek**

| | Idegen | Saját |
|---|---|---|
| Elsődleges gomb | Hozzászólok (a mezőre görget) | Megoldódott (megerősítéssel) |
| Fejléc | ⋮: Jelentés, Letiltás | Törlés ikon |
| Név mellett | – | „(te)” |
| Megoldott állapot | szalag, nincs CTA | szalag + „Újranyitás” |
| Komment-menü | Jelentés, letiltás, profil | saját kommentre Törlés |
| Jelentés | van (`ReportContentModal`) | nincs |

* Megoldott állapotban a kép és a tartalom változatlan, a tetején zöld (`nature`) szalag „Megoldva · 3 napja”. Bejelentkezés nélküli nézet nincs (kérésre kimaradt).

---

## Akadálymentesség

**Érintési felületek (min. 44×44 px)**

| Elem | Vizuális méret | Megoldás |
|---|---|---|
| ⋮ a kártyán | 22 px ikon | 44×44 px `IconButton` (a Comments mostani 18 px-es ikonja ~34 px-es felület: a kérés-kommentekben 44 px-esre javasolt) |
| Szűrő/típus chip | 32 px | `hitSlop` 6 px fent/lent (a chipek köze 8 px, nincs átfedés) |
| „Mind ›” a home fejlécében | 18 px ikon + szöveg | 44 px magas sor |
| Kártya lábléc (komment, akció) | 14 px szöveg | 44 px magas sor |
| Törlés ikon a képcsempén | 24 px | 44×44 px felület a csempe sarkában |
| Sugár-chipek, kulcsszó-chip ✕ | 32 / 16 px | 44 px-es felület (`hitSlop`, ✕ 44×44) |
| Bottom nav gombok | – | változatlan (≥ 60 px) |
| Radio sorok a jelentésben | – | meglévő, 48 px |

**Kontrasztok** (a téma-tokenekből számolva, WCAG)

| Használat | Pár | Világos | Sötét |
|---|---|---|---|
| Szöveg kártyán | `onBackground` / `elevation.level2` | 16,25 | 9,93 |
| Másodlagos szöveg kártyán | `onSurfaceVariant` / `level2` | 8,83 | 7,45 |
| Kiválasztott chip, egyező kulcsszó | `onSecondaryContainer` / `secondaryContainer` | 7,20 | 7,20 |
| „Illik a bizniszedhez”, FAB | `onTertiaryContainer` / `tertiaryContainer` | 7,68 | 7,68 |
| Contained gomb | `onPrimary` / `primary` | 21,00 | 10,08 |
| Text gomb a láblécben | `primary` / `level2` | 19,88 | 7,51 |
| Hibaszöveg | `error` / `elevation.level1` | 6,31 | 8,43 |
| Snackbar | `inverseOnSurface` / `inverseSurface` | 11,63 | 10,21 |
| Megoldva ikon (grafika, ≥3:1) | `nature` / `level2` | 3,47 | 3,49 |
| Űrlap-keret, szaggatott csempe (≥3:1) | `outline` / `background` | 4,38 | 5,29 |

Tudatosan elkerültek / észrevételek a meglévő arculatról:

* `onNature` / `nature` világos módban csak **3,66:1** (a meglévő „ingyenes” chip is ilyen). Ezért a „Megoldva” jelvény nem nature-kitöltéses szöveg, hanem ikon (grafika) + `onBackground` szöveg.
* `tertiary` kis szövegként sötétben 4,18:1 a kártyán, ezért a „Neked” jelvény `tertiaryContainer` alapú.
* `secondary` a `background`-on világosban **4,10:1**: a szekciófejlécek (`labelLarge` bold 16 px: „Bizniszek neked”, „FiFe Radar”, új „Kérések neked”) a meglévő stílust követik, de ez kis szövegre nem éri el a 4,5:1-et. Javaslat külön ticketre: sötétebb `secondary` világos módban, vagy `onSecondaryContainer` a fejlécekre.
* `outlineVariant` (chip-keret, elválasztó vonalak) 1,66–1,84:1: dekoratív; a chip állapotát nem a keret, hanem a kitöltés + betűvastagság mutatja, és `accessibilityState={{ selected }}` kell rá.
* A Light kártya-háttér (`level2`) alig különbözik a `background`-tól; ez a meglévő BuzinessItem megjelenése, a kártyahatárt nem kontraszt jelzi.

**Egyebek**: az állapotot soha nem csak szín jelzi (Megoldva = ikon + szöveg, kiválasztott chip = kitöltés + `accessibilityState`, hiba = ikon + szöveg + keret); a ⋮, ✕, törlés, galéria gomboknak `accessibilityLabel`; a kártya összefoglaló `accessibilityLabel`-t kap („Kovács Anna, 2 órája, Újpest, megoldva, 4 hozzászólás”) és a ⋮ külön fókuszálható; a skeleton animáció `prefers-reduced-motion` esetén áll (RN-ben `AccessibilityInfo.isReduceMotionEnabled`); a szöveg a rendszer betűméretével skálázódik, a sorok `minHeight`-ot használnak, nem fix magasságot (a 17 px-es törzs és a 44 px-es sorok ezt elbírják); a lista és a galéria elemei megnevezett kép-leírást kapnak (`alt`: „Kép 1 / 3 a kérésben”).

---

## Komponens-leképezés (mit lehet újrahasználni)

| Terv eleme | Meglévő komponens | Megjegyzés |
|---|---|---|
| Kommentek a részletező oldalon | `components/comments/Comments.tsx` | `path="kerelem/" + id`; új `closed` prop a megoldott kérésnél |
| Jelentés modal | `components/user/ReportContentModal.tsx` | új `targetType: "kerelem"`, `targetNouns.kerelem = "ezt a kérést"`, DB `reports.target_type` bővítés |
| Felhasználó letiltása | `components/user/BlockUserModal.tsx` | ⋮ menüből; a feed is szűrje ki a letiltottak kéréseit |
| Kulcsszavak | `components/TagInput.tsx` (`suggest`) | változtatás nélkül; a címke-szótár közös a bizniszekkel |
| Helyválasztás | `components/MapSelector/MapSelector.tsx` (`markerOnly`) | változtatás nélkül; a sugarat új `RadiusChips` állítja |
| Térkép-előnézet | `components/mapView/FiFeMap.tsx` + `Marker`, `Circle` | mint a `biznisz/[id].tsx` „Helyzete” blokk, plusz kör |
| Kulcsszó-chip | `components/CategoryChip.tsx` | az egyező kulcsszóra `style={{ backgroundColor: theme.colors.secondaryContainer }}` + `textStyle` |
| Meta-sor | `components/MetaStat.tsx` | `map-marker`, `comment-outline`, `wifi` ikonokkal |
| Képek betöltése | `components/SupabaseImage.tsx` | `bucket="kerelmek"` (új bucket, publikus olvasás) |
| Szerzői avatar | `components/ProfileImage.tsx` | 40 / 48 px, `BorderRadius.md` |
| Fejléc | `components/MyAppBar.tsx` | `FakeSearchInput` a listán (új `mode="kerelem"`, „Keress kérésekre...”), cím az űrlapon és a részleteken |
| Szekciófejlécek, hátterek, szövegek | `ThemedView`, `ThemedText`, `buziness/SectionLabel` | |
| Űrlap-váz | `buziness/BuzinessEditScreen.tsx` mintája | `SectionLabel`, `Surface`, `SegmentedButtons`, beküldő sáv |
| Gombok | `components/Button.tsx` | `contained-tonal`, pill (`BorderRadius.pill`) a részleteken |
| Megerősítő dialógus | `redux/reducers/infoReducer` `showDialog` → `InfoLayer` | „Megoldódott?” / „Megoldva” |
| Betöltő dialógus, Snackbar | `showLoading`, `addSnack` | |
| Billentyű-kezelés modalban | `components/KeyboardAwareModal.tsx` | a jelentés modal már használja |
| Nem található oldal | `components/ErrorScreen.tsx` | |
| Lista-adat | `hooks/useNearbyBuzinesses.ts` mintája | új `useNearbyKerelmek` / `useKerelmek(filter)` |
| Hely a profilból | `hooks/useMyLocation.ts` | „Neked” és az alapértelmezett hely |

**Új komponensek**: `KerelemItem` (kártya, `compact` változattal a home-hoz), `KerelemSection` (home szekció), `KerelemFilterChips`, `KerelemImageGrid` / `KerelemGallery`, `RadiusChips`, `KerelemEditScreen` (+ egyszerű képválasztó-rács), `KerelemSkeleton`.

**Implementációs csapdák, amiket a tervek feltételeznek**

* `app/home.tsx`: `stickyHeaderIndex = 1` a „Bizniszek” fejlécet jelöli a ScrollView gyerekei között; a szekció beszúrásával **2** lesz.
* `app/_layout.tsx`: `showBottomNav` kivétel a `/kerelmek/new`-ra (mint `/biznisz/new`); `Stack.Screen` a három új útvonalra (`kerelmek/index`, `kerelmek/new`, `kerelmek/[id]`, a belépés-védett csoportban).
* `BottomNavigation.tsx`: `usActive` kapja meg a `segment[0]?.includes("kerelmek")` feltételt; az elválasztó a Közösség `Measure` elem és az Otthon gomb közé kerül:
  `<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: Spacing.xxl, alignItems: "center", justifyContent: "center" }}><View style={{ width: 1, height: 36, backgroundColor: theme.colors.outlineVariant }} /></View>`
* `SearchMode` típus (`redux/store.type.ts`): `"biznisz" | "fife" | "kerelem"`, a `previousSearches` külön előzményt kap.
* A kérés-képek külön storage bucket; a törléskor takarítani kell.

**Backend-javaslat** (a terv nem tartalmaz migrációt): `kerelmek(id, author, text, location geography null, radius_m int null, place_name text null, tags text[], images text[], solved_at timestamptz null, created_at)`; RLS: olvasás a bejelentkezetteknek, írás/törlés/`solved_at` csak a szerzőnek; „Neked” sorrend RPC-ben (egyező kulcsszó → távolság → idő), letiltottak kiszűrésével.

---

## Tokenek (assets/theme.ts, constants/*)

| Token | Világos | Sötét |
|---|---|---|
| `primary` / `onPrimary` | `#000000` / `#ffffff` | `#f0c048` / `#1e1b16` |
| `secondary` / `onSecondary` | `#DF442E` / `#ffffff` | `#FF5C42` / `#1e1b16` |
| `secondaryContainer` / `on…` | `#FADEBC` / `#56442A` | `#56442A` / `#FADEBC` |
| `tertiary` / `onTertiary` | `#644fab` / `#ffffff` | `#9b7fff` / `#1e1b16` |
| `tertiaryContainer` / `on…` | `#e7deff` / `#463D66` | `#463D66` / `#e7deff` |
| `nature` / `onNature` | `#0F995D` / `#ffffff` | `#0F995D` / `#1e1b16` |
| `error` / `errorContainer` | `#ba1a1a` / `#ffdad6` | `#ffb4ab` / `#93000a` |
| `background` / `onBackground` | `#FFFCF5` / `#1e1b16` | `#1e1b16` / `#e8e2d9` |
| `surface` (appbar, chipek) | `#ffedc8` | `#2d2a23` |
| `surfaceVariant` / `onSurfaceVariant` | `#FFF5E0` / `#4d4639` | `#3d3a33` / `#cdc5b4` |
| `outline` / `outlineVariant` | `#7e7667` / `#d0c5b4` | `#968e7e` / `#4d4639` |
| `inverseSurface` / `inverseOnSurface` | `#33302a` / `#f7f0e7` | `#e8e2d9` / `#33302a` |
| `elevation.level1…5` | `#FFFCF5 #FFF8EB #FFF5E0 #FFF1D6 #FFEECC` (hsla(40,100%,98…90%) hexre váltva) | `#2d2a23 #35322b #3d3a33 #45423b #4d4a43` |
| `backdrop` | `rgba(54,48,36,.4)` | ugyanaz |

* `Spacing`: xs 4, sm 8, md 12, lg 16, xl 20, xxl 24, xxxl 32.
* `BorderRadius`: xs 4, sm 6, md 8, lg 12, xl 16, pill 30, full 1000.
* Típus (mobil, `<=600 px`): `titleLarge` Piazzolla-ExtraBold 22/28, `titleMedium` 16/24, `titleSmall` 14/20, `labelLarge` RedHatText-Bold 16/20, `labelMedium` RedHatText-Medium 12/16, `bodyMedium` RedHatText-Light 17/24, `bodySmall` 10/18, alap (MetaStat) RedHatText 12/22.
* Árnyék: az app témában `shadow: #00000000`, minden felület lapos, a mockupokban is (a menü és a modalok kivételével, ahol az olvashatóság miatt halvány árnyék van).

**Használt MDI ikonok**: `account`, `account-cancel`, `account-group(-outline)`, `alert`, `alert-circle-outline`, `alert-octagon`, `arrow-left`, `arrow-right`, `briefcase-check-outline`, `briefcase-outline`, `check`, `check-circle(-outline)`, `chevron-right`, `close`, `comment-outline`, `comment-plus-outline`, `comment-search-outline`, `crosshairs-gps`, `delete`, `dots-vertical`, `filter`, `hand-heart-outline`, `help-circle-outline`, `history`, `home-variant(-outline)`, `image-outline`, `image-plus`, `lock-outline`, `magnify`, `map-marker`, `map-marker-radius`, `message(-outline)`, `minus`, `plus`, `progress-clock`, `restore`, `send`, `wifi`. A `hand-heart-outline`, `map-marker-radius`, `briefcase-check-outline`, `comment-search-outline` nevét érdemes ellenőrizni a projekt tényleges `@expo/vector-icons` MDI verziójában (a mockup 7.4.47-es útvonalakkal készült).

---

## Nyitott kérdések

1. **„Megoldott” szűrő hatóköre**: mindenki megoldott kérései a körzetben (ezt rajzoltuk), vagy csak a sajátjaid / amihez hozzászóltál? Publikus archívum hasznos (tanulság, bizalom), de a magánjellegű kérések is megmaradnak.
2. **Újranyitás**: a briefben nincs; javasoljuk (véletlen koppintás ellen). Kell-e korlát (pl. 30 nap)?
3. **Szöveg vs. cím**: egy mező van. Ha a home kártyáján külön, kiemelt cím kell, érdemes bevezetni egy opcionális 80 karakteres címet (a `BuzinessItem` is „cím + leírás”).
4. **Szerkesztés**: nem szerepel a ⋮ menüben (Jelentés / Letiltás / Törlés / Megoldva). Hibás szöveg javítására kell-e?
5. **Hely-megjelenítés**: a „Újpest” helynév reverse geocode-ból jön (LocationIQ, mint a címkereső), és el kell tárolni (`place_name`). A kártya pontos pont helyett körzetet mutat; elég-e adatvédelmi szempontból a pont + sugár, vagy a pontot ki kell kerekíteni?
6. **„Neked” rangsor súlyozása**: kulcsszó-egyezés elsőbbsége a távolsággal szemben; hány bizniszt vesz figyelembe, számít-e a kérés kora? Kell-e „Miért látom ezt?” magyarázat (most csak a jelvény).
7. **Értesítések**: kapjon-e értesítést a létrehozó új kommentről, és a hozzászólók a megoldásról? (Nem része a tervnek.)
8. **Spam/moderáció**: napi limit új kérésekre, képméret-korlát (a terv 10 MB), a törölt felhasználók kéréseinek sorsa.
9. **Kulcsszó vs. címke** szóhasználat: az appban „kulcsszó”; a termékgazda „címke”-ként hívja. Egységesítendő.
10. **Világos mód szekciófejléc-kontraszt** (`secondary` 4,10:1): javítsuk-e globálisan (lásd kontrasztok)?
11. **Bejelentkezés nélküli megosztás** (mint a publikus bizniszeknél) kimaradt a brief szerint; később külön döntés.

---

## A mockupok újragenerálása és korlátai

```
node design/kerelmek/_src/build.js               # lista.html, uj-kereses.html, kerelem.html
node design/kerelmek/_src/shot.js [lista|...]    # Playwright: screens/*.png (390 és 860 px széles viewport)
```

A szkriptek csak Node-ot és (a képekhez) a `playwright` csomagot igénylik. Az ikon-útvonalak az `_src/icons.json`-ban vannak (új ikonhoz: `node _src/addicons.js <@mdi/js/mdi.js> név…`).

Korlátok, amiket a tervezésnél figyelembe kell venni:

* A repóban nincs `node_modules`, ezért a React Native Paper komponensek méreteit (Chip 32 px és 14 px-es felirat, Button 40 px, FAB 56 px, Dialog 28 px sarok, TextInput outlined) az MD3 alapértékekből és az app kódjából vettük; a pontos pixelek eltérhetnek. A betűméretek a téma mobil értékei.
* A fotók és a térkép illusztrációk (flat SVG), nem valódi tartalom; a térkép színei a `mapStyles.ts` palettáját követik, a kör a MapSelector `Circle` színeit (`#00000044/#00000028`, sötétben `#ffffffaa/#ffffff44`).
* A „bottom nav” alsó 16 px-es sávja a gesztus-sáv (`insets.bottom`) becslése.

## Implementáció vs. terv (eltérések)

- **Home sáv**: a kártyasor megvan, a záró "Mind a N kérés" kártya nincs; a "Mind" link és a "+" a fejlécben van.
- **Újranyitás**: nincs a UI-ban (az adatbázis engedi, a gomb nyitott kérdés marad).
- **Űrlap**: a beküldés gomb tiltott, amíg a cím nincs meg (nem kattintásra validál). Sugár-chipek: 1/3/5/10/25 km.
- **Komment megoldott kérésnél**: a terv szerint olvasható, a mező zárt (`Comments` `closed` prop).
- **Bottom nav**: 1 px × 36 px vonal, a két oldalán 12 px margó.
- **Szűrők sorrendje**: Mind (alapértelmezett), Neked, Saját, Megoldott.
