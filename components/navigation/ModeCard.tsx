import { View, type StyleProp, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";

import { modeTokens, useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import type { AppMode } from "@/lib/mode/appMode";
import { ThemedText } from "../ThemedText";
import { enModeIcon, miModeIcon } from "./modeIcons";

/** What each side of the app is, in one line. Shared by every place that explains Én / Mi. */
export const MODE_COPY: Record<AppMode, { name: string; title: string; text: string }> = {
  en: {
    name: "Én",
    title: "A saját tered",
    text: "Csak a tiéd. Amit itt csinálsz, azt senki más nem látja.",
  },
  mi: {
    name: "Mi",
    title: "A közösség",
    text: "Itt más felhasználókkal találkozhatsz: a környékeden élőkkel, segítőkkel.",
  },
};

interface ModeCardProps {
  mode: AppMode;
  /** Highlight this card (e.g. the side the user is about to enter). */
  highlighted?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * One side of the app — its icon, its name and what it is for — wearing the
 * same colour as that side of the Én / Mi switch, so the user can connect the
 * explanation with the control in the bottom bar.
 */
export default function ModeCard({ mode, highlighted, style }: ModeCardProps) {
  const theme = useAppTheme();
  const tone = theme.dark ? "dark" : "light";
  const copy = MODE_COPY[mode];
  const accent = modeTokens[mode][tone].accent;

  return (
    <View
      accessible
      accessibilityLabel={`${copy.name}: ${copy.title}. ${copy.text}`}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.md,
          padding: Spacing.md,
          borderRadius: BorderRadius.lg,
          backgroundColor: modeTokens[mode][tone].switchActive,
          borderWidth: 2,
          borderColor: highlighted ? accent : "transparent",
        },
        style,
      ]}
    >
      <SvgXml
        xml={mode === "en" ? enModeIcon : miModeIcon}
        width={mode === "en" ? 36 : 43}
        height={36}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText variant="titleMedium" type="bold">
          <ThemedText variant="titleMedium" type="bold" style={{ color: accent }}>
            {copy.name}
          </ThemedText>
          {" · "}
          {copy.title}
        </ThemedText>
        <ThemedText variant="bodyMedium">{copy.text}</ThemedText>
      </View>
    </View>
  );
}
