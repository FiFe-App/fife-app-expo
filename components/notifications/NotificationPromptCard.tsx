import { View } from "react-native";
import { Icon, Surface } from "react-native-paper";
import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";

interface NotificationPromptCardProps {
  icon: string;
  title: string;
  body: string;
  acceptText?: string;
  dismissText?: string;
  onAccept: () => void;
  onDismiss: () => void;
  loading?: boolean;
}

/**
 * A single contextual opt-in ask, rendered on /me in place of the
 * notification questions the signup wizard used to put to the user
 * before they had seen the app.
 */
export default function NotificationPromptCard({
  icon,
  title,
  body,
  acceptText = "Kérem",
  dismissText = "Most nem",
  onAccept,
  onDismiss,
  loading,
}: NotificationPromptCardProps) {
  const theme = useAppTheme();

  return (
    <Surface
      elevation={1}
      style={{
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
        <Icon source={icon} size={24} color={theme.colors.primary} />
        <ThemedText style={{ flex: 1 }} type="defaultSemiBold">
          {title}
        </ThemedText>
      </View>
      <ThemedText type="label">{body}</ThemedText>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: Spacing.xs }}>
        <Button mode="text" onPress={onDismiss} disabled={loading}>
          {dismissText}
        </Button>
        <Button mode="contained-tonal" onPress={onAccept} loading={loading} disabled={loading}>
          {acceptText}
        </Button>
      </View>
    </Surface>
  );
}
