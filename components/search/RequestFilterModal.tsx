import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { REQUEST_SCOPES, RequestScope } from "@/lib/requests/types";
import { View } from "react-native";
import { Modal, Portal, RadioButton, Text, TouchableRipple, useTheme } from "react-native-paper";
import { Button } from "../Button";
import { ModalCard, modalContainerStyle } from "../ModalCard";

const DESCRIPTIONS: Record<string, string> = {
  all: "Minden nyitott kérés",
  for_me: "A környékeden, a bizniszeid és az érdeklődési köreid szerint előre rendezve",
  mine: "A te kéréseid, a megoldottak is",
  solved: "Archivált, megoldott kérések",
};

interface RequestFilterModalProps {
  visible: boolean;
  onDismiss: () => void;
  scope: RequestScope;
  onScopeChange: (scope: RequestScope) => void;
}

/** "Finomítás" for kérések: which slice of them the search looks in. */
export const RequestFilterModal = ({
  visible,
  onDismiss,
  scope,
  onScopeChange,
}: RequestFilterModalProps) => {
  const theme = useTheme();

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={modalContainerStyle}>
        <ModalCard testID="request-filter-modal" style={{ gap: Spacing.sm }}>
          <Text variant="titleMedium">Kérések szűrése</Text>
          {REQUEST_SCOPES.map((s) => (
            <TouchableRipple
              key={s.key}
              testID={`requests-scope-${s.key}`}
              onPress={() => {
                onScopeChange(s.key);
                onDismiss();
              }}
              borderless
              style={{ borderRadius: BorderRadius.md }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.xs }}>
                <RadioButton.Android
                  value={s.key}
                  status={scope === s.key ? "checked" : "unchecked"}
                  onPress={() => {
                    onScopeChange(s.key);
                    onDismiss();
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyLarge">{s.label}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {DESCRIPTIONS[s.key]}
                  </Text>
                </View>
              </View>
            </TouchableRipple>
          ))}
          <Button onPress={onDismiss} style={{ alignSelf: "flex-end" }}>
            Kész
          </Button>
        </ModalCard>
      </Modal>
    </Portal>
  );
};

export default RequestFilterModal;
