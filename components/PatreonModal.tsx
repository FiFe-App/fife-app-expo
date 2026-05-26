import React from "react";
import { Modal, StyleSheet, View, Linking, Platform } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import { openBrowserAsync } from "expo-web-browser";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing } from "@/constants/spacing";
import { ThemedView } from "./ThemedView";
import { Image } from "expo-image";

const PATREON_URL = "https://www.patreon.com/c/fifeapp";

type PatreonModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

export function PatreonModal({ visible, onDismiss }: PatreonModalProps) {
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
      onRequestClose={onDismiss}
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
                <Image
                  source={require("@/assets/images/Trust.png")}
                  contentFit="contain"
                  style={{ width: "100%", minHeight: 200, zIndex: 5 }}
                />
                <ThemedText type="title" style={styles.title}>
                Támogasd a FiFe Appot!
                </ThemedText>
                <ThemedText style={styles.description}>
                Mi egy teljesen nonprofit kezdeményezés vagyunk, célunk, egy összetartóbb és jobban működő társadalom.
                Sajnos az üzemeltetése nem ingyenes, ezért kérlek, ha megteheted támogas egy pár forinttal Patreonon keresztül!
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
