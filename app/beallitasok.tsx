import { ScrollView } from "react-native";

import EnSettings from "@/components/settings/EnSettings";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing } from "@/constants/spacing";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";

/**
 * Én › Beállítások: "Ezen a telefonon". The account's settings are on
 * Profil › Beállítások, on the Mi side; each screen links to the other.
 */
export default function EnSettingsScreen() {
  return (
    <ThemedView style={{ flex: 1 }} type="default">
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xl + MODE_SWITCH_CLEARANCE }}>
        <ThemedText type="label">Ezek a beállítások ezen a telefonon élnek.</ThemedText>
        <EnSettings />
      </ScrollView>
    </ThemedView>
  );
}
