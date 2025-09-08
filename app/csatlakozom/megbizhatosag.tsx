import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Image } from "expo-image";
import { View, Modal, StyleSheet, Pressable, TextInput } from "react-native";
import { useState, useRef, useCallback } from "react";
import { Icon, Text } from "react-native-paper";
import { Button } from "@/components/Button";
import { useFocusEffect, router } from "expo-router";
import { ThemedInput } from "@/components/ThemedInput";

const iranyelvekList = [
  "Nem leszek rosszindulatú senkivel!",
  "Saját és mások érdekeit is figyelembe veszem!",
  "Ha valaki bántóan viselkedik velem vagy mással, jelentem!",
];

const textToType = "Nem leszek rosszindulatú";

const Megbizhatosag = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [typed, setTyped] = useState("");
  const textInput = useRef<TextInput>(null);

  const handleTextInput = (input: string) => {
    if (
      textToType.slice(0, input.length).toLowerCase().replaceAll(" ", "") ===
      input.toLowerCase().replaceAll(" ", "")
    ) {
      setTyped(textToType.slice(0, input.length));
    } else if (
      textToType
        .slice(0, input.length + 1)
        .toLowerCase()
        .replaceAll(" ", "") === input.toLowerCase().replaceAll(" ", "")
    )
      setTyped(textToType.slice(0, input.length + 1));
  };

  useFocusEffect(
    useCallback(() => {
      if (router)
        router.setParams({
          canGoNext: accepted ? "true" : undefined,
        });
      return () => { };
    }, [accepted]),
  );

  const canAccept = typed === textToType;

  return (
    <ThemedView style={{ flex: 1, paddingTop: 36, alignItems: "center" }}>
      <View style={{ flex: 1 }}>
        <ThemedText
          type="title"
          style={{ textAlign: "left", marginBottom: 16 }}
        >
          Bizalom a platformon.
        </ThemedText>
        <ThemedText>
          Ezen a közösségi oldalon nagy eséllyel ismeretlen emberekkel fog
          összefújni a szél. Mivel sokan okkal nem bíznak meg másokban, ezen a
          platformon figyelünk arra, hogy legyen alapja a bizalomnak. {"\n\n"}Ha
          találkozol itt valakivel, akiben megbízol és tudod hogy nem vágna át
          másokat, megbízhatónak jelölheted őt, a profilján, hogy így támogasd
          és a bizalom által építsük fel a közösségünket.
        </ThemedText>
        <View style={{ alignItems: "center", paddingTop: 32 }}>
          <Button
            mode="contained"
            onPress={() => setModalVisible(true)}
            icon={accepted ? (props => <Icon {...props} source="check" />) : undefined}
            disabled={accepted}
            style={{ marginBottom: 16, minWidth: 220 }}
          >
            Irányelvek {accepted ? "elfogadva" : "elfogadása"}
          </Button>
        </View>

        <View
          style={{ alignItems: "center", justifyContent: "center", margin: 24 }}
        >
          <Image
            source={require("@/assets/images/Trust.png")}
            style={{ width: "70%", aspectRatio: 1 / 1, resizeMode: "cover" }}
            contentFit="cover"
          />
        </View>

        <Modal
          visible={modalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ThemedText type="title" style={{ marginBottom: 16 }}>
                Irányelveink:
              </ThemedText>
              <View style={{ alignItems: "flex-start" }}>
                {iranyelvekList.map((item, idx) => (
                  <ThemedText key={idx} style={{ fontSize: 17, margin: 5 }}>
                    <Icon source="heart" size={20} /> {item}
                  </ThemedText>
                ))}
              </View>
              <View style={{ marginVertical: 20 }}>
                <ThemedText style={{ fontWeight: "bold" }}>
                  Ha be fogod tartani ezeket, gépeld be a következő szöveget:
                </ThemedText>
                <Pressable
                  style={styles.inputView}
                  onPress={() => {
                    // Delay focus to ensure Pressable registers before input focus
                    setTimeout(() => {
                      textInput?.current?.focus();
                    }, 10);
                  }}
                  android_disableSound={true}
                  accessible={true}
                  accessibilityRole="text"
                >
                  <Text pointerEvents="none"
                    style={[styles.textToType, { opacity: 0.5 }]}
                  >
                    {textToType}
                  </Text>
                  <ThemedInput
                    mode="outlined"
                    ref={textInput}
                    style={styles.input}
                    allowFontScaling
                    contentStyle={styles.inputContent}
                    scrollEnabled={false}
                    value={typed}
                    onFocus={(e) => {
                      // No-op or custom logic
                    }}
                    onChangeText={handleTextInput}
                  />
                  <Text style={[styles.textToType, {}]}
                    pointerEvents="none">{typed}</Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", width: "100%", gap: 16 }}>

                <Button mode="text" onPress={() => setModalVisible(false)}>
                  Mégsem
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    setAccepted(true);
                    setModalVisible(false);
                  }}
                  disabled={!canAccept}
                >Elfogadom</Button>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ThemedView>
  );
};


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignItems: "flex-start",
    elevation: 5,
  },
  inputView: {
    width: "100%",
    minHeight: 48,
    marginTop: 8,
    marginBottom: 8,
    position: "relative",
    justifyContent: "center",
  },
  input: {
    padding: 0,
    fontSize: 15,
    lineHeight: 22,
    zIndex: 10,
    overflow: "hidden",
    fontWeight: "300",
    fontFamily: "RedHatText",
  },
  inputContent: {
    padding: 0,
    letterSpacing: 0.5,
    fontSize: 15,
    zIndex: 20,
    overflow: "hidden",
    fontWeight: "300",
    fontFamily: "RedHatText",
  },
  textToType: {
    top: 0,
    padding: 16,
    paddingTop: 17,
    position: "absolute",
    userSelect: "none",
    cursor: "text",
    fontSize: 15,
    zIndex: 150,
    overflow: "hidden",
    fontWeight: "300",
    fontFamily: "RedHatText",
  },
});

export default Megbizhatosag;
