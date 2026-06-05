import { ThemedView } from "@/components/ThemedView";
import { Platform, View } from "react-native";
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
          Az utca túloldalán lehet a segítség
        </ThemedText>
        <ThemedText>
          A FiFe Budapesten indul – a szomszédaid lehetnek a legjobb segítőtársaid. Nincs szükség távoli ügyfélszolgálatokra és multikra. 
          {"\n"}Elég ha itt vagyunk egymásnak.
          
        </ThemedText>
      </View>
      <View
        style={{
          bottom: 0,
          left: 0,
          position: "absolute",
          width: "100%",
          paddingTop: 20,
          alignItems: "center",
        }}
      >
        <Image
          source={require("@/assets/images/Community_Big.png")}
          style={{ width: "100%", height: 500, resizeMode: "cover" }}
          contentFit="cover"
          contentPosition="top"
        />
      </View>
    </ThemedView>
  );
};

export default Register;
