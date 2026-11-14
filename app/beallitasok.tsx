import { ScrollView } from "react-native";

import EnSettings from "@/components/settings/EnSettings";
import { ThemedView } from "@/components/ThemedView";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";
import { Spacing } from "@/constants/spacing";

/**
 * Én › Beállítások: "Ezen a telefonon". The account's settings are on
 * Profil › Beállítások, on the Mi side; each screen links to the other.
 */
export default function EnSettingsScreen() {
  return (
    <ThemedView style={{ flex: 1 }} type="default">
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xl + MODE_SWITCH_CLEARANCE }}>
        <EnSettings />
      </ScrollView>
    </ThemedView>
  );
}
