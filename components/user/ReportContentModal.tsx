import { supabase } from "@/lib/supabase/supabase";
import { useState } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import {
  Button,
  RadioButton,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import {
  KeyboardAwareModal,
  useKeyboardHeight,
} from "@/components/KeyboardAwareModal";
import { ModalCard, modalContainerStyle } from "@/components/ModalCard";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";

export type ReportTargetType =
  | "profile"
  | "message"
  | "group_message"
  | "biznisz"
  | "comment";

interface ReportContentModalProps {
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  /** What is being reported; a profile by default. */
  targetType?: ReportTargetType;
  /** Id of the reported message / biznisz / comment; not used for a profile. */
  targetId?: string | number | null;
  /** The person behind it: the profile itself, or the content's author. */
  reportedUserId: string | null;
  /** Who or what the report is about: a person's or a biznisz's name. */
  label: string;
  /** Text of the reported content, kept with the report in case it is deleted. */
  excerpt?: string | null;
}

const targetNouns: Record<ReportTargetType, string> = {
  profile: "ezt a profilt",
  message: "ezt az üzenetet",
  group_message: "ezt az üzenetet",
  biznisz: "ezt a bizniszt",
  comment: "ezt a kommentet",
};

const reportReasons = [
  { label: "Sértő, bántó vagy zaklató tartalom", value: "objectionable_content" },
  { label: "Megszegte a feltételeket", value: "terms_violation" },
  { label: "Spam vagy átverés", value: "spam" },
  { label: "Nem megbízható", value: "not_trustworthy" },
  { label: "Illegális tevékenység", value: "illegal_activity" },
  { label: "Gyermekbántalmazás / Kiskorú védelme", value: "child_safety" },
  { label: "Egyéb", value: "other" },
];

const ReportContentModal = ({
  show,
  setShow,
  targetType = "profile",
  targetId,
  reportedUserId,
  label,
  excerpt,
}: ReportContentModalProps) => {
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const keyboardHeight = useKeyboardHeight();
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!myUid || !reason) {
      return;
    }
    if (targetType === "profile" ? !reportedUserId : targetId == null) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("reports").insert({
        author: myUid,
        reported_profile_id: reportedUserId,
        target_type: targetType,
        target_id: targetType === "profile" ? null : String(targetId),
        target_excerpt: excerpt?.slice(0, 1000) ?? null,
        reason,
        description: description.trim(),
      });

      if (error) {
        console.error("Error submitting report:", error);
      } else {
        setSubmitted(true);
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

  const title =
    targetType === "profile"
      ? `Feljelented őt: ${label}?`
      : `Jelented ${targetNouns[targetType]}?`;

  return (
    <KeyboardAwareModal
      visible={show}
      onDismiss={handleDismiss}
      contentContainerStyle={modalContainerStyle}
    >
        <ModalCard style={{ maxHeight: (windowHeight - keyboardHeight) * 0.9 }}>
          {submitted ? (
            <View style={{ gap: Spacing.sm }}>
              <Text variant="titleMedium">Köszönjük a jelzést!</Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                A jelentést 24 órán belül megvizsgáljuk. A szabályokat sértő
                tartalmat eltávolítjuk, a bántalmazó felhasználókat pedig
                kizárjuk a közösségből.
              </Text>
              <Button onPress={handleDismiss} style={{ alignSelf: "flex-end" }}>
                Rendben
              </Button>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text variant="titleMedium">{title}</Text>
              {targetType !== "profile" && !!label && (
                <Text
                  variant="bodySmall"
                  numberOfLines={1}
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {label}
                </Text>
              )}
              {targetType !== "profile" && !!excerpt && (
                <View
                  style={{
                    marginTop: Spacing.sm,
                    padding: Spacing.sm,
                    borderRadius: BorderRadius.md,
                    borderLeftWidth: 3,
                    borderLeftColor: theme.colors.outlineVariant,
                    backgroundColor: theme.colors.surfaceVariant,
                  }}
                >
                  <Text variant="bodyMedium" numberOfLines={4}>
                    {excerpt}
                  </Text>
                </View>
              )}

              <View style={{ marginTop: Spacing.sm }}>
                {reportReasons.map((option) => (
                  <TouchableRipple
                    key={option.value}
                    onPress={() => setReason(option.value)}
                    disabled={loading}
                    borderless
                    style={{ borderRadius: BorderRadius.md }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: Spacing.sm,
                        paddingVertical: Spacing.xs,
                      }}
                    >
                      <RadioButton.Android
                        value={option.value}
                        status={reason === option.value ? "checked" : "unchecked"}
                        onPress={() => setReason(option.value)}
                        disabled={loading}
                      />
                      <Text variant="bodyMedium" style={{ flex: 1 }}>
                        {option.label}
                      </Text>
                    </View>
                  </TouchableRipple>
                ))}
              </View>

              <TextInput
                label="Részletek (nem kötelező)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                mode="outlined"
                dense
                disabled={loading}
                style={{ marginTop: Spacing.sm }}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: Spacing.sm,
                  marginTop: Spacing.md,
                }}
              >
                <Button onPress={handleDismiss} disabled={loading}>
                  Mégse
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={loading || !reason}
                  loading={loading}
                >
                  Küldés
                </Button>
              </View>
            </ScrollView>
          )}
        </ModalCard>
    </KeyboardAwareModal>
  );
};

export default ReportContentModal;
