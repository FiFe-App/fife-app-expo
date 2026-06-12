import { ThemedView } from "@/components/ThemedView";
import Mantra from "@/components/Mantra";
import EmotionCheckCard from "@/components/EmotionCheckCard";
import ToDoList from "@/components/ToDoList";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { RootState } from "@/redux/store";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { FAB } from "react-native-paper";
import { useSelector } from "react-redux";

export default function MeScreen() {
  const { uid } = useSelector((state: RootState) => state.user);

  if (!uid) return null;
  return (
    <ThemedView style={{ flex: 1 }} type="default">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Mantra />
        <EmotionCheckCard />
        <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
          <ToDoList />
        </View>
      </ScrollView>
      <FAB
        icon="account"
        label="Publikus Profilod"
        onPress={() => router.push({ pathname: "/user/[uid]", params: { uid } })}
        style={{
          position: "absolute",
          right: Spacing.md,
          bottom: Spacing.md,
          borderRadius: BorderRadius.pill,
        }}
      />
    </ThemedView>
  );
}
