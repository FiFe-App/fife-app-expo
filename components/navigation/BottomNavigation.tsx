import { Link, useSegments } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Badge, Icon, Surface, TouchableRipple } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import globStyles from "@/constants/Styles";
import { theme } from "@/assets/theme";
import Measure from "../tutorial/Measure";
import { useTranslation } from "react-i18next";

const BottomNavigation = () => {
  const { t } = useTranslation();
  const segment = useSegments();
  const { functions } = useSelector((state: RootState) => state.tutorial);
  const bizniszActive = segment[0]?.includes("biznisz");
  const profilActive = segment[0]?.includes("user");
  const homeActive = segment[0]?.includes("home");

  return (
    <Surface style={{ flexDirection: "row" }} elevation={1}>
      <Measure name="biznisz">
        <Link asChild href="/biznisz">
          <TouchableRipple style={{ ...styles.button }}>
            <View style={{ alignItems: "center" }}>
              <Icon
                source={
                  bizniszActive ? "magnify" : "magnify"
                }
                size={bizniszActive ? 30 : 24}
                color={bizniszActive ? theme.colors.secondary : undefined}
              />
              <ThemedText type={bizniszActive ? "defaultSemiBold" : "default"}>
                {t("navigation.biznisz")}
              </ThemedText>
              {functions.includes("buzinessPage") && (
                <Badge style={globStyles.badge}>{t("common.new")}</Badge>
              )}
            </View>
          </TouchableRipple>
        </Link>
      </Measure>
      <Measure name="home">
        <Link asChild href="/home">
          <TouchableRipple style={{ ...styles.button }}>
            <View style={{ alignItems: "center" }}>
              <Icon
                source={homeActive ? "home" : "home-outline"}
                size={homeActive ? 30 : 24}
                color={homeActive ? theme.colors.secondary : undefined}
              />
              <ThemedText type={homeActive ? "defaultSemiBold" : "default"}>
                {t("navigation.home_bottom")}
              </ThemedText>
            </View>
          </TouchableRipple>
        </Link>
      </Measure>
      <Measure name="user">
        <Link asChild href="/user">
          <TouchableRipple style={{ ...styles.button }}>
            <View style={{ alignItems: "center" }}>
              <Icon
                source={profilActive ? "account" : "account-outline"}
                size={profilActive ? 30 : 24}
                color={profilActive ? theme.colors.secondary : undefined}
              />
              <ThemedText type={profilActive ? "defaultSemiBold" : "default"}>
                {t("navigation.profile")}
              </ThemedText>
            </View>
          </TouchableRipple>
        </Link>
      </Measure>
    </Surface>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default BottomNavigation;
