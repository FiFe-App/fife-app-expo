import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  TextInput as TIRN,
  View,
} from "react-native";
import { Icon, Text, TextInput } from "react-native-paper";
import { Spacing } from "@/constants/spacing";

const Register = () => {
  const textInput = useRef<TIRN>(null);
  const [text, setText] = useState("");
  const textToType = "Nem leszek rosszindulatú";
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
  const accepted = text === textToType;

  useFocusEffect(
    useCallback(() => {
      if (router)
        router.setParams({
          canGoNext: accepted ? "true" : undefined,
        });
      return () => { };
    }, [accepted]),
  );

  return (
    <ThemedView style={{ flex: 1, padding: Spacing.sm }}>
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
              <Text style={{ margin: Spacing.xs }}>
                <Icon source="heart" size={20} />
              </Text>
              {item.key}
            </Text>
          )}
        />
      </View>
      <View style={{ marginVertical: Spacing.xl }}>
        <ThemedText>
          Ha be fogod tartani ezeket, gépeld be a következő szöveget:
        </ThemedText>
        <Pressable
          style={styles.inputView}
          onPress={() => {
            console.log("hello");

            if (textInput?.current) textInput?.current?.focus();
          }}
        >
          <Text pointerEvents="none" style={[styles.textToType, { opacity: 0.5 }]}>
            {textToType}
          </Text>
          <TextInput
            ref={textInput}
            style={styles.input}
            allowFontScaling
            contentStyle={styles.inputContent}
            scrollEnabled={false}
            value={text}
            multiline
            onChangeText={handleTextInput}
          />
          <Text pointerEvents="none" style={[styles.textToType, {}]}>{text}</Text>
        </Pressable>
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
  inputView: {
    borderWidth: 1,
    borderColor: "#ff0000",
    borderRadius: 8,
    position: "relative",
  },
  input: {
    padding: 0,
    paddingHorizontal: Spacing.sm,
    fontSize: 15,
    zIndex: 10,
    overflow: "hidden",
  },
  inputContent: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    letterSpacing: 0,
    zIndex: 20,
    overflow: "hidden",
  },
  textToType: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    position: "absolute",
    fontSize: 15,
    fontWeight: "400",
    zIndex: 150,
    ...Platform.select({
      web: { userSelect: "none", cursor: "text" },
    }),
  },
});
export default Register;
