import { Link } from "expo-router";
import { Icon, Button } from "react-native-paper";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { View } from "react-native";

interface ErrorScreenProps {
  icon?: string;
  title?: string;
  text?: string;
}

const ErrorScreen = ({
  icon = "emoticon-sad",
  title = "A manóba!",
  text = "Valami hiba történt",
}: ErrorScreenProps) => {
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
        {title}
      </ThemedText>
      <View style={{ alignItems: "center" }}>
        <ThemedText>{text}</ThemedText>
      </View>
      <Link asChild href="/">
        <Button mode="contained">Vissza a főoldalra</Button>
      </Link>
    </ThemedView>
  );
};

export default ErrorScreen;
