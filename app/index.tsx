import { Link } from "expo-router";
import { View } from "react-native";
import { Button } from "react-native-paper";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap:24
      }}
    >
      <Link href='/mapTest' asChild>
        <Button mode='contained'>Térkép kereső</Button>
      </Link>
      <Link href='/loginTest' asChild>
        <Button mode='contained'>Bejelentkezés</Button>
      </Link>
      <Link href='/notfound' asChild>
        <Button>Eltévedek</Button>
      </Link>

    </View>
  );
}
