import { Link, useSegments } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Badge, Icon, Surface, TouchableRipple } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import globStyles from "@/constants/Styles";

const BottomNavigation = () => {
  const segment = useSegments();
  const { functions } = useSelector((state: RootState) => state.tutorial);
  const bizniszActive = segment[0]?.includes("biznisz");
  const homeActive = segment[0]?.includes("home");
  const profilActive = segment[0]?.includes("user");

  return (
    <Surface style={{ flexDirection: "row" }} elevation={2}>
      <Link asChild href="/biznisz">
        <TouchableRipple style={styles.button}>
          <View style={{ alignItems: "center" }}>
            <Icon
              source={
                bizniszActive ? "briefcase-search" : "briefcase-search-outline"
              }
              size={bizniszActive ? 30 : 24}
            />
            <ThemedText type={bizniszActive ? "defaultSemiBold" : "default"}>
              Biznisz
            </ThemedText>
            {functions.includes("buzinessPage") && (
              <Badge style={globStyles.badge}>ÚJ</Badge>
            )}
          </View>
        </TouchableRipple>
      </Link>
      <Link asChild href="/home">
        <TouchableRipple style={styles.button}>
          <View style={{ alignItems: "center" }}>
            <Icon
              source={homeActive ? "home" : "home-outline"}
              size={homeActive ? 30 : 24}
            />
            <ThemedText type={homeActive ? "defaultSemiBold" : "default"}>
              Főoldal
            </ThemedText>
            {functions.includes("homePage") && (
              <Badge style={globStyles.badge}>ÚJ</Badge>
            )}
          </View>
        </TouchableRipple>
      </Link>
      <Link asChild href="/user">
        <TouchableRipple style={styles.button}>
          <View style={{ alignItems: "center" }}>
            <Icon
              source={profilActive ? "account" : "account-outline"}
              size={profilActive ? 30 : 24}
            />
            <ThemedText type={profilActive ? "defaultSemiBold" : "default"}>
              Profil
            </ThemedText>
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
