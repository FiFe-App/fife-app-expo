import HelpersList from "@/components/chat/HelpersList";
import { ThemedView } from "@/components/ThemedView";
import { useAppTheme } from "@/assets/theme";

export default function BeszelgetnekPage() {
  const theme = useAppTheme();
  return (
    <ThemedView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <HelpersList />
    </ThemedView>
  );
}
