import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Link } from "expo-router";
import { View } from "react-native";
import { Button, Icon, useTheme } from "react-native-paper";

export default function DeletedAccount() {
  const theme = useTheme();

  return (
    <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Icon source="emoticon-sad-outline" size={80} color={theme.colors.onSurfaceVariant} />
      <View style={{ height: 16 }} />
      <ThemedText type="title" style={{ textAlign: "center" }}>
        A fiókodat töröltük
      </ThemedText>
      <View style={{ height: 8 }} />
      <ThemedText style={{ textAlign: "center", opacity: 0.8 }}>
        Sajnáljuk, hogy mész. Ha meggondolod magad, bármikor visszavárunk.
      </ThemedText>
      <View style={{ height: 24 }} />
      <Link href="/" asChild>
        <Button mode="contained" icon="home">
          Vissza a kezdőlapra
        </Button>
      </Link>
    </ThemedView>
  );
}
