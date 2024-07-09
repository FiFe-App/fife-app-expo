import { View } from "react-native";
import axios from "axios";
import { Link } from "expo-router";
import { Button } from "react-native-paper";
import { UserState } from "@/lib/redux/store.type";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";

export default function Index() {
  const { userData }: UserState = useSelector((state: RootState) => state.user);
  axios.defaults.headers.common["Authorization"] = userData?.authorization;
  axios.defaults.baseURL = "http://localhost:8888/.netlify/functions/index";

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
