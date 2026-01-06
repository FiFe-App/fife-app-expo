import { Link } from "expo-router";
import { Icon, Button } from "react-native-paper";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

interface ErrorScreenProps {
  icon?: string;
  title?: string;
  text?: string;
}

const ErrorScreen = ({
  icon = "emoticon-sad",
  title,
  text,
}: ErrorScreenProps) => {
  const { t } = useTranslation();
  return (
    <ThemedView
      style={{
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
        gap: 32,
      }}
    >
      <Icon source={icon} size={100} />
      <ThemedText type="title" style={{ textAlign: "center" }}>
        {title || "A manóba!"}
      </ThemedText>
      <View style={{ alignItems: "center" }}>
        <ThemedText>{text || "Valami hiba történt"}</ThemedText>
      </View>
      <Link asChild href="/">
        <Button mode="contained">{t("common.backToHome")}</Button>
      </Link>
    </ThemedView>
  );
};

export default ErrorScreen;
