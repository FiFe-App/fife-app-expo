import { ThemedView } from "@/components/ThemedView";
import Mantra from "@/components/Mantra";
import EmotionCheckCard from "@/components/EmotionCheckCard";
import ToDoList from "@/components/ToDoList";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { RootState } from "@/redux/store";
import { router } from "expo-router";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Card, FAB } from "react-native-paper";
import { useSelector } from "react-redux";
import { ThemedText } from "@/components/ThemedText";

export default function MeScreen() {
  const { uid } = useSelector((state: RootState) => state.user);

  if (!uid) return null;
  return (
    <ThemedView style={{ flex: 1 }} type="default">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Mantra />
        <ThemedText style={{textAlign:"center",margin:Spacing.lg}}>Ez egy biztonságos hely</ThemedText>
        <EmotionCheckCard />
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
          <ToDoList />
          {false && <View style={styles.cardRow}>
            <Card style={[styles.card, styles.cardSpacing]} theme={{colors: {shadow:"red"}}} onPress={() => {}}>
              <Card.Content style={styles.cardContent}>
                <Image
                  source={require("@/assets/gifs/focus.gif")}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
                <ThemedText style={styles.cardText}>Fókusz</ThemedText>
              </Card.Content>
            </Card>
            <Card style={[styles.card, styles.cardSpacing]} onPress={() => {}}>
              <Card.Content style={styles.cardContent}>
                <Image
                  source={require("@/assets/gifs/black.gif")}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
                <ThemedText style={styles.cardText}>Szünet</ThemedText>
              </Card.Content>
            </Card>
          </View>}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  cardRow: {
    flexDirection: "row",
    marginTop: Spacing.md,
  },
  card: {
    flex: 1,
    borderRadius: BorderRadius.lg,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  cardSpacing: {
    marginRight: Spacing.md,
  },
  cardImage: {
    width: 50,
    height: 50,
    marginRight: Spacing.md,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
