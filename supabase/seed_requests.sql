-- Seed a "kérések" (public.requests) funkcióhoz.
--
-- A seed.sql UTÁN kell futnia (a config.toml [db.seed] sql_paths sorrendje ezt biztosítja),
-- mert a seed.sql profiljaira (public.profiles) és felhasználóira (auth.users) hivatkozik.
-- Új felhasználót nem hoz létre.
--
-- Tartalom: 22 kérés (15 nyitott, 7 megoldott, 4 "Bárhol"), 40 komment a request/<id> kulcs
-- alatt és 4 jelentés. Minden felhasználónak legfeljebb 2 nyitott kérése van (a limit: 10).
-- A seed.sql profiljai közül egyiknek sincs bad_boy = true; a beszúrások ettől függetlenül
-- kihagyják a bad_boy profilokat, ahogy a kérések is csak a normál "világban" élnek.
--
-- Idempotens: a requests / comments / reports sorok explicit id-t kapnak és
-- ON CONFLICT (id) DO NOTHING-gal mennek be, így az újrafuttatás nem duplikál. A
-- created_at / solved_at az első futás idejéhez (now()) viszonyított; újrafuttatáskor a
-- már meglévő sorok változatlanok maradnak.
--
-- A címkék egy része szándékosan egyezik a seed.sql bizniszeinek címkéivel (kertész, kutya,
-- séta, javítás, bútor, festés, lakás, logó, grafikus, torta, futás, sport, asztalos, kávé,
-- kávézó, piac, zöldség, fotós, esküvő, portré, közösség ...), így a requests_feed
-- 'for_me' nézetében az illeszkedő kérések előre kerülnek (is_match).
--
-- Nincs session_replication_role: a requests_before_write trigger (max. 10 nyitott kérés /
-- szerző, solved_at konzisztencia) minden sorra ténylegesen lefut.
--
-- KÉPEK: az images oszlop a 'requests' storage bucket objektumútvonalait tárolja
-- (<uid>/<requestId>/<fájl>). A seedben nincs valódi fájl, ezért a legtöbb kérésnél üres.
-- Három kérésnél (1001, 1010, 1012) van útvonal: az SQL ettől hibátlan, de a kép csak akkor
-- jelenik meg, ha az objektumot kézzel feltöltöd a 'requests' bucketbe pontosan erre az
-- útvonalra (Studio > Storage > requests). Feltöltés nélkül a kártyán törött kép látszik.

-------------------------------------------------------------------
-- 1. Kérések
-------------------------------------------------------------------
INSERT INTO public.requests
  (id, created_at, author, title, description, tags, images, location, radius, status, solved_at)
SELECT
  v.id,
  now() - v.created_ago,
  v.author::uuid,
  v.title,
  v.description,
  v.tags,
  v.images,
  CASE WHEN v.lon IS NULL THEN NULL
       ELSE extensions.st_setsrid(extensions.st_makepoint(v.lon::double precision, v.lat::double precision), 4326)::extensions.geography
  END,
  v.radius::real,
  v.status,
  CASE WHEN v.status = 'solved' THEN now() - v.solved_ago END
