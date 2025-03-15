import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { Image } from "expo-image";
import { Link, Redirect } from "expo-router";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useSelector } from "react-redux";
import mainImage from "../assets/images/img-main.png";

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
          alignItems: "center",
          gap: 24,
          marginTop: 36,
        }}
      >
        <Text style={{ zIndex: -1, textAlign: "left" }}>
          <ThemedText type="title">Üdvözöllek a FiFe Appban!</ThemedText>
          {"\n"}
        </Text>
        <Image
          source={mainImage}
          style={{
            width: "95%",
            aspectRatio: 1,
            padding: 5,
            maxWidth: 300,
            maxHeight: 300,
          }}
        />
        <ThemedText type="title" style={{ textAlign: "center" }}>
          Együtt boldogulunk!
        </ThemedText>
        <ThemedText style={{ textAlign: "center" }}>
          Ez egy szerető budapesti közösség, ahol megoszthatod, hogy mihez
          értesz.
        </ThemedText>
      </View>
      <View style={{ margin: 8, gap: 16, marginBottom: 24 }}>
        <Link href="/csatlakozom" asChild>
          <Button mode="contained">Csatlakozom</Button>
        </Link>
        <Link href="/login" asChild>
          <Button mode="contained-tonal">Bejelentkezés</Button>
        </Link>
      </View>
    </ThemedView>
  );
}
