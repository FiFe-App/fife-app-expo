import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { logout } from "@/lib/redux/reducers/userReducer";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { Link } from "expo-router";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

export default function Index() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const startLogout = () => {
    dispatch(logout());
  };

  return (
    <ThemedView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
      }}
    >
      <ThemedText type="title">Kapcsolódj a közeledben élőkkel</ThemedText>
      <ThemedText type="subtitle">
        Lokáció és megbízhatóság alapú közösség.
      </ThemedText>
      {uid ? (
        <>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Link href="/user" asChild>
              <Button mode="contained">Profilom</Button>
            </Link>
            <Button mode="contained" onPress={startLogout}>
              Kijelentkezés
            </Button>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Link href="/biznisz" asChild>
              <Button mode="contained">Biznisz</Button>
            </Link>
            <Link href="/biznisz/new" asChild>
              <Button mode="contained">Új Biznisz</Button>
            </Link>
          </View>
        </>
      ) : (
        <>
          <Link href="/csatlakozom" asChild>
            <Button mode="contained">Mi is ez?</Button>
          </Link>
          <Link href="/login" asChild>
            <Button mode="contained-tonal">Bejelentkezés</Button>
          </Link>
        </>
      )}
      <Link href="/notfound" asChild>
        <Button>Eltévedek</Button>
      </Link>
    </ThemedView>
  );
}
