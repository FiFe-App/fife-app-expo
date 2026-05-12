import React from "react";
import { Modal, StyleSheet, View, Linking, Platform } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import { openBrowserAsync } from "expo-web-browser";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing } from "@/constants/spacing";
import { ThemedView } from "./ThemedView";

const PATREON_URL = "https://www.patreon.com/c/fifeapp";

type PatreonModalProps = {
  visible: boolean;
  /** Called on explicit button press (X or Köszi, nem) — marks as permanently shown */
  onDismiss: () => void;
  /** Called on hardware back / system close — does NOT mark as shown */
  onClose: () => void;
};

export function PatreonModal({ visible, onDismiss, onClose }: PatreonModalProps) {
  const theme = useTheme();

  const handleOpen = async () => {
    if (Platform.OS === "web") {
      Linking.openURL(PATREON_URL);
    } else {
      await openBrowserAsync(PATREON_URL);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
        <ThemedView style={{alignItems: "center",flex:1}}>
            <IconButton
                icon="close"
                size={28}
                style={styles.closeButton}
                onPress={onDismiss}
                iconColor={theme.colors.onBackground}
            />
            <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
            >
            <View style={styles.content}>
                <ThemedText type="title" style={styles.title}>
                Támogasd a FiFe Appot!
                </ThemedText>
                <ThemedText style={styles.description}>
                Ez egy nonprofit kezdeményezés, célja egy összetartóbb és jobban működő társadalom.{"\n\n"}
                Sajnos az üzemeltetése a szolgáltatásnak nem ingyenes, ezért kérlek, ha megteheted támogass egy pár forinttal Patreonon keresztül! 
                {"\n\n"}
                Köszi szépen{"\n"}Ákos
                </ThemedText>
            </View>
            <View style={styles.bottom}>
                <Button
                mode="contained"
                onPress={handleOpen}
                icon="heart"
                >
                Támogass
                </Button>
                <Button mode="text" textColor={theme.colors.onSurface} onPress={onDismiss} style={styles.dismiss}>
                Köszi, nem
                </Button>
            </View>
            </View>
        </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    padding: Spacing.xxl,
    maxWidth: 500
  },
  closeButton: {
    position: "absolute",
    right: Spacing.md,
    top: Spacing.md,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
  },
  bottom: {
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  dismiss: {
    alignSelf: "center",
  },
});
