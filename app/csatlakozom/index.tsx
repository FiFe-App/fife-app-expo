import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { StyleSheet, View } from "react-native";

const Register = () => {
  return (
    <ThemedView style={{ flex: 1, padding: 8, alignItems: "center" }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ThemedText type="title">
          Ez egy online eszköz, ami segít a valóságban boldogulni
        </ThemedText>
        <ThemedText style={{ textAlign: "center", marginHorizontal: 16 }}>
          Ez egy közösségi oldal, ami összegyűjti a kedves embereket, hogy
          zavartalanul tudjanak kommunikálni, egy független, biztonságos
          környezetben. Egy alkalmazás, ami az asszertív kommunikációnak,
          kölcsönös jóindulatnak és bizalomnak nyit kaput. Amely 100%-ig a a
          emberekért, értünk létezik és fejlődik.
        </ThemedText>
      </View>
    </ThemedView>
  );
};

export default Register;
