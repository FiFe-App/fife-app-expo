import { supabase } from "@/lib/supabase/supabase";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Button,
  Modal,
  Text,
  TextInput,
} from "react-native-paper";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import {
  Dropdown,
  DropdownInputProps,
} from "react-native-paper-dropdown";

interface ReportProfileModalProps {
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  profileId: string;
  profileName: string;
}

const reportReasons = [
  { label: "Megszegte a feltételeket", value: "terms_violation" },
  { label: "Szerintem nem megbízható", value: "not_trustworthy" },
  { label: "Illegális tevékenység", value: "illegal_activity" },
  { label: "Egyéb", value: "other" },
];

const ReportProfileModal = ({
  show,
  setShow,
  profileId,
  profileName,
}: ReportProfileModalProps) => {
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!myUid || !reason || !description.trim()) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("reports").insert({
        author: myUid,
        reported_profile_id: profileId,
        reason,
        description: description.trim(),
      });

      if (error) {
        console.error("Error submitting report:", error);
      } else {
        setSubmitted(true);
        // Reset form after a delay
        setTimeout(() => {
          setReason("");
          setDescription("");
          setSubmitted(false);
          setShow(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (!loading) {
      setReason("");
      setDescription("");
      setSubmitted(false);
      setShow(false);
    }
  };

  return (
    <Modal visible={show} onDismiss={handleDismiss}>
      <ThemedView
        style={{
          padding: 20,
          margin: 30,
          maxHeight: "80%",
        }}
      >
        {submitted ? (
          <View style={{ alignItems: "center", gap: 16 }}>
            <ThemedText type="subtitle">
              Köszönjük, hogy visszajeleztél!
            </ThemedText>
          </View>
        ) : (
          <ScrollView>
            <ThemedText type="subtitle" style={{ marginBottom: 16 }}>
              Feljelented őt: {profileName}?
            </ThemedText>

            <View style={{ gap: 16 }}>
              <Dropdown
                label="Jelentés oka*"
                placeholder="Válassz okot"
                options={reportReasons}
                value={reason}
                onSelect={setReason}
                CustomDropdownInput={({
                  placeholder,
                  selectedLabel,
                  label,
                  rightIcon,
                }: DropdownInputProps) => (
                  <TextInput
                    placeholder={placeholder}
                    label={label}
                    value={selectedLabel}
                    right={rightIcon}
                    editable={false}
                    mode="outlined"
                  />
                )}
              />

              <TextInput
                label="Fejtsd ki bővebben*"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                mode="outlined"
                placeholder="Írd le részletesen, miért jelented ezt a profilt..."
                disabled={loading}
              />

              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <Button
                  mode="outlined"
                  onPress={handleDismiss}
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  Mégse
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={loading || !reason || !description.trim()}
                  loading={loading}
                  style={{ flex: 1 }}
                >
                  Küldés
                </Button>
              </View>
            </View>
          </ScrollView>
        )}
      </ThemedView>
    </Modal>
  );
};

export default ReportProfileModal;