FROM (VALUES
  -- 1001 | nyitott | Zugló | kertész: illeszkedik Nora "Kert Guru" bizniszéhez
  (1001, 'f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f' /* anna */,
   'Kertészt keresek fűnyírásra és sövényvágásra',
   'Zuglóban, a Mexikói út közelében lakunk, egy kis családi ház kb. 150 m²-es kerttel. Havonta egyszer kellene valaki, aki lenyírja a füvet és megigazítja a sövényt, de egyszeri alkalomra is örülök a segítségnek. Fűnyíró van, sövénynyíró viszont nincs.',
   ARRAY['kertész','fűnyírás','sövény','kert'],
   -- Kézzel feltöltendő fájl a requests bucketbe: f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f/1001/kert.jpg
   ARRAY['f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f/1001/kert.jpg'],
   19.1121, 47.5195, 3000, 'open', INTERVAL '6 days 4 hours', NULL::interval),

  -- 1002 | nyitott | Újpest | friss (órák)
  (1002, '11223344-5566-4778-8990-aabbccddee00' /* peter */,
   'Fúrógépet kölcsönkérnék egy délutánra',
   'Újpesten költöztem új lakásba, és pár polcot meg egy tévéállványt kellene felfúrnom betonfalba. Ütvefúró jó lenne fúrószárakkal. Vigyázok rá, és szívesen hozok érte egy sört vagy valami süteményt cserébe. Holnap vagy hétvégén bármikor jó.',
   ARRAY['fúrógép','kölcsönzés','barkács'],
   '{}'::text[],
   19.0912, 47.5585, 2000, 'open', INTERVAL '3 hours', NULL),

  -- 1003 | nyitott | Buda, Móricz Zsigmond körtér
  (1003, '22334455-6677-4889-9001-bbccddeeff11' /* reka */,
   'Matek korrepetálás 8. osztályosnak',
   'A lányom 8.-os, és a felvételi előtt jól jönne heti 1-2 alkalom matekból (törtek, egyenletek, geometria). Nálunk is lehet a Móricz Zsigmond körtér közelében, vagy online. Egyetemista is jöhet, ha türelmes. Az órabérről megegyezünk.',
   ARRAY['korrepetálás','matek','tanítás','felvételi'],
   '{}'::text[],
   19.0467, 47.4786, 5000, 'open', INTERVAL '12 days', NULL),

  -- 1004 | megoldott | Zugló, Örs vezér tere | javítás: illeszkedik Judit "Varroda Márti" bizniszéhez
  (1004, 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01' /* luna */,
   'Elromlott a bicikli váltója, kerékpárszerelőt keresek',
   'A hátsó váltó beragadt, és a kerék is nyolcasban van. Zuglóban, az Örs vezér tere környékén keresek valakit, aki hétköznap este is ráér, és megnézné.',
   ARRAY['biciklijavítás','kerékpár','javítás'],
   '{}'::text[],
   19.1353, 47.5032, 3000, 'solved', INTERVAL '33 days', INTERVAL '30 days'),

  -- 1005 | nyitott | Pestszentlőrinc | kutya, séta: illeszkedik Klara "Kutyasétáltató Dóri" bizniszéhez
  (1005, '99aaccdd-ddee-4ff0-0115-223344556688' /* tamas */,
   'Kutyasétáltatás hétköznap délutánonként',
   'Van egy 3 éves labradorom, Bodri, aki imádja a hosszú sétákat. Hétköznap 14 és 17 óra között kellene valaki, aki kivinné egy órára Pestszentlőrincen. Szelíd, jól szót fogad, pórázon is nyugodt. Heti 3-4 alkalom, természetesen fizetek érte.',
   ARRAY['kutya','séta','kutyasétáltatás'],
   '{}'::text[],
   19.1815, 47.4390, 2500, 'open', INTERVAL '1 day 6 hours', NULL),

  -- 1006 | megoldott | Csepel
  (1006, 'aabbddee-eeff-4001-1226-334455667799' /* judit */,
   'Két erős kéz kellene a költözéshez szombaton',
   'Csepelen költözöm egy másik lakásba, a harmadikról a földszintre. Nincs sok cucc, de a gardróbszekrény és a mosógép egyedül nehéz. Két-három óra az egész, utána pizza van.',
   ARRAY['költözés','segítség','cipekedés'],
   '{}'::text[],
   19.0765, 47.4380, 4000, 'solved', INTERVAL '28 days', INTERVAL '26 days'),

  -- 1007 | nyitott | Kispest
  (1007, '55667788-99aa-4bbc-cdd1-eeff00112244' /* gabor */,
   'Bébiszitter szombat esténként',
   'Kispesten élünk, két gyerekünk van (3 és 6 évesek). Havonta 1-2 szombat este kellene valaki, aki vigyáz rájuk 18-tól kb. 23 óráig, a kicsik addigra már alszanak. A referencia előny, de a legfontosabb, hogy megbízható és barátságos legyen.',
   ARRAY['bébiszitter','gyerekfelügyelet','esti'],
   '{}'::text[],
   19.1494, 47.4527, 4000, 'open', INTERVAL '9 days', NULL),

  -- 1008 | nyitott | Óbuda | javítás: illeszkedik Judit bizniszéhez
  (1008, '44556677-8899-4aab-bcc0-ddeeff001133' /* eszter */,
   'Nem indul a laptopom, ki tudna ránézni?',
   'Egy 5 éves Lenovo laptopom van, bekapcsoláskor csak a ventilátor zúg, a kép nem jön be. Fontos fájlok vannak rajta, ezért szeretném, ha valaki, aki ért hozzá, megnézné, mielőtt boltba viszem. Óbudán vagyok, elviszem vagy elmegyek hozzád.',
   ARRAY['számítógép','laptop','javítás'],
   '{}'::text[],
   19.0449, 47.5385, 5000, 'open', INTERVAL '2 days 5 hours', NULL),

  -- 1009 | megoldott | Angyalföld | közösség: illeszkedik Marci "Futó Klub" bizniszéhez
  (1009, '66778899-aabb-4ccd-dee2-ff0011223355' /* nora */,
   'Vasárnapi közös főzés - van kedv?',
   'Szeretném, ha lenne a környéken egy kis társaság, akikkel vasárnaponként együtt főzünk valami nagyot (gulyás, tészta, bármi), és közösen megesszük. Az Angyalföldön van egy nagy konyhám, a hozzávalókat összedobjuk.',
   ARRAY['főzés','közösség','étel'],
   '{}'::text[],
   19.0557, 47.5153, 2500, 'solved', INTERVAL '44 days', INTERVAL '37 days'),

  -- 1010 | nyitott | Pesthidegkút | bútor, felújítás: illeszkedik Zsofi "Bútorfelújító Andris" bizniszéhez
  (1010, '7788aabb-bbcc-4dde-eff3-001122334466' /* adam */,
   'Ingyen elvihető: kopott szekrény és íróasztal',
   'Pesthidegkúton kisebb lakásba költözöm, ezért két tömörfa darab feleslegessé vált: egy háromajtós szekrény és egy íróasztal. Kicsit kopottak, de stabilak, ha valaki felújítaná, tökéletes lesz. Elvitelhez autó és két ember kell, a cipelésben segítek.',
   ARRAY['bútor','ingyen','elvihető','felújítás'],
   -- Kézzel feltöltendő fájlok a requests bucketbe:
   --   7788aabb-bbcc-4dde-eff3-001122334466/1010/szekreny.jpg
   --   7788aabb-bbcc-4dde-eff3-001122334466/1010/iroasztal.jpg
   ARRAY['7788aabb-bbcc-4dde-eff3-001122334466/1010/szekreny.jpg','7788aabb-bbcc-4dde-eff3-001122334466/1010/iroasztal.jpg'],
   18.9630, 47.5535, 8000, 'open', INTERVAL '4 days', NULL),

  -- 1011 | nyitott | Bárhol
  (1011, 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e' /* marci */,
   'Angol beszélgetőpartnert keresek',
   'Dolgozom, a nyelvtant elég jól ismerem, de beszélni szinte sosem merek. Heti egy-két alkalommal online beszélgetnék valakivel angolul, lehet anyanyelvi vagy haladó is. Cserébe segítek magyarban vagy bármiben, amiben tudok.',
   ARRAY['angol','nyelvlecke','beszélgetés'],
   '{}'::text[],
   NULL, NULL, NULL, 'open', INTERVAL '17 days', NULL),

  -- 1012 | nyitott | Ferencváros | festés, lakás: illeszkedik Eszter és Adam bizniszéhez
  (1012, 'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f' /* zsofi */,
   'Segítség egy szoba kifestéséhez',
   'Ferencvárosban van egy 18 m²-es szobám, amit szeretnék kifesteni, de egyedül nem akarok belevágni. Festésben jártas ember kellene, a festéket és az anyagot megveszem. Két emberrel fél-egy nap alatt megvan.',
   ARRAY['festés','lakás','szobafestés'],
   -- Kézzel feltöltendő fájl a requests bucketbe: c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f/1012/szoba.jpg
   ARRAY['c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f/1012/szoba.jpg'],
   19.0630, 47.4880, 3000, 'open', INTERVAL '5 days 7 hours', NULL),

  -- 1013 | megoldott | Budapest (nagyobb körzet) | fotós, esküvő, portré: illeszkedik Gabor bizniszéhez
  (1013, '33445566-7788-4990-a112-ccddeeff0022' /* david */,
   'Esküvői fotóst ajánl valaki?',
   'A jövő nyári esküvőnkre (Budapest, kb. 60 vendég) keresünk fotóst. A természetes, nem pózolt képek tetszenek. Ha volt jó tapasztalatotok, írjatok, a hozzávetőleges árat is megköszönnénk.',
   ARRAY['fotós','esküvő','portré'],
   '{}'::text[],
   19.0508, 47.4978, 15000, 'solved', INTERVAL '36 days', INTERVAL '22 days'),

  -- 1014 | nyitott | Bárhol | logó, grafikus: illeszkedik Tamas "Kreatív Grafika" bizniszéhez
  (1014, 'bbcceeff-ff00-4112-2337-445566778800' /* balazs */,
   'Logót tervezne valaki a házi cukrászdámhoz?',
   'A házi cukrászatomhoz (torták, sütemények) kellene egy egyszerű, de karakteres logó a dobozokra és a matricákra. Nincs hatalmas keretem, de fair árat fizetek. Online is megoldható, a mintákat szívesen megnézem.',
   ARRAY['logó','grafikus','arculat','csomagolás'],
   '{}'::text[],
   NULL, NULL, NULL, 'open', INTERVAL '8 hours', NULL),

  -- 1015 | megoldott | Újpest | piac, zöldség: illeszkedik Zsofi "Zöld Piac" bizniszéhez
  (1015, 'f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f' /* anna */,
   'Idős szomszédomnak kellene valaki a heti piaci bevásárláshoz',
   'A szomszédom 82 éves, és már nehezen jut el a piacra. Heti egyszer kellene valaki, aki elmegy neki zöldségért, gyümölcsért, és felcipeli a második emeletre. A pénzt előre odaadja, plusz hálás lesz érte.',
   ARRAY['piac','zöldség','bevásárlás','idősgondozás'],
   '{}'::text[],
   19.0912, 47.5585, 1500, 'solved', INTERVAL '14 days', INTERVAL '9 days'),

  -- 1016 | megoldott | Bárhol
  (1016, '22334455-6677-4889-9001-bbccddeeff11' /* reka */,
   'Spanyol nyelvlecke kezdőknek, ki tanítana?',
   'Nyáron Spanyolországba utazunk, és szeretnénk alapokat tanulni. Heti kétszer fél óra online is jó volna, kezdő szinten. Akár kis csoportban, akár egyénileg, a lényeg, hogy a kiejtést is gyakoroljuk.',
   ARRAY['spanyol','nyelvlecke','tanítás'],
   '{}'::text[],
   NULL, NULL, NULL, 'solved', INTERVAL '31 days', INTERVAL '27 days'),

  -- 1017 | nyitott | Újbuda | torta: illeszkedik Balazs "Házi Cukrász Kata" bizniszéhez
  (1017, 'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e' /* bence */,
   'Gluténmentes tortát rendelnék születésnapra',
   'A párom szülinapjára kellene egy kisebb, kb. 8 személyes gluténmentes torta jövő hét végére. Újbudán lakunk, átvenni tudom, ha nincs messze. Ha van jó cukrász az ismeretségben, nagyon hálás lennék az ajánlásért.',
   ARRAY['torta','gluténmentes','születésnap','cukrász'],
   '{}'::text[],
   19.0455, 47.4742, 6000, 'open', INTERVAL '1 day 3 hours', NULL),

  -- 1018 | megoldott | Bárhol (távsegítség)
  (1018, '55667788-99aa-4bbc-cdd1-eeff00112244' /* gabor */,
   'Wifi-router beállításában segítene valaki?',
   'Új routert kaptam a szolgáltatótól, és a vendéghálózat meg a port-továbbítás nem akar menni. Videóhíváson vagy telefonon végigvezetne valaki? Fél óra az egész.',
   ARRAY['internet','wifi','számítógép','távsegítség'],
   '{}'::text[],
   NULL, NULL, NULL, 'solved', INTERVAL '21 days', INTERVAL '20 days 6 hours'),

  -- 1019 | nyitott | Óbuda | futás, sport: illeszkedik Marci "Futó Klub" bizniszéhez | friss (órák)
  (1019, 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01' /* luna */,
   'Futótárs reggelente a Duna-parton',
   'Óbudán lakom, reggel fél hét körül szoktam futni a Duna-parton, de egyedül nehéz kimászni az ágyból. Lassú tempó, kb. 5-6 km, kezdő-középhaladó. Aki hasonló ritmusban él, jelentkezzen!',
   ARRAY['futás','sport','reggel'],
   '{}'::text[],
   19.0405, 47.5390, 3000, 'open', INTERVAL '90 minutes', NULL),

  -- 1020 | nyitott | Rákospalota | asztalos: illeszkedik Zsofi bizniszéhez
  (1020, '11223344-5566-4778-8990-aabbccddee00' /* peter */,
   'Asztalos tanácsot kérnék egy kerti padhoz',
   'A szüleim rákospalotai kertjébe építenék egy padot fenyőből, de a csapolásban és a lakkozásban bizonytalan vagyok. Egy asztalos vagy ügyes barkácsoló egy órát rám szánna egy hétvégén? Szerszám van, az anyagot már megvettem.',
   ARRAY['asztalos','barkács','kert','bútor'],
   '{}'::text[],
   19.1050, 47.5700, 4000, 'open', INTERVAL '20 days', NULL),

  -- 1021 | nyitott | Józsefváros | kávé, kávézó: illeszkedik Marci "Kávé Sarki" bizniszéhez
  (1021, 'aabbddee-eeff-4001-1226-334455667799' /* judit */,
   'Csendes kávézót keresek tanuláshoz',
   'Józsefvárosban vagy Ferencvárosban keresek egy olyan kávézót, ahol laptoppal is lehet ülni pár órát, van wifi, és nincs túl hangos a zene. Ha tudtok jót, írjátok meg, kérlek!',
   ARRAY['kávé','kávézó','wifi','tanulás'],
   '{}'::text[],
   19.0702, 47.4905, 2500, 'open', INTERVAL '11 days', NULL),

  -- 1022 | nyitott | Buda, Széll Kálmán tér | a legrégebbi nyitott kérések egyike
  (1022, '8899bbcc-ccdd-4eef-f004-112233445577' /* klara */,
   'Keretezőt ajánl valaki az akvarelljeimhez?',
   'Kiállításra készülök, és hat akvarellemhez kellene paszpartus keretezés. Budán keresek olyan helyet, ahol hozzáértők, és nem horror az ár. Ha volt jó tapasztalatotok, kérlek, ajánljatok!',
   ARRAY['keretezés','festmény','akvarell','kiállítás'],
   '{}'::text[],
   19.0273, 47.5071, 6000, 'open', INTERVAL '25 days', NULL)
) AS v(id, author, title, description, tags, images, lon, lat, radius, status, created_ago, solved_ago)
JOIN public.profiles p ON p.id = v.author::uuid AND NOT p.bad_boy
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('public.requests', 'id'), (SELECT max(id) FROM public.requests));

