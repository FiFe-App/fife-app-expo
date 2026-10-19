import { Link } from "expo-router";
import { Icon, Button } from "react-native-paper";
import { Spacing } from "@/constants/spacing";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { View } from "react-native";
import { ReactNode } from "react";

interface ErrorScreenProps {
  icon?: string;
  title?: string;
  text?: string;
  /** Replaces the "back to the home page" button, for screens where something
   *  more useful can be offered — signing up, for instance. */
  action?: ReactNode;
}

const ErrorScreen = ({
  icon = "emoticon-sad",
  title = "A manóba!",
  text = "Valami hiba történt",
  action,
}: ErrorScreenProps) => {
  return (
    <ThemedView
      style={{
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
        gap: Spacing.xxxl,
      }}
    >
      <Icon source={icon} size={100} />
      <ThemedText type="title" style={{ textAlign: "center" }}>
        {title}
      </ThemedText>
      <View style={{ alignItems: "center" }}>
        <ThemedText>{text}</ThemedText>
      </View>
      {action ?? (
        <Link asChild href="/">
          <Button mode="contained">Vissza a főoldalra</Button>
        </Link>
      )}
    </ThemedView>
  );
};

export default ErrorScreen;
