import SectionLabel from "@/components/buziness/SectionLabel";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { theme, useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { Enums } from "@/database.types";
import typeToLabel from "@/lib/functions/typeToLabel";
import typeToPlaceholder from "@/lib/functions/typeToPlaceholder";
import typeToPrefix from "@/lib/functions/typeToPrefix";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Button, Modal, Surface, TextInput } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import { useSelector } from "react-redux";

interface AddHelpContactDialogProps {
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
}

const helpContactTypes: { label: string; value: Enums<"contact_type"> }[] = [
  { label: "Telefonszám", value: "TEL" },
  { label: "Email-cím", value: "EMAIL" },
  { label: "Webhely", value: "WEB" },
  { label: "Instagram", value: "INSTAGRAM" },
  { label: "Facebook", value: "FACEBOOK" },
  { label: "Cím/Hely", value: "PLACE" },
  { label: "Más", value: "OTHER" },
];

const AddHelpContactDialog = ({ show, setShow }: AddHelpContactDialogProps) => {
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const theme = useAppTheme();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Enums<"contact_type"> | "">("");
  const [data, setData] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!myUid || !title.trim() || !type || !data.trim()) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("help_contacts").insert({
        author: myUid,
        title: title.trim(),
        type,
        data: data.trim(),
        description: description.trim() || null,
      });

      if (error) {
        console.error("Error submitting help contact:", error);
      } else {
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Error submitting help contact:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (!loading) {
      setTitle("");
      setType("");
      setData("");
      setDescription("");
      setSubmitted(false);
      setShow(false);
    }
  };

  return (
    <Modal visible={show} onDismiss={handleDismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ThemedView
          style={{
            padding: Spacing.xl,
            margin: Spacing.xxxl,
          }}
        >
          {submitted ? (
            <View style={{ alignItems: "center", gap: Spacing.lg }}>
              <ThemedText type="subtitle">
                Köszi a hogy segítesz segíteni!
              </ThemedText>
              <ThemedText>
                Átnézzük, hogy mit küldél be és ha megfelel, bekerül a listába:)
              </ThemedText>
              <Button mode="contained" onPress={handleDismiss}>
                Rendben
              </Button>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              <ThemedText type="subtitle" style={{ marginBottom: Spacing.sm }}>
                Ismersz egy segélyvonalat?
              </ThemedText>
              <ThemedText
                variant="labelSmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: Spacing.lg,
                }}
              >
                Csak akkor küldd be, ha biztosan létezik.
              </ThemedText>

              <View style={{ gap: Spacing.lg }}>
                <TextInput
                  label="Cím*"
                  value={title}
                  onChangeText={setTitle}
                  mode="outlined"
                  placeholder="Lelki Elsősegély Telefonszolgálat"
                  disabled={loading}
                />

                <View style={{ gap: Spacing.sm }}>
                  <SectionLabel label="Elérhetőség" required />
                    <Dropdown
                      label="Típus*"
                      placeholder="Válassz típust"
                      options={helpContactTypes}
                      value={type}
                      onSelect={(value) =>
                        setType((value as Enums<"contact_type">) ?? "")
                      }
                      mode="outlined"
                      menuContentStyle={{
                        backgroundColor: theme.colors.elevation.level2,
                      }}
                    />

                    <TextInput
                      label={typeToLabel(type || undefined)}
                      value={data}
                      onChangeText={setData}
                      mode="outlined"
                      left={typeToPrefix(type || undefined)}
                      placeholder={typeToPlaceholder(type || undefined)}
                      disabled={loading || !type}
                    />
                </View>

                <TextInput
                  label="Leírás (opcionális)"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  mode="outlined"
                  placeholder="Mikor és kiknek érdemes hívni?"
                  disabled={loading}
                />

                <View
                  style={{
                    flexDirection: "row",
                    gap: Spacing.sm,
                    marginTop: Spacing.sm,
                  }}
                >
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
                    disabled={loading || !title.trim() || !type || !data.trim()}
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
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddHelpContactDialog;
