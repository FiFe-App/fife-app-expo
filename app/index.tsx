import Smiley from "@/components/Smiley";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { Link, Redirect } from "expo-router";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useSelector } from "react-redux";

export default function Index() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);

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
          <ThemedText style={{}}>Üdvözöllek a FiFe Appban!</ThemedText>
          {"\n"}
          <ThemedText>Ez egy szerető budapesti közösség.</ThemedText>
        </Text>
      </View>
      <View style={{ margin: 8, gap: 16, marginBottom: 24, zIndex: -1 }}>
        <Link href="/csatlakozom" asChild>
          <Button mode="contained">Mi is ez?</Button>
        </Link>
        <Link href="/login" asChild>
          <Button mode="contained-tonal">Bejelentkezés</Button>
        </Link>
      </View>
    </ThemedView>
  );
}
