import SmallChip from "@/components/SmallChip";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Link } from "expo-router";
import { View } from "react-native";
import { Button, Divider, Icon } from "react-native-paper";

const Register = () => {
  return (
    <ThemedView style={{ flex: 1, alignItems: "center" }}>
      <ThemedText type="title" style={{ marginLeft: 8 }}>
        Miért érdemes csatlakoznod?
      </ThemedText>
      <View style={{ padding: 8, margin: 8, marginTop: 16, flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <Icon source="account-group" size={48} />
        </View>
        <ThemedText type="title2">
          Ha kapcsolatokat szeretnél építeni
        </ThemedText>
        <ThemedText>
          Találhatsz például a környékeden élő{" "}
          <SmallChip>programozót</SmallChip>
          <SmallChip>dúlát</SmallChip>
          <SmallChip>baristát</SmallChip>
          <SmallChip>karate edzőt</SmallChip> és még sok mást!
        </ThemedText>
        <Divider style={{ margin: 16 }} />
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <Icon source="earth" size={48} />
        </View>
        <ThemedText type="title2">Ingyen hirdetési lehetőség</ThemedText>
        <ThemedText>
          Egyszer kell megadnod az adataidat és onnantól bármikor megtalálhatnak
          a környéken élő ügyfeleid, ha szükség van rád.
        </ThemedText>
      </View>
      <View style={{ marginBottom: 32 }}>
        <Link asChild href="/csatlakozom/miert-mas">
          <Button mode="contained-tonal">
            Miben más ez az app, mint a többi?
          </Button>
        </Link>
      </View>
    </ThemedView>
  );
};

export default Register;
