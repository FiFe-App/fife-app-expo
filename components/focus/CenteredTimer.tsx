import { ReactNode, useEffect, useState } from "react";
import { ImageSourcePropType, View } from "react-native";
import { Image } from "expo-image";
import { Button as PaperButton, Dialog, IconButton, Portal } from "react-native-paper";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";

/** The current time, re-rendering every second while `active`. */
export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

interface Props {
  time: string;
  image: ImageSourcePropType;
  /** Shown in a dialog from the "i" button in the corner. */
  info: { title: string; text: string };
  /** A quiet line under the timer, e.g. which round is running. */
  caption?: string;
  /** Controls above the main button, e.g. a picker. */
  picker?: ReactNode;
  children?: ReactNode;
}

/**
 * The whole screen of both Fókusz and Szünet: a timer, the feature's image
 * under it, and the controls below — nothing else but the "i" in the corner.
 */
export default function CenteredTimer({ time, image, info, caption, picker, children }: Props) {
  const theme = useAppTheme();
  const [infoVisible, setInfoVisible] = useState(false);

  return (
    <ThemedView
      type="default"
      style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.lg, padding: Spacing.lg }}
    >
      <IconButton
        icon="information-outline"
        accessibilityLabel="Hogyan működik?"
        iconColor={theme.colors.outline}
        onPress={() => setInfoVisible(true)}
        style={{ position: "absolute", top: Spacing.sm, right: Spacing.sm }}
      />
      <View style={{ alignItems: "center" }}>
        <ThemedText type="title" style={{ fontVariant: ["tabular-nums"] }}>
          {time}
        </ThemedText>
        {!!caption && (
          <ThemedText style={{ color: theme.colors.outline }}>{caption}</ThemedText>
        )}
      </View>
      <Image
        source={image}
        style={{ width: 140, height: 140, borderRadius: BorderRadius.lg }}
        contentFit="contain"
      />
      {picker}
      <View style={{ minHeight: 48, flexDirection: "row", gap: Spacing.sm, alignItems: "center" }}>
        {children}
      </View>
      <Portal>
        <Dialog visible={infoVisible} onDismiss={() => setInfoVisible(false)}>
          <Dialog.Title>{info.title}</Dialog.Title>
          <Dialog.Content>
            <ThemedText>{info.text}</ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setInfoVisible(false)}>Értem</PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ThemedView>
  );
}
