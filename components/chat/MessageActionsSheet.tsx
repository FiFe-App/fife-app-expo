import { Spacing } from "@/constants/spacing";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { List, Modal, Portal, Surface, useTheme } from "react-native-paper";

// Opened by long-pressing a message. Your own offer deleting; other people's
// offer reporting the message and blocking its author (App Store guideline 1.2).
// Replying moved to a swipe (SwipeToReply). Each action is shown only when its
// handler is given.
interface MessageActionsSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onBlock?: () => void;
}

export function MessageActionsSheet({
  visible,
  onDismiss,
  onDelete,
  onReport,
  onBlock,
}: MessageActionsSheetProps) {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        // Paper keeps the modal clear of the bottom safe area, which left a
        // gap under the sheet; the sheet pads for it itself instead.
        style={{ marginBottom: 0, justifyContent: "flex-end" }}
        contentContainerStyle={{ margin: 0 }}
      >
        <Surface
          style={{
            paddingBottom: Spacing.lg + bottom,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
          elevation={1}
        >
          {onDelete && (
            <List.Item
              title="Törlés"
              titleStyle={{ color: theme.colors.error }}
              left={(props) => (
                <List.Icon {...props} icon="delete" color={theme.colors.error} />
              )}
              onPress={onDelete}
            />
          )}
          {onReport && (
            <List.Item
              title="Jelentés"
              left={(props) => <List.Icon {...props} icon="alert-octagon" />}
              onPress={onReport}
            />
          )}
          {onBlock && (
            <List.Item
              title="Letiltás"
              titleStyle={{ color: theme.colors.error }}
              left={(props) => (
                <List.Icon {...props} icon="account-cancel" color={theme.colors.error} />
              )}
              onPress={onBlock}
            />
          )}
        </Surface>
      </Modal>
    </Portal>
  );
}