-------------------------------------------------------------------
-- 2. Kommentek: key = 'request/<id>'
--
-- A created_at a kérés létrehozásához képest van megadva (delay), és a megoldott
-- kérések alatti utolsó "megoldódott" kommentek a solved_at előtt vannak.
-------------------------------------------------------------------
INSERT INTO public.comments (id, created_at, text, author, key, image)
SELECT
  v.id,
  r.created_at + v.delay,
  v.body,
  v.author::uuid,
  'request/' || r.id,
  NULL
FROM (VALUES
  -- 1001 (kertész)
  (7001, 1001, '66778899-aabb-4ccd-dee2-ff0011223355' /* nora */,   INTERVAL '5 hours',
   'Szia! Kertészkedéssel foglalkozom, Zuglóba is járok, havi alkalmakra is szoktam. Írj privátban, megbeszéljük az árat.'),
  (7002, 1001, 'f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f' /* anna */,   INTERVAL '7 hours',
   'Köszi, Nora! Írok is, mikor lenne jó egy első megnézés?'),
  (7003, 1001, '7788aabb-bbcc-4dde-eff3-001122334466' /* adam */,   INTERVAL '2 days',
   'Ha csak egyszeri alkalomra kéne, sövénynyírót tudok kölcsönadni.'),

  -- 1002 (fúrógép)
  (7004, 1002, 'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e' /* bence */,  INTERVAL '1 hour',
   'Van egy ütvefúróm szárakkal együtt. Újpesten dolgozom, holnap délután oda tudom vinni.'),
  (7005, 1002, '11223344-5566-4778-8990-aabbccddee00' /* peter */,   INTERVAL '2 hours',
   'Ez nagyon jó lenne, köszi! Holnap 5 után tökéletes, megírom a címet.'),

  -- 1003 (korrepetálás)
  (7006, 1003, '33445566-7788-4990-a112-ccddeeff0022' /* david */,  INTERVAL '1 day',
   'Én nyelvet tanítok, matekot nem, de ismerek egy egyetemistát a környékről, aki szokott korrepetálni. Elküldjem a számát?'),
  (7007, 1003, '22334455-6677-4889-9001-bbccddeeff11' /* reka */,   INTERVAL '1 day 2 hours',
   'Igen, légyszi írd meg privátban, köszönöm!'),

  -- 1004 (bicikli, megoldott 3 nap után)
  (7008, 1004, 'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e' /* bence */,  INTERVAL '3 hours',
   'A műhelyben szerdán és pénteken délután vagyok, bármikor hozd el, megnézem a váltót és a kereket is.'),
  (7009, 1004, 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01' /* luna */,   INTERVAL '5 hours',
   'Szuper, szerdán odaviszem, köszi!'),
  (7010, 1004, 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01' /* luna */,   INTERVAL '2 days 20 hours',
   'Köszi mindenkinek, megoldódott! Bence rendbe tette a váltót fél óra alatt.'),

  -- 1005 (kutyasétáltatás)
  (7011, 1005, '8899bbcc-ccdd-4eef-f004-112233445577' /* klara */,  INTERVAL '4 hours',
   'Én is sétáltatok kutyákat, Pestszentlőrincre is ki tudok menni. Írj, és megbeszélünk egy próbasétát!'),
  (7012, 1005, '99aaccdd-ddee-4ff0-0115-223344556688' /* tamas */,  INTERVAL '6 hours',
   'Köszi, Klara! Hány kilós kutyákat vállalsz? A Bodri kb. 32 kilós.'),

  -- 1006 (költözés, megoldott 2 nap után)
  (7013, 1006, '7788aabb-bbcc-4dde-eff3-001122334466' /* adam */,   INTERVAL '3 hours',
   'Szombaton ráérek délután, megyek. Kisteherautóm is van, ha kell.'),
  (7014, 1006, 'aabbddee-eeff-4001-1226-334455667799' /* judit */,  INTERVAL '5 hours',
   'Adam, te vagy az élet! Szombaton 10-kor kezdünk, megírom a pontos címet.'),
  (7015, 1006, 'aabbddee-eeff-4001-1226-334455667799' /* judit */,  INTERVAL '1 day 20 hours',
   'Megoldódott, köszönöm! Adam és a barátja két óra alatt végzett mindennel.'),

  -- 1007 (bébiszitter)
  (7016, 1007, '22334455-6677-4889-9001-bbccddeeff11' /* reka */,   INTERVAL '1 day',
   'Van egy 19 éves ismerősöm Kispestről, gyerekekkel is van tapasztalata. Elkérhetem a számodat neki?'),
  (7017, 1007, '55667788-99aa-4bbc-cdd1-eeff00112244' /* gabor */,  INTERVAL '1 day 3 hours',
   'Igen, kérlek, nagyon megköszönöm!'),

  -- 1008 (laptop)
  (7018, 1008, '55667788-99aa-4bbc-cdd1-eeff00112244' /* gabor */,  INTERVAL '3 hours',
   'IT-s vagyok, szívesen ránézek. Ha jó neked, hozd el hétvégén, vagy írj, mikor érsz rá.'),
  (7019, 1008, '44556677-8899-4aab-bcc0-ddeeff001133' /* eszter */, INTERVAL '5 hours',
   'Köszi! Szombat délelőtt megfelelő lenne?'),

  -- 1009 (közös főzés, megoldott 7 nap után)
  (7020, 1009, 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e' /* marci */,  INTERVAL '1 day',
   'Nagyon jól hangzik! Én a gulyást vállalnám.'),
  (7021, 1009, 'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f' /* zsofi */,  INTERVAL '1 day 4 hours',
   'Beszállnék, vasárnap jó. Hozok a piacról zöldséget.'),
  (7022, 1009, '66778899-aabb-4ccd-dee2-ff0011223355' /* nora */,   INTERVAL '6 days',
   'Köszi mindenkinek, kialakult a kis társaság, már a harmadik vasárnapot főzzük együtt. Lezárom a kérést.'),

  -- 1010 (ingyen bútor)
  (7023, 1010, 'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f' /* zsofi */,  INTERVAL '6 hours',
   'Milyen méretű a szekrény? Én felújítanám, van helyem és autóm is.'),
  (7024, 1010, '7788aabb-bbcc-4dde-eff3-001122334466' /* adam */,   INTERVAL '8 hours',
   'Kb. 200 cm magas és 140 széles, az asztal 120x60. Hétvégén bármikor jöhetsz érte.'),

  -- 1011 (angol)
  (7025, 1011, '33445566-7788-4990-a112-ccddeeff0022' /* david */,  INTERVAL '2 days',
   'Beszélgetni heti egyszer szívesen, de ingyen nem tudom vállalni. Nézd meg a nyelviskolám hirdetését, vagy írj nyugodtan.'),
  (7026, 1011, 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01' /* luna */,   INTERVAL '4 days',
   'Én is keresek hasonlót, csatlakoznék, ha lenne hármas beszélgetés.'),

  -- 1012 (szobafestés)
  (7027, 1012, '7788aabb-bbcc-4dde-eff3-001122334466' /* adam */,   INTERVAL '1 day',
   'Szobafestő vagyok, vasárnap tudok jönni egy kollégával. Írj, és megbeszéljük az árat.'),

  -- 1013 (esküvői fotós, megoldott 14 nap után)
  (7028, 1013, '55667788-99aa-4bbc-cdd1-eeff00112244' /* gabor */,  INTERVAL '1 day',
   'Esküvőket is fotózok Budapesten. Küldök egy linket a portfóliómhoz privátban.'),
  (7029, 1013, '33445566-7788-4990-a112-ccddeeff0022' /* david */,  INTERVAL '2 days',
   'Köszi, Gabor, megnéztük, nagyon tetszik. Egyeztetünk!'),
  (7030, 1013, '33445566-7788-4990-a112-ccddeeff0022' /* david */,  INTERVAL '12 days',
   'Megoldódott, lefoglaltuk Gabort. Köszi mindenkinek a tippeket!'),

  -- 1014 (logó)
  (7031, 1014, '99aaccdd-ddee-4ff0-0115-223344556688' /* tamas */,  INTERVAL '2 hours',
   'Grafikus vagyok, logót szoktam tervezni. Mekkora kb. a keret? Küldök pár korábbi munkát.'),

  -- 1015 (piaci bevásárlás, megoldott 5 nap után)
  (7032, 1015, 'aabbddee-eeff-4001-1226-334455667799' /* judit */,  INTERVAL '6 hours',
   'Ott lakom a közelben, csütörtökönként én is a piacra megyek, vihetek neki.'),
  (7033, 1015, 'f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f' /* anna */,   INTERVAL '8 hours',
   'Köszi, Judit! A csütörtök tökéletes, szólok a szomszédnak.'),
  (7034, 1015, 'f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f' /* anna */,   INTERVAL '4 days',
   'Megoldódott, csütörtök óta Judit viszi a bevásárlást. Köszönöm!'),

  -- 1016 (spanyol, megoldott 4 nap után)
  (7035, 1016, '33445566-7788-4990-a112-ccddeeff0022' /* david */,  INTERVAL '1 day',
   'Spanyol kezdő órákat tartok, kis csoportban és egyénileg is. Írj privátban!'),
  (7036, 1016, '22334455-6677-4889-9001-bbccddeeff11' /* reka */,   INTERVAL '3 days',
   'David, köszi, a heti két alkalom pont jó lesz. Megoldódott!'),

  -- 1017 (torta)
  (7037, 1017, 'bbcceeff-ff00-4112-2337-445566778800' /* balazs */, INTERVAL '3 hours',
   'Házi cukrász vagyok, gluténmentes tortát is készítek. Mikorra és hány főre kellene pontosan?'),
  (7038, 1017, 'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e' /* bence */,  INTERVAL '5 hours',
   'Köszi, Balázs! Jövő péntek estére, 8 főre. Mennyi lenne?'),

  -- 1019 (futótárs)
  (7039, 1019, 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e' /* marci */,  INTERVAL '30 minutes',
   'Nálunk heti rendszeres futások vannak a Duna-parton, de hétköznap reggel is szoktam futni. Írj, és megbeszéljük!'),

  -- 1021 (kávézó)
  (7040, 1021, 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e' /* marci */,  INTERVAL '1 day',
   'A Kávé Sarki szerintem jó választás: csendes, van wifi, és a süti is finom.')
) AS v(id, request_id, author, delay, body)
JOIN public.requests r ON r.id = v.request_id
JOIN public.profiles p ON p.id = v.author::uuid AND NOT p.bad_boy
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('public.comments', 'id'), (SELECT max(id) FROM public.comments));

