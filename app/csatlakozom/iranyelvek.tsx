import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { PhraseInput } from "@/components/PhraseInput";
import { acceptPolicies } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Checkbox, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";

const Register = () => {
  const dispatch = useDispatch();
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
  const accepted = policiesAccepted || (text === textToType && ageConfirmed);
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
    <ThemedView style={{ flex: 1, padding: Spacing.sm, paddingTop: Spacing.xxxl, paddingBottom: 60 }}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ThemedText type="title" style={{ marginBottom: Spacing.lg }}>
          Ha szeretnél csatlakozni ehhez a közösséghez, be kell tartanod az
          irányelveinket:
        </ThemedText>
        <FlatList
          data={[
            { key: "Nem leszek rosszindulatú senkivel!" },
            { key: "Saját és mások érdekeit is figyelembe veszem!" },
            {
              key: "Ha valaki valaki bántóan viselkedik velem vagy mással, jelentem!",
            },
          ]}
          style={[styles.text, { flex: undefined }]}
          renderItem={({ item, index }) => (
            <Text style={styles.listItem} key={"item" + index}>
              - {item.key}
            </Text>
          )}
        />
      </View>
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
});
export default Register;
