import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Link } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

const Register = () => {
  const textInput = useRef();
  const [numberOfLines, setNumberOfLines] = useState(0);
  const [text, setText] = useState("");
  const textToType =
    "Nem leszek rosszindulatú. Tiszteletben tartom mások véleményét.";
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

  return (
    <ThemedView style={{ flex: 1, padding: 8 }}>
      <View style={{ flex: 1 }}>
        <ThemedText>
          Ha szeretnél csatlakozni ehhez a közösséghez, be kell tartanod az
          irányelveinket.
        </ThemedText>
        <View style={{ marginVertical: 20 }}>
          <ThemedText>
            Ha be fogod tartani ezeket, gépeld be a következő szöveget:
          </ThemedText>
          <Pressable
            style={styles.inputView}
            onPress={() => {
              if (textInput.current) textInput?.current?.focus();
            }}
          >
            <Text
              style={[styles.textToType]}
              onLayout={(e) => {
                console.log(
                  "number of lines",
                  setNumberOfLines((e.nativeEvent.layout.height - 20) / 26),
                );
              }}
            >
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
              rows={numberOfLines}
              onChangeText={handleTextInput}
            />
            {
              <Text style={[styles.textToType, { color: "black" }]}>
                {text}
              </Text>
            }
          </Pressable>
        </View>
      </View>
      <View
        style={{ alignItems: "flex-end", alignSelf: "flex-end", padding: 16 }}
      >
        <Link href="./regisztracio" asChild>
          <Button mode="contained">Regisztráció</Button>
        </Link>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  text: {
    textAlign: "left",
    marginBottom: 10,
    backgroundColor: "#ffffff99",
  },
  inputView: {},
  input: {
    color: "black",
    padding: 0,
    paddingHorizontal: 10,
    fontSize: 15,
    overflow: "hidden",
  },
  inputContent: {
    paddingTop: 10,
    paddingHorizontal: 10,
    letterSpacing: 0,
    color: "black",
    zIndex: 10,
    overflow: "hidden",
  },
  textToType: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    position: "absolute",
    userSelect: "none",
    backgroundColor: "transparent",
    color: "gray",
    cursor: "text",
    fontSize: 15,
    zIndex: 10,
  },
});
export default Register;
