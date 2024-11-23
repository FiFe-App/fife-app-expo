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
        <ThemedText style={{ marginHorizontal: 16 }}>
          Közösségi oldal, ahol a felhasználó van kontrollban. Összegyűjtjük a
          kedves embereket, hogy zavartalanul tudjanak kommunikálni, segíteni
          egymásnak egy független, biztonságos környezetben. {"\n\n"}Egy
          alkalmazás, ami az asszertív kommunikációnak, kölcsönös jóindulatnak
          és bizalomnak nyit kaput. Amely a mai városi igényekre igyekszik
          megoldást adni.
        </ThemedText>
      </View>
    </ThemedView>
  );
};

export default Register;
