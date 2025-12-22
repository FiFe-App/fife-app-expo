import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput as TIRN,
  View,
} from "react-native";
import { Icon, Text, TextInput } from "react-native-paper";
import { useTranslation } from "react-i18next";

const Register = () => {
  const { t } = useTranslation();
  const textInput = useRef<TIRN>(null);
  const [text, setText] = useState("");
  const textToType = t("csatlakozom.guidelineText");
  
  const iranyelvekList = [
    { key: t("csatlakozom.guideline1") },
    { key: t("csatlakozom.guideline2") },
    { key: t("csatlakozom.guideline3") },
  ];
  
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
      return () => {};
    }, [accepted]),
  );

  return (
    <ThemedView style={{ flex: 1, padding: 8 }}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ThemedText type="title" style={{ marginBottom: 16 }}>
          {t("csatlakozom.joinCommunity")}
        </ThemedText>
        <FlatList
          data={iranyelvekList}
          style={[styles.text, { flex: undefined }]}
          renderItem={({ item, index }) => (
            <Text style={styles.listItem} key={"item" + index}>
              <Text style={{ margin: 4 }}>
                <Icon source="heart" size={20} />
              </Text>
              {item.key}
            </Text>
          )}
        />
      </View>
      <View style={{ marginVertical: 20 }}>
        <ThemedText>
          {t("csatlakozom.guidelinePrompt")}
        </ThemedText>
        <Pressable
          style={styles.inputView}
          onPress={() => {
            if (textInput?.current) textInput?.current?.focus();
          }}
        >
          <Text style={[styles.textToType, { opacity: 0.5 }]}>
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
          <Text style={[styles.textToType, {}]}>{text}</Text>
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
    margin: 5,
  },
  inputView: {},
  input: {
    padding: 0,
    paddingHorizontal: 10,
    fontSize: 15,
    zIndex: 10,
    overflow: "hidden",
  },
  inputContent: {
    paddingTop: 10,
    paddingHorizontal: 10,
    letterSpacing: 0,
    zIndex: 20,
    overflow: "hidden",
  },
  textToType: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    position: "absolute",
    userSelect: "none",
    cursor: "text",
    fontSize: 15,
    fontWeight: "400",
    zIndex: 150,
  },
});
export default Register;
