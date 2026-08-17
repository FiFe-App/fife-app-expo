import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { formatDateSeparator } from "@/lib/functions/formatChatDate";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface DateSeparatorProps {
  /** ISO timestamp of the first message below this separator. */
  date: string;
}

/** Centered timestamp marking the start of the conversation or of a new day. */
export function DateSeparator({ date }: DateSeparatorProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.pill, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {formatDateSeparator(date)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  pill: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
  },
});
