import { View } from "react-native";
import axios from "axios";
import { Link } from "expo-router";
import { Button } from "react-native-paper";

export default function Index() {

  axios.defaults.baseURL = 'http://localhost:8888/.netlfiy/functions/index';
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
      }}
    >
      <Link href="/mapTest" asChild>
        <Button mode="contained">Térkép kereső</Button>
      </Link>
      <Link href="/loginTest" asChild>
        <Button mode="contained">Bejelentkezés</Button>
      </Link>
      <Link href="/commentsTest" asChild>
        <Button mode="contained">Kommentek</Button>
      </Link>
      <Link href="/notfound" asChild>
        <Button>Eltévedek</Button>
      </Link>
    </View>
  );
}
