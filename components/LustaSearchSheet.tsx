import { useState } from "react";
import { View } from "react-native";
import { Chip, Icon, TextInput, ThemeProvider, useTheme } from "react-native-paper";
import { useDispatch } from "react-redux";

import { getTheme, useAppTheme } from "@/assets/theme";
import { Button } from "@/components/Button";
import { KeyboardAwareModal } from "@/components/KeyboardAwareModal";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { runSearch } from "@/lib/search/runSearch";
import type { SearchMode } from "@/redux/store.type";

interface LustaSearchSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

/**
 * The bridge from a Lusta Lista task (Én) to the community search (Mi): "who
 * around here could help with this?". The task's text never crosses over —
 * the field opens empty and only what the user types here is searched, because
 * the smart search sends its query to OpenAI. The sheet says so, too.
 */
export default function LustaSearchSheet({ visible, onDismiss }: LustaSearchSheetProps) {
  const enTheme = useTheme();
  // The sheet already belongs to the Mi side, so it wears Mi's colours.
  const miTheme = getTheme(enTheme.dark, "mi");

  return (
    <KeyboardAwareModal
      visible={visible}
      onDismiss={onDismiss}
      style={{ justifyContent: "flex-end" }}
      contentContainerStyle={{ justifyContent: "flex-end" }}
    >
      <ThemeProvider theme={miTheme}>
        {visible && <SheetContent onDismiss={onDismiss} />}
      </ThemeProvider>
    </KeyboardAwareModal>
  );
}

function SheetContent({ onDismiss }: { onDismiss: () => void }) {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("biznisz");

  const submit = () => {
    if (runSearch(dispatch, query, mode, "navigate")) onDismiss();
  };

  return (
    <View
      accessibilityViewIsModal
      style={{
        width: "100%",
        maxWidth: 600,
        alignSelf: "center",
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl,
        gap: Spacing.lg,
      }}
    >
      <View
        aria-hidden
        style={{
          alignSelf: "center",
          width: 40,
          height: 5,
          borderRadius: 3,
          backgroundColor: theme.colors.outlineVariant,
        }}
      />

      <View
        style={{
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.xs,
          backgroundColor: theme.colors.surface,
          borderRadius: BorderRadius.full,
          paddingVertical: Spacing.xs,
          paddingHorizontal: Spacing.md,
        }}
      >
        <Icon source="account-group-outline" size={14} color={theme.colors.tertiary} />
        <ThemedText variant="labelMedium" type="bold" style={{ color: theme.colors.tertiary }}>
          Átlépsz a közösségbe
        </ThemedText>
      </View>

      <View style={{ gap: Spacing.xs }}>
        <ThemedText variant="headlineSmall" type="bold">
          Ki segít ebben a környéken?
        </ThemedText>
        <ThemedText variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          A teendőd nem megy át. Csak az, amit itt beírsz.
        </ThemedText>
      </View>

      <TextInput
        mode="outlined"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={submit}
        returnKeyType="search"
        autoFocus
        placeholder={mode === "fife" ? "Kit keresel?" : "Mire van szükséged?"}
        accessibilityLabel={mode === "fife" ? "Keresés a fifék között" : "Keresés a bizniszek között"}
        left={<TextInput.Icon icon="magnify" />}
        outlineColor={theme.colors.tertiary}
        activeOutlineColor={theme.colors.tertiary}
        outlineStyle={{ borderRadius: BorderRadius.full, borderWidth: 2 }}
        style={{ backgroundColor: theme.colors.elevation.level1 }}
      />

      <View style={{ flexDirection: "row", gap: Spacing.sm }}>
        <Chip
          selected={mode === "biznisz"}
          showSelectedCheck={false}
          icon="briefcase-outline"
          onPress={() => setMode("biznisz")}
          accessibilityState={{ selected: mode === "biznisz" }}
        >
          Bizniszek
        </Chip>
        <Chip
          selected={mode === "fife"}
          showSelectedCheck={false}
          icon="account"
          onPress={() => setMode("fife")}
          accessibilityState={{ selected: mode === "fife" }}
        >
          Fifék
        </Chip>
      </View>

      {mode === "biznisz" && (
        <View
          style={{
            flexDirection: "row",
            gap: Spacing.sm,
            alignItems: "flex-start",
            backgroundColor: theme.colors.elevation.level1,
            borderRadius: BorderRadius.lg,
            padding: Spacing.md,
          }}
        >
          <Icon source="information-outline" size={20} color={theme.colors.tertiary} />
          <ThemedText variant="bodySmall" style={{ flex: 1 }}>
            Az okos keresésnél ez a szöveg az OpenAI-hoz is eljut. Ezért nem a teendődet
            küldjük, hanem amit most te írsz ide.
          </ThemedText>
        </View>
      )}

      <Button mode="contained" icon="magnify" onPress={submit} disabled={!query.trim()}>
        Keresés
      </Button>
    </View>
  );
}
