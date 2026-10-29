import { supabase } from "@/lib/supabase/supabase";
import { Spacing } from "@/constants/spacing";
import { useState } from "react";
import { View } from "react-native";
import { Button, Modal, Text, useTheme } from "react-native-paper";
import { ModalCard, modalContainerStyle } from "@/components/ModalCard";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";

interface BlockUserModalProps {
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  profileId: string;
  profileName: string;
  onBlocked: () => void;
}

const BlockUserModal = ({
  show,
  setShow,
  profileId,
  profileName,
  onBlocked,
}: BlockUserModalProps) => {
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    if (!myUid) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("blocked_users")
        .insert({ blocker_id: myUid, blocked_id: profileId });
      if (!error) {
        setShow(false);
        onBlocked();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={show}
      onDismiss={() => !loading && setShow(false)}
      contentContainerStyle={modalContainerStyle}
    >
      <ModalCard style={{ gap: Spacing.sm }}>
        <Text variant="titleMedium">Letiltod ezt a felhasználót?</Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {profileName ? `${profileName} nem` : "A felhasználó nem"} fogja látni
          a profilodat, te sem az övét, és az üzenetei, kommentjei sem
          jelennek meg számodra.
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: Spacing.sm,
            marginTop: Spacing.sm,
          }}
        >
          <Button onPress={() => setShow(false)} disabled={loading}>
            Mégse
          </Button>
          <Button
            mode="contained"
            onPress={handleBlock}
            loading={loading}
            disabled={loading}
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
          >
            Letiltás
          </Button>
        </View>
      </ModalCard>
    </Modal>
  );
};

export default BlockUserModal;
