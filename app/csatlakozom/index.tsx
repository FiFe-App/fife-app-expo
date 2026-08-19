import { ThemedView } from "@/components/ThemedView";
import { View } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/spacing";

const Register = () => {
  return (
    <ThemedView style={{ flex: 1, paddingTop: 36, alignItems: "center" }}>
      <View style={{ flex: 1, zIndex: 2, overflow: "hidden", paddingHorizontal: Spacing.md }}>
        <ThemedText
          type="title"
          style={{ textAlign: "left", marginBottom: 16 }}
        >
          Ez egy eszköz ami segít neked a mindennapokban
        </ThemedText>
        <ThemedText>
          A FiFe App ambíciózusan két fronton indít támadást, hogy segítsen neked.
          {"\n"}<ThemedText type="bold">Offline</ThemedText>, vagyis egy saját, személyes teret nyit neked, valamint egy
          <ThemedText type="bold"> Online</ThemedText>, segítői hálózatba enged belépni.
        </ThemedText>
      </View>
      <View
        style={{
          bottom: 0,
          left: 0,
          position: "absolute",
          width: "100%",
          paddingTop: 60,
          alignItems: "center",
        }}
      >
        <Image
          source={require("@/assets/images/Community_Big.png")}
          style={{ width: "100%", height: 450, resizeMode: "cover" }}
          contentFit="cover"
          contentPosition="top"
        />
      </View>
    </ThemedView>
  );
};

export default Register;
