import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, StyleSheet, Text, View } from "react-native";
import { Button as PaperButton, Dialog, Icon, Portal } from "react-native-paper";
import { Image } from "expo-image";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";

import { ThemedText } from "@/components/ThemedText";
import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { setInAppMessageOpenIcon, setInAppMessageVisible } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";

type InAppMessageRow = Tables<"in_app_messages">;

/**
 * Device-local rather than in the user slice: logging out resets that slice
 * wholesale, and the same dialog popping up again after every re-login would
 * be noise.
 */
const SEEN_KEY = "inAppMessage:lastSeenId";

/** In-app paths go through the router; everything else (https, mailto, tel) to the OS. */
function openTarget(url: string) {
  const target = url.trim();
  if (target.startsWith("/")) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(target as any);
  } else {
    Linking.openURL(target).catch(() => {});
  }
}

function LinkedBody({ text, onLinkPress }: { text: string; onLinkPress: (url: string) => void }) {
  const theme = useAppTheme();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  // `[label](url)` or a bare http(s) URL.
  const linkRegex = /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s)]+)/g;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const label = match[1] ?? match[3];
    const url = match[2] ?? match[3];
    parts.push(
      <Text
        key={`l-${match.index}`}
        onPress={() => onLinkPress(url)}
        style={{ color: theme.colors.primary, textDecorationLine: "underline" }}
      >
        {label}
      </Text>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <ThemedText>{parts}</ThemedText>;
}

/**
 * The "Visszajelzés" dialog, with its content coming from the newest
 * in_app_messages row (edited in the admin). Mounted once in the root layout
 * for signed-in users: the me screen's menu opens it through redux, and a row
 * this device has not seen yet opens it on its own — on launch, on returning
 * to the foreground, or live over realtime when the admin saves.
 */
export default function InAppMessageDialog() {
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const uid = useSelector((state: RootState) => state.user.uid);
  const visible = useSelector((state: RootState) => state.info.inAppMessageVisible);
  const [dialog, setDialog] = useState<InAppMessageRow | null>(null);

  const present = useCallback(
    async (row: InAppMessageRow) => {
      setDialog(row);
      dispatch(setInAppMessageOpenIcon(row.open_icon?.trim() || null));
      let lastSeen: string | null = null;
      try {
        lastSeen = await AsyncStorage.getItem(SEEN_KEY);
      } catch {
        return;
      }
      // First run on this device: whatever is current now is not news to a
      // fresh install, and existing users only had the old hardcoded text,
      // which the first row reproduces. Remember it without popping up.
      if (lastSeen === null) {
        AsyncStorage.setItem(SEEN_KEY, String(row.id)).catch(() => {});
        return;
      }
      if (row.id > Number(lastSeen)) {
        AsyncStorage.setItem(SEEN_KEY, String(row.id)).catch(() => {});
        dispatch(setInAppMessageVisible(true));
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!uid) return;
    const loadLatest = () =>
      supabase
        .from("in_app_messages")
        .select("*")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) present(data);
        });
    loadLatest();

    // Realtime drops while the app is in the background, so catch up on
    // anything saved in the meantime when it comes back.
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") loadLatest();
    });

    const channel = supabase
      .channel(`in_app_messages:${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "in_app_messages" },
        (payload) => present(payload.new as InAppMessageRow),
      )
      .subscribe();

    return () => {
      appStateSub.remove();
      supabase.removeChannel(channel);
    };
  }, [uid, present]);

  const close = () => dispatch(setInAppMessageVisible(false));

  const handleTarget = (url: string) => {
    close();
    openTarget(url);
  };

  if (!uid || !dialog) return null;

  const icon = dialog.icon?.trim();
  const isImage = !!icon && /^https?:\/\//.test(icon);
  const buttons = [
    { label: dialog.primary_label, url: dialog.primary_url, mode: "contained" as const },
    { label: dialog.secondary_label, url: dialog.secondary_url, mode: "contained-tonal" as const },
  ].filter((b): b is { label: string; url: string; mode: "contained" | "contained-tonal" } =>
    !!b.label?.trim() && !!b.url?.trim(),
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={close}>
        {!!icon && (
          <View style={styles.iconWrap}>
            {isImage ? (
              <Image source={{ uri: icon }} style={styles.image} contentFit="cover" />
            ) : (
              <Icon source={icon} size={48} color={theme.colors.primary} />
            )}
          </View>
        )}
        <Dialog.Title style={{ textAlign: "center" }}>{dialog.title}</Dialog.Title>
        <Dialog.Content>
          <LinkedBody text={dialog.body} onLinkPress={handleTarget} />
        </Dialog.Content>
        {buttons.length > 0 && (
          // Plain react-native-paper Button: Dialog.Actions force-injects
          // compact={true}, which @/components/Button's compact styling
          // clips to nothing.
          <Dialog.Actions style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
            {buttons.map((b) => (
              <PaperButton key={b.mode} mode={b.mode} onPress={() => handleTarget(b.url)}>
                {b.label}
              </PaperButton>
            ))}
          </Dialog.Actions>
        )}
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    paddingTop: Spacing.md,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
  },
});
