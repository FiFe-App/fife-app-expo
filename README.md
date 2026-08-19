
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
