import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { StyleSheet, View } from "react-native";

const Register = () => {
  return (
    <ThemedView style={{ flex: 1, padding: 8, alignItems: "center" }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ThemedText
          type="subtitle"
          style={{ textAlign: "center", marginBottom: 16 }}
        >
          Ez egy online eszköz, ami a valóságban segít boldogulni.
        </ThemedText>
        <ThemedText style={{ textAlign: "center", marginHorizontal: 16 }}>
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
