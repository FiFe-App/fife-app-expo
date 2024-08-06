import { FirebaseContext } from "@/lib/firebase/firebase";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { Link } from "expo-router";
import { useContext } from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

export default function Index() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const {
    api: { logout },
  } = useContext(FirebaseContext);

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
      {uid ? (
        <>
          <Link href="/user" asChild>
            <Button mode="contained">Profilom</Button>
          </Link>
          <Button mode="contained" onPress={() => logout()}>
            Kijelentkezés
          </Button>
          <Link href="/biznisz" asChild>
            <Button mode="contained">Buziness</Button>
          </Link>
        </>
      ) : (
        <Link href="/loginTest" asChild>
          <Button mode="contained">Bejelentkezés</Button>
        </Link>
      )}
      <Link href="/commentsTest" asChild>
        <Button mode="contained">Kommentek</Button>
      </Link>
      <Link href="/notfound" asChild>
        <Button>Eltévedek</Button>
      </Link>
    </View>
  );
}
