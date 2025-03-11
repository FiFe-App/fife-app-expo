import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { View } from "react-native";

const MiertMas = () => {
  return (
    <ThemedView style={{ padding: 8, alignItems: "center" }}>
      <View style={{}}>
        <ThemedText
          type="title"
          style={{ textAlign: "left", marginBottom: 16 }}
        >
          Miben különbözik a FiFe App, más közösségi platformtól?
        </ThemedText>
        <ThemedText type="title2">Több kontroll</ThemedText>
        <ThemedText>
          Ma már mindent a neten csinálunk. Fontos lenne, hogy olyan felületeket
          használjunk, ami figyel az emberi igényekre, hogy mikor és mennyi időt
          szeretnél az interneten tölteni. Milyen tartalommal szeretnél
          találkozni és milyennel nem. Egyszóval több kontrollt ad a
          felhasználónak. A Fife appon kiemelt cél, hogy figyeljünk az emberek
          testi- és lelki egészségére: testreszabhatósággal és ajánlásokkal.
        </ThemedText>
        <ThemedText type="title2">Közösségi oldal</ThemedText>
        <ThemedText>
          Hányszor hallottuk ezt? A legtöbb “közösségi”-nek mondott oldal
          kimerül a tagok közötti kommunikációban. Mi úgy gondoljuk, ez nem
          elég. Egy valódi közösség tagjai összetartanak, segítik egymást.
          Komment-háborúk helyett a FiFe app funkciói lehetőséget nyújtanak,
          hogy megtudd ki, miben lehet a segítségedre, és fordítva,
          megoszthatod, hogy te miben lehetsz a közösség hasznára.
        </ThemedText>
        <ThemedText type="title2">Segít a mindennapi életben</ThemedText>
        <ThemedText>
          A különböző emberek nagyon különböző problémákkal küzdenek az internet
          korában. Sok olyannal amiről nincs elég párbeszéd, nincs meg rá a
          megfelelő eszköz, támogatás. Ezen a platformon igyekszünk valódi
          problémákra valódi, a mindennapokban használható funkciókat adni.
        </ThemedText>
        <ThemedText type="title2">Meghallgatunk</ThemedText>
        <ThemedText>
          Ahogy egy jó demokráciában, úgy egy jó alkalmazásban is meghallgatjuk
          a felhasználók igényeit. Célunk, hogy minél több igényre tudjunk majd
          választ adni.
        </ThemedText>
      </View>
    </ThemedView>
  );
};

export default MiertMas;
