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
import { clearOptions, setInAppMessageVisible, setOptions, showDialog } from "@/redux/reducers/infoReducer";
import { dismissedIsItSafe } from "@/redux/reducers/userReducer";
import { Link, router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Button } from "@/components/Button";
import { useAppTheme } from "@/assets/theme";
import { useKeyboardScrollIntoView } from "@/hooks/useKeyboardScrollIntoView";

/** Until the newest in_app_messages row has loaded, or when it sets none. */
const DEFAULT_OPEN_ICON = "message-draw";

export default function MeScreen() {
  const { uid, isItSafeDismissed } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { scrollRef, keyboardHeight, handleScroll, registerFocusedInput } = useKeyboardScrollIntoView();
  const theme = useAppTheme();
  const openIcon = useSelector((state: RootState) => state.info.inAppMessageOpenIcon) ?? DEFAULT_OPEN_ICON;
  const isItSafeButtonText = `Ez a hely biztonságos${isItSafeDismissed ? "." : "?"}`;

  const showIsItSafeDialog = ()=>{
    dispatch(showDialog({
      title: "Igen, ez egy biztonságos hely.",
      text: "Ez a te saját oldalad, az itt megadott adataidat titkosítva tároljuk és senki nem férhet hozzájuk.",
      submitText: "Rendben",
      //dismissable: false,
      onSubmit: () => {
        dispatch(dismissedIsItSafe());
      },
    }));
  };

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
          <Button 
            mode={isItSafeDismissed ? "text" : "contained-tonal"} 
            onPress={showIsItSafeDialog}>
              {isItSafeButtonText}
          </Button>
          <Link asChild href="/user/get-help">
            <TouchableRipple>
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
                <Icon source="lifebuoy" size={24} color={theme.colors.primary} />
                <ThemedText style={{ flex: 1 }} type="defaultSemiBold">Segítség kell?</ThemedText>
                <Icon source="chevron-right" size={20} color={theme.colors.outline} />
              </Surface>
            </TouchableRipple>
          </Link>
          <NotificationPrompts />
          {emotionAvailable && <EmotionCheckCard onNoteFocus={registerFocusedInput} />}
          <ToDoList
            onRequestScrollIntoView={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
          />
          <View style={styles.cardRow}>
            <Card style={[styles.card, styles.cardSpacing]} onPress={() => router.push("/focus")}>
              <Card.Content style={styles.cardContent}>
                <Image
                  source={require("@/assets/gifs/focus.gif")}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
                <ThemedText style={styles.cardText}>Fókusz</ThemedText>
              </Card.Content>
            </Card>
            <Card style={styles.card} onPress={() => router.push("/szunet")}>
              <Card.Content style={styles.cardContent}>
                <Image
                  source={require("@/assets/gifs/black.gif")}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
                <ThemedText style={styles.cardText}>Szünet</ThemedText>
              </Card.Content>
            </Card>
          </View>
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
