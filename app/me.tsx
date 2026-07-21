import { ThemedView } from "@/components/ThemedView";
import Mantra from "@/components/Mantra";
import EmotionCheckCard from "@/components/EmotionCheckCard";
import ToDoList from "@/components/ToDoList";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { RootState } from "@/redux/store";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Card, Icon, Surface, TouchableRipple } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { ThemedText } from "@/components/ThemedText";
import { emotionAvailable } from "@/constants/emotionTiming";
import { supabase } from "@/lib/supabase/supabase";
import { clearBuziness, clearBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { clearDrafts } from "@/redux/reducers/chatReducer";
import { clearEmotionLogs } from "@/redux/reducers/emotionLogsReducer";
import { setOptions, clearOptions, showDialog } from "@/redux/reducers/infoReducer";
import { clearTutorialState } from "@/redux/reducers/tutorialReducer";
import { useFocusEffect, router, Link } from "expo-router";
import { useCallback } from "react";
import { useAppTheme } from "@/assets/theme";
import { dismissedIsItSafe, logout } from "@/redux/reducers/userReducer";
import { Button } from "@/components/Button";

export default function MeScreen() {
  const { uid, isItSafeDismissed } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const isItSafeButtonText = `Ez a hely biztonságos${isItSafeDismissed ? "." : "?"}`;

    useFocusEffect(
      useCallback(() => {
          dispatch(
            setOptions([
              {
                icon: "exit-run",
                onPress: async () => {
                  await supabase.auth.signOut();
                  dispatch(logout());
                  dispatch(clearBuziness());
                  dispatch(clearTutorialState());
                  dispatch(clearBuzinessSearchParams());
                  dispatch(clearEmotionLogs());
                  dispatch(clearDrafts());
                  router.navigate("/");
                },
                title: "Kijelentkezés",
              },
            ]),
          );
          return () => {
            dispatch(clearOptions());
          };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [uid]),
    );

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


  if (!uid) return null;
  return (
    <ThemedView style={{ flex: 1 }} type="default">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Mantra />
        <View style={{ gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
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
          {emotionAvailable && <EmotionCheckCard />}
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