-------------------------------------------------------------------
-- 3. Jelentések (public.reports, target_type = 'request')
--
-- A reported_profile_id és a target_excerpt a kérésből jön, a ReportContentModal
-- mintájára (a kivonat max. 1000 karakter). Az egyes oszlopok (author, reason,
-- description) NOT NULL-ok, mind ki van töltve.
-------------------------------------------------------------------
INSERT INTO public.reports
  (id, author, reported_profile_id, target_type, target_id, target_excerpt, reason, description)
SELECT
  v.id,
  v.reporter::uuid,
  r.author,
  'request',
  r.id::text,
  left(r.title || E'\n' || r.description, 1000),
  v.reason,
  v.description
FROM (VALUES
  (9001, 'aabbddee-eeff-4001-1226-334455667799' /* judit */, 1010, 'not_trustworthy',
   'Ugyanezt a bútort már a múlt héten is kitette, és az érdeklődőknek nem válaszolt.'),
  (9002, '99aaccdd-ddee-4ff0-0115-223344556688' /* tamas */, 1014, 'spam',
   'Szerintem ez inkább reklám, mint egy konkrét kérés.'),
  (9003, '66778899-aabb-4ccd-dee2-ff0011223355' /* nora */,  1011, 'other',
   'Szerintem nem ide való, ez inkább egy álláskereső vagy tanulótárs hirdetés.'),
  (9004, 'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e' /* bence */, 1020, 'other',
   'Mintha ugyanezt a kérést kétszer is kiírta volna.')
) AS v(id, reporter, request_id, reason, description)
JOIN public.requests r ON r.id = v.request_id
JOIN auth.users u ON u.id = v.reporter::uuid
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('public.reports', 'id'), (SELECT max(id) FROM public.reports));
