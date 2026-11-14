import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { PhraseInput } from "@/components/PhraseInput";
import { acceptPolicies } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewInstance,
} from "react-native";
import { Checkbox, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";
import { CSAE_URL } from "@/constants/legal";
import { useAppTheme } from "@/assets/theme";
import { useKeyboardScrollIntoView } from "@/hooks/useKeyboardScrollIntoView";

// Room for the wizard's Vissza / Tovább row, which floats over the bottom of
// the page (see app/csatlakozom/_layout.tsx).
const NAV_ROW_HEIGHT = 96;

const Register = () => {
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const policiesAccepted = useSelector(
    (state: RootState) => state.info.policiesAccepted,
  );
  const textToType = "Nem leszek rosszindulatú";
  const [text, setText] = useState(policiesAccepted ? textToType : "");
  const [ageConfirmed, setAgeConfirmed] = useState(policiesAccepted);
  const { scrollRef, keyboardHeight, handleScroll, registerFocusedInput } = useKeyboardScrollIntoView();
  const phraseContainerRef = useRef<ViewInstance>(null);
  const handleTextInput = (input: string) => {
    if (
      textToType.slice(0, input.length).toLowerCase().replaceAll(" ", "") ===
      input.toLowerCase().replaceAll(" ", "")
    ) {
      setText(textToType.slice(0, input.length));
    } else if (
      textToType
        .slice(0, input.length + 1)
        .toLowerCase()
        .replaceAll(" ", "") === input.toLowerCase().replaceAll(" ", "")
    )
      setText(textToType.slice(0, input.length + 1));
  };
  const canGoNext = policiesAccepted || ageConfirmed;

  useFocusEffect(
    useCallback(() => {
      if (router)
        router.setParams({
          canGoNext: canGoNext ? "true" : undefined,
        });
      if (!policiesAccepted && text === textToType && ageConfirmed) {
        dispatch(acceptPolicies());
      }
      return () => { };
    }, [canGoNext, policiesAccepted, text, ageConfirmed, textToType, dispatch]),
  );

  return (
    // The whole page scrolls, so the phrase input can be brought above the
    // keyboard on any screen size instead of squeezing the guidelines away.
    // iOS does that itself through automaticallyAdjustKeyboardInsets; the
    // hook does it on edge-to-edge Android, where the window doesn't resize.
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          flexGrow: 1,
          padding: Spacing.sm,
          paddingTop: Spacing.xxxl,
          paddingBottom: keyboardHeight || NAV_ROW_HEIGHT,
        }}
      >
        <View style={{ flex: 1 }}>
          <ThemedText type="title" style={{ marginBottom: Spacing.lg }}>
            Ha szeretnél csatlakozni ehhez a közösséghez, be kell tartanod az
            irányelveinket:
          </ThemedText>
          <View style={styles.text}>
            {[
              "Nem leszek rosszindulatú senkivel!",
              "Saját és mások érdekeit is figyelembe veszem!",
              "Ha valaki valaki bántóan viselkedik velem vagy mással, jelentem!",
            ].map((item, index) => (
              <Text key={`item-${index}`} style={styles.listItem}>
                - {item}
              </Text>
            ))}
          </View>
        </View>
        <Pressable
          style={styles.ageCheckbox}
          onPress={() => setAgeConfirmed((v) => !v)}
        >
          {/* The Android variant on every platform: the iOS one draws nothing
              while unchecked, so there's no box to show what to tap. */}
          <Checkbox.Android
            status={ageConfirmed ? "checked" : "unchecked"}
            onPress={() => setAgeConfirmed((v) => !v)}
          />
          <Text style={styles.ageCheckboxLabel}>
            Nyilatkozom, hogy elmúltam 16 éves.
          </Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(CSAE_URL)}
          style={{ marginTop: Spacing.sm }}
        >
          <Text style={[styles.csaeLink, { color: theme.colors.tertiary }]}>
            Gyermekvédelmi irányelvek (CSAE) megtekintése
          </Text>
        </Pressable>
        <View ref={phraseContainerRef} style={{ marginVertical: Spacing.xl }}>
          <ThemedText>
            Ha be fogod tartani ezeket, gépeld be a következő szöveget:
          </ThemedText>
          <PhraseInput
            phrase={textToType}
            value={text}
            onChangeText={handleTextInput}
            onFocus={() => registerFocusedInput(phraseContainerRef)}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  text: {
    textAlign: "left",
    marginBottom: 10,
  },
  listItem: {
    alignItems: "center",
    fontSize: 17,
    margin: Spacing.xs,
  },
  ageCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  ageCheckboxLabel: {
    flex: 1,
    fontSize: 15,
  },
  csaeLink: {
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
export default Register;
