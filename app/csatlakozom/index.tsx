import { ThemedView } from "@/components/ThemedView";
import { View } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import ModeCard from "@/components/navigation/ModeCard";
import { Spacing } from "@/constants/spacing";

const Register = () => {
  return (
    <ThemedView style={{ flex: 1, paddingTop: 36, alignItems: "center" }}>
      <View
        style={{
          flex: 1,
          zIndex: 2,
          overflow: "hidden",
          width: "100%",
          maxWidth: 600,
          paddingHorizontal: Spacing.md,
        }}
      >
        <ThemedText
          type="title"
          style={{ textAlign: "left", marginBottom: 16 }}
        >
          Ez egy eszköz ami segít neked a mindennapokban
        </ThemedText>
        <ThemedText style={{ marginBottom: Spacing.md }}>
          A FiFe App két részből áll. Az alsó kapcsolóval bármikor válthatsz
          köztük:
        </ThemedText>
        <View style={{ gap: Spacing.sm }}>
          <ModeCard mode="en" />
          <ModeCard mode="mi" />
        </View>
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
