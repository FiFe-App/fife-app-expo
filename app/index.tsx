import Smiley from "@/components/Smiley";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { logout } from "@/lib/redux/reducers/userReducer";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { Link, Redirect } from "expo-router";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

export default function Index() {
  const { uid, name }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const dispatch = useDispatch();
  const startLogout = () => {
    dispatch(logout());
  };

  if (uid)
    return (
      <ThemedView style={{ flex: 1 }}>
        <Redirect href="/biznisz" />
      </ThemedView>
    );

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
        <Smiley style={{ width: 100, height: 100 }} />
        <Text style={{ zIndex: -1, textAlign: "center" }}>
          <ThemedText style={{}}>Üdövözzlek a FiFe Appban!</ThemedText>
          {"\n"}
          <ThemedText>Ez egy szerető budapesti közösség.</ThemedText>
          {"\n"}
          {uid && (
            <ThemedText type="defaultSemiBold">
              Bejelentkezve, mint {name}
            </ThemedText>
          )}
        </Text>
      </View>
      <View style={{ margin: 8, gap: 16, marginBottom: 24, zIndex: -1 }}>
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
