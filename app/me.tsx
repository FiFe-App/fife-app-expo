import { ThemedView } from "@/components/ThemedView";
import Mantra from "@/components/Mantra";
import EmotionCheckCard from "@/components/EmotionCheckCard";
import NotificationPrompts from "@/components/notifications/NotificationPrompts";
import ToDoList from "@/components/ToDoList";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { RootState } from "@/redux/store";
import { Image, Linking, ScrollView, StyleSheet, View } from "react-native";
import { Button as PaperButton, Card, Dialog, Icon, Portal, Surface, TouchableRipple } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { ThemedText } from "@/components/ThemedText";
import { emotionAvailable } from "@/constants/emotionTiming";
import { clearOptions, setOptions, showDialog } from "@/redux/reducers/infoReducer";
import { dismissedIsItSafe } from "@/redux/reducers/userReducer";
import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Button } from "@/components/Button";
import { useAppTheme } from "@/assets/theme";
import { useKeyboardScrollIntoView } from "@/hooks/useKeyboardScrollIntoView";

// Hardcoded until there's a real "contact the developer" profile to look up.
const FEEDBACK_CHAT_UID = "e53e948e-debe-44c1-852b-e94c29ffcb9b";
const FEEDBACK_EMAIL = "akos@fifeapp.hu";

export default function MeScreen() {
  const { uid, isItSafeDismissed } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { scrollRef, keyboardHeight, handleScroll, registerFocusedInput } = useKeyboardScrollIntoView();
  const theme = useAppTheme();
  const isItSafeButtonText = `Ez a hely biztonságos${isItSafeDismissed ? "." : "?"}`;
  const [feedbackDialogVisible, setFeedbackDialogVisible] = useState(false);

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
            icon: "comment-text-outline",
            onPress: () => setFeedbackDialogVisible(true),
            title: "Visszajelzés",
          },
        ]),
      );
      return () => {
        dispatch(clearOptions());
      };
    }, [dispatch]),
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
      <Portal>
        <Dialog visible={feedbackDialogVisible} onDismiss={() => setFeedbackDialogVisible(false)}>
          <Dialog.Title>Mondd el a véleményed!</Dialog.Title>
          <Dialog.Content>
            <ThemedText>
              Írj nekem személyes üzenetet az appon belül, vagy küldj egy emailt! Ígérem visszaírok!
            </ThemedText>
          </Dialog.Content>
          {/* Dialog.Actions force-injects compact={true} onto its children;
              @/components/Button's compact styling caps height at 12px
              (never exercised elsewhere in the app, since nothing else
              passes compact manually), which clipped these to nothing.
              Plain react-native-paper Button, as every other Dialog here
              already uses, doesn't have that problem. */}
          <Dialog.Actions style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
            <PaperButton
              onPress={() => {
                setFeedbackDialogVisible(false);
                router.push({ pathname: "/chat/[uid]", params: { uid: FEEDBACK_CHAT_UID } });
              }}
              mode="contained"
            >
              Üzenetet írok
            </PaperButton>
            <PaperButton
              mode="contained-tonal"
              onPress={() => {
                setFeedbackDialogVisible(false);
                Linking.openURL(`mailto:${FEEDBACK_EMAIL}`);
              }}
            >
              Emailt írok
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
