import { supabase } from "@/lib/supabase/supabase";
import { Spacing } from "@/constants/spacing";
import { useState } from "react";
import { View } from "react-native";
import { Button, Modal } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
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
    <Modal visible={show} onDismiss={() => !loading && setShow(false)}>
      <ThemedView style={{ padding: Spacing.xl, margin: Spacing.xxxl, gap: Spacing.lg }}>
        <ThemedText type="subtitle">Blokkolod ezt a felhasználót?</ThemedText>
        <ThemedText>{profileName} nem fogja látni a profilodat, te sem az övét.</ThemedText>
        <View style={{ flexDirection: "row", gap: Spacing.sm }}>
          <Button
            mode="outlined"
            onPress={() => setShow(false)}
            disabled={loading}
            style={{ flex: 1 }}
          >
            Mégse
          </Button>
          <Button
            mode="contained"
            onPress={handleBlock}
            loading={loading}
            disabled={loading}
            style={{ flex: 1 }}
            buttonColor="#c0392b"
          >
            Blokkolás
          </Button>
        </View>
      </ThemedView>
    </Modal>
  );
};

export default BlockUserModal;
