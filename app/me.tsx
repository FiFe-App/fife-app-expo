import { ThemedView } from "@/components/ThemedView";
import Mantra from "@/components/Mantra";
import EmotionCheckCard from "@/components/EmotionCheckCard";
import NotificationPrompts from "@/components/notifications/NotificationPrompts";
import ToDoList from "@/components/ToDoList";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { RootState } from "@/redux/store";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Card, Icon, Surface, TouchableRipple } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { ThemedText } from "@/components/ThemedText";
import { emotionAvailable } from "@/constants/emotionTiming";
import { clearOptions, setInAppMessageVisible, setOptions } from "@/redux/reducers/infoReducer";
import { Link, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useKeyboardScrollIntoView } from "@/hooks/useKeyboardScrollIntoView";
import { useAppTheme } from "@/assets/theme";

/** Until the newest in_app_messages row has loaded, or when it sets none. */
const DEFAULT_OPEN_ICON = "message-draw";

export default function MeScreen() {
  const { uid } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const { scrollRef, keyboardHeight, handleScroll, registerFocusedInput } = useKeyboardScrollIntoView();
  const openIcon = useSelector((state: RootState) => state.info.inAppMessageOpenIcon) ?? DEFAULT_OPEN_ICON;

  useFocusEffect(
    useCallback(() => {
      dispatch(
        setOptions([
          {
            icon: openIcon,
            onPress: () => dispatch(setInAppMessageVisible(true)),
            title: "Visszajelzés",
          },
        ]),
      );
      return () => {
        dispatch(clearOptions());
      };
    }, [dispatch, openIcon]),
  );

  if (!uid) return null;
  return (
    <ThemedView style={{ flex: 1 }} type="default">
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: keyboardHeight }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Mantra />
        <View style={{ gap: Spacing.sm }}>
          <NotificationPrompts />
          {emotionAvailable && <EmotionCheckCard onNoteFocus={registerFocusedInput} />}
          <ToDoList onInputFocus={registerFocusedInput} />
          {/* A Mi page, linked from home because people keep coming back to it. */}
          <Link asChild href="/user/saved-buzinesses">
            <TouchableRipple accessibilityRole="link" style={{ borderRadius: BorderRadius.lg }}>
              <Surface
                elevation={1}
                style={{
                  borderRadius: BorderRadius.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.md,
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.lg,
                }}
              >
                <Icon source="archive-outline" size={24} color={theme.colors.tertiary} />
                <ThemedText style={{ flex: 1 }} type="defaultSemiBold">Elmentett bizniszek</ThemedText>
                <Icon source="chevron-right" size={20} color={theme.colors.outline} />
              </Surface>
            </TouchableRipple>
          </Link>
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
