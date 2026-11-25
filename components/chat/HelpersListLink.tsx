import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { Link } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, Text, TouchableRipple, useTheme } from "react-native-paper";

/**
 * A fixed row at the top of the message list that leads to the "Rám írhatsz" list
 * (app/chat/beszelgetnek.tsx): the FiFe members who agreed to be written to.
 */
export function HelpersListLink() {
  const theme = useTheme();
  return (
    <Link asChild href="/chat/beszelgetnek">
      <TouchableRipple
        accessibilityRole="link"
        testID="helpers-list-link"
        style={[styles.card, { backgroundColor: theme.colors.secondaryContainer }]}
      >
        <View style={styles.content}>
          <Icon source="hand-heart" size={28} color={theme.colors.onSecondaryContainer} />
          <View style={styles.textContainer}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSecondaryContainer }}>
              Beszélgetnék valakivel
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSecondaryContainer }}>
              FiFe tagok, akik szívesen meghallgatnak
            </Text>
          </View>
          <Icon source="chevron-right" size={20} color={theme.colors.onSecondaryContainer} />
        </View>
      </TouchableRipple>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginVertical: 4,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  textContainer: {
    flex: 1,
  },
});
