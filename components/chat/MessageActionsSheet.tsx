import { Spacing } from "@/constants/spacing";
import React from "react";
import { List, Modal, Portal, Surface, useTheme } from "react-native-paper";

interface MessageActionsSheetProps {
  visible: boolean;
  onDismiss: () => void;
  isOwn: boolean;
  onReply: () => void;
  onDelete: () => void;
}

export function MessageActionsSheet({
  visible,
  onDismiss,
  isOwn,
  onReply,
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
            title="Válasz"
            left={(props) => <List.Icon {...props} icon="reply" />}
            onPress={onReply}
          />
          {isOwn && (
            <List.Item
              title="Törlés"
              titleStyle={{ color: theme.colors.error }}
              left={(props) => (
                <List.Icon {...props} icon="delete" color={theme.colors.error} />
              )}
              onPress={onDelete}
            />
          )}
        </Surface>
      </Modal>
    </Portal>
  );
}
