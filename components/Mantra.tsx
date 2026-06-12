import { useState } from "react";
import { Platform, useWindowDimensions, View } from "react-native";
import { IconButton, Text, TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { setMantra } from "@/redux/reducers/userReducer";
import { Spacing } from "@/constants/spacing";

// react-native-web does not support adjustsFontSizeToFit
const WEB_FONT_SIZE = 26;

export default function Mantra() {
  const dispatch = useDispatch();
  const { mantra, name } = useSelector((state: RootState) => state.user);
  const { width } = useWindowDimensions();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const text = mantra || `Szia, ${name ?? ""}`;

  const fontSize =
    Platform.OS === "web"
      ? WEB_FONT_SIZE
      : Math.min(34, Math.max(16, Math.floor(((width - 120) / Math.max(text.length, 8)) * 1.8)));

  const startEdit = () => {
    setDraft(text);
    setEditing(true);
  };

  const save = () => {
    dispatch(setMantra(draft.trim()));
    setEditing(false);
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
      }}
    >
      {editing ? (
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={save}
          dense
          autoFocus
          style={{ flex: 1, backgroundColor: "transparent" }}
        />
      ) : (
        <Text
          variant="headlineMedium"
          numberOfLines={1}
          adjustsFontSizeToFit={Platform.OS !== "web"}
          style={{
            flex: 1,
            fontSize,
            lineHeight: Math.ceil(fontSize * 1.3),
            fontFamily: "Piazzolla-Medium",
          }}
        >
          {text}
        </Text>
      )}
      <IconButton
        icon={editing ? "check" : "pencil"}
        onPress={editing ? save : startEdit}
      />
    </View>
  );
}
