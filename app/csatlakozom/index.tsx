import Smiley from "@/components/Smiley";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { View } from "react-native";

const Register = () => {
  return (
    <ThemedView style={{ flex: 1, paddingTop: 36, alignItems: "center" }}>
      <View style={{ flex: 1 }}>
        <ThemedText
          type="title"
          style={{ textAlign: "left", marginBottom: 16 }}
        >
          Ez egy online eszköz, ami a valóságban segít boldogulni.
        </ThemedText>
        <View
          style={{ alignItems: "center", justifyContent: "center", margin: 24 }}
        >
          <Smiley style={{ width: 100, height: 100 }} />
        </View>
        <ThemedText style={{ marginHorizontal: 16 }}>
          Közösségi oldal, amit a felhasználó kontrollál, nem fordítva. Ami
          összegyűjti a kedves embereket, hogy zavartalanul tudjanak
          kommunikálni, kapcsolódni egy független, biztonságos környezetben. Egy
          alkalmazás, ami az asszertív kommunikációnak, kölcsönös jóindulatnak
          és bizalomnak nyit kaput. Amely a mai városi igényekre igyekszik
          megoldást adni.
        </ThemedText>
      </View>
    </ThemedView>
  );
};

export default Register;
