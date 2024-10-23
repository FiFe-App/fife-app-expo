import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { logout } from "@/lib/redux/reducers/userReducer";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { Image } from "expo-image";
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
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
        }}
      >
        <Image
          source={require("../assets/images/logo.png")}
          style={{ width: 100, height: 100 }}
        />
        <View>
          <ThemedText style={{ textAlign: "center" }}>
            Üdövözzlek a FiFe Appban!
          </ThemedText>
          <ThemedText>Lokáció és megbízhatóság alapú közösség.</ThemedText>
        </View>
      </View>
      <View style={{ margin: 8, gap: 16, marginBottom: 24 }}>
        {uid ? (
          <>
            <Button mode="contained-tonal" onPress={startLogout}>
              Kijelentkezés
            </Button>
            <View style={{ gap: 8 }}>
              <Link href="/user" asChild>
                <Button mode="contained">Profilom</Button>
              </Link>
              <Link href="/biznisz" asChild>
                <Button mode="contained">Biznisz</Button>
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
      </View>
    </ThemedView>
  );
}
