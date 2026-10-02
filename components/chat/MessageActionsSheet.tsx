import { Spacing } from "@/constants/spacing";
import React from "react";
import { List, Modal, Portal, Surface, useTheme } from "react-native-paper";

// Opened by long-pressing one of your own messages. Replying moved to a swipe
// (SwipeToReply), so deleting is what is left here.
interface MessageActionsSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onDelete: () => void;
}

export function MessageActionsSheet({
  visible,
  onDismiss,
  onDelete,
}: MessageActionsSheetProps) {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
        }}
      >
        <Surface
          style={{
            paddingBottom: Spacing.lg,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
          elevation={4}
        >
          <List.Item
            title="Törlés"
            titleStyle={{ color: theme.colors.error }}
            left={(props) => (
              <List.Icon {...props} icon="delete" color={theme.colors.error} />
            )}
            onPress={onDelete}
          />
        </Surface>
      </Modal>
    </Portal>
  );
}
