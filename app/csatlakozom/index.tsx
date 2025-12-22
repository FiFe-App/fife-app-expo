import { ThemedView } from "@/components/ThemedView";
import { View } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { useTranslation } from "react-i18next";

const Register = () => {
  const { t } = useTranslation();
  
  return (
    <ThemedView style={{ flex: 1, paddingTop: 36, alignItems: "center" }}>
      <View style={{ flex: 1, zIndex: 2, overflow: "hidden" }}>
        <ThemedText
          type="title"
          style={{ textAlign: "left", marginBottom: 16 }}
        >
          FiFe App
        </ThemedText>
        <ThemedText
          type="subtitle"
          style={{ textAlign: "left", marginBottom: 16 }}
        >
          {t("csatlakozom.subtitle")}
        </ThemedText>
        <ThemedText>
          {t("csatlakozom.intro")}
          {t("csatlakozom.mapView")}
        </ThemedText>
        <View
          style={{
            zIndex: -1,
            bottom: 0,
            left: 0,
            position: "fixed",
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
      </View>
    </ThemedView>
  );
};

export default Register;
