import { Link, useSegments } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Icon, Surface, TouchableRipple } from "react-native-paper";
import { ThemedText } from "../ThemedText";

const BottomNavigation = () => {
  const segment = useSegments();
  const bizniszActive = segment[0]?.includes("biznisz");
  const profilActive = segment[0]?.includes("user");

  return (
    <Surface style={{ flexDirection: "row" }} elevation={2}>
      <Link asChild href="/biznisz">
        <TouchableRipple style={styles.button}>
          <View style={{ alignItems: "center" }}>
            <Icon
              source={bizniszActive ? "briefcase" : "briefcase-outline"}
              size={24}
            />
            <ThemedText>Biznisz</ThemedText>
          </View>
        </TouchableRipple>
      </Link>
      <Link asChild href="/user">
        <TouchableRipple style={styles.button}>
          <View style={{ alignItems: "center" }}>
            <Icon
              source={profilActive ? "account" : "account-outline"}
              size={24}
            />
            <ThemedText>Profil</ThemedText>
          </View>
        </TouchableRipple>
      </Link>
    </Surface>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default BottomNavigation;
