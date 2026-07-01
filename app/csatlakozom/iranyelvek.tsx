import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { PhraseInput } from "@/components/PhraseInput";
import { acceptPolicies } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Checkbox, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";
import { useAppTheme } from "@/assets/theme";

const Register = () => {
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const policiesAccepted = useSelector(
    (state: RootState) => state.info.policiesAccepted,
  );
  const textToType = "Nem leszek rosszindulatú";
  const [text, setText] = useState(policiesAccepted ? textToType : "");
  const [ageConfirmed, setAgeConfirmed] = useState(policiesAccepted);
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
    <ThemedView style={{ flex: 1, minHeight: 0, padding: Spacing.sm, paddingTop: Spacing.xxxl, paddingBottom: 60 }}>
      <KeyboardAvoidingView
        style={{ flex: 1, minHeight: 0 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 56 : 24}
      >
        <View style={{ flex: 1, minHeight: 0 }}>
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
      <View style={{ backgroundColor: theme.colors.background }}>
        <Pressable
          style={styles.ageCheckbox}
          onPress={() => setAgeConfirmed((v) => !v)}
        >
          <Checkbox
        
            status={ageConfirmed ? "checked" : "unchecked"}
            onPress={() => setAgeConfirmed((v) => !v)}
          />
          <Text style={styles.ageCheckboxLabel}>
            Nyilatkozom, hogy elmúltam 16 éves.
          </Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL("https://fifeapp.hu/CSAE.html")}
          style={{ marginTop: Spacing.sm }}
        >
          <Text style={[styles.csaeLink,{color: theme.colors.tertiary}]}>
            Gyermekvédelmi irányelvek (CSAE) megtekintése
          </Text>
        </Pressable>
          <View style={{ marginVertical: Spacing.xl }}>
            <ThemedText>
              Ha be fogod tartani ezeket, gépeld be a következő szöveget:
            </ThemedText>
            <PhraseInput
              phrase={textToType}
              value={text}
              onChangeText={handleTextInput}
            />
          </View>
      </View>
    </KeyboardAvoidingView>
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
