import { useRef, useEffect } from "react";
import { Animated, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { Divider, Icon, Text, TouchableRipple, useTheme } from "react-native-paper";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/reducers/userReducer";
import {
  clearBuziness,
  clearBuzinessSearchParams,
} from "@/redux/reducers/buzinessReducer";
import { clearTutorialState } from "@/redux/reducers/tutorialReducer";
import Smiley from "@/components/Smiley";

interface DrawerMenuProps {
  visible: boolean;
  onDismiss: () => void;
}

const DRAWER_WIDTH = 280;

export const DrawerMenu = ({ visible, onDismiss }: DrawerMenuProps) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { uid } = useSelector((state: RootState) => state.user);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  if (!visible) return null;

  const handleLogout = () => {
    onDismiss();
    dispatch(logout());
    dispatch(clearBuziness());
    dispatch(clearTutorialState());
    dispatch(clearBuzinessSearchParams());
    router.navigate("/");
  };

  const navigate = (href: string) => {
    onDismiss();
    router.navigate(href as never);
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onDismiss}
      animationType="none"
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: theme.colors.background,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
            {/* Header */}
            <View
              style={[
                styles.header,
                { borderBottomColor: theme.colors.outlineVariant },
              ]}
            >
              <Smiley />
              <Image
                source={require("../../assets/Logo.png")}
                style={{ width: 150, height: 25 }}
                contentFit="contain"
              />
            </View>

            {/* Menu Items */}
            <TouchableRipple
              onPress={() =>
                uid && navigate(`/user/${uid}?tab=connections`)
              }
            >
              <View style={styles.item}>
                <Icon source="account-arrow-down" size={24} />
                <Text variant="titleMedium">Mentett Kontaktok</Text>
              </View>
            </TouchableRipple>
            <Divider />

            <TouchableRipple
              onPress={() =>
                uid && navigate(`/user/${uid}?tab=connections`)
              }
            >
              <View style={styles.item}>
                <Icon source="account-check" size={24} />
                <Text variant="titleMedium">Megbízható fifék</Text>
              </View>
            </TouchableRipple>
            <Divider />

            <TouchableRipple onPress={() => navigate("/csatlakozom/iranyelvek")}>
              <View style={styles.item}>
                <Icon source="paperclip" size={24} />
                <Text variant="titleMedium">ÁSZF</Text>
              </View>
            </TouchableRipple>
            <Divider />

            <TouchableRipple onPress={() => navigate("/user/edit")}>
              <View style={styles.item}>
                <Icon source="cog" size={24} />
                <Text variant="titleMedium">Beállítások</Text>
              </View>
            </TouchableRipple>

            {/* Logout at bottom */}
            <View style={styles.footer}>
              <Divider />
              <TouchableRipple onPress={handleLogout}>
                <View style={styles.item}>
                  <Icon source="close-circle-outline" size={24} />
                  <Text variant="titleMedium">Kijelentkezés</Text>
                </View>
              </TouchableRipple>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    flexDirection: "row",
  },
  drawer: {
    width: DRAWER_WIDTH,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
