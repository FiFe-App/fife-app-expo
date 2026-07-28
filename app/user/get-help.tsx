import GetHelp from "@/components/user/GetHelp";
import { ThemedView } from "@/components/ThemedView";
import { useAppTheme } from "@/assets/theme";

export default function GetHelpPage() {
  const theme = useAppTheme();
  return (
    <ThemedView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <GetHelp />
    </ThemedView>
  );
}
