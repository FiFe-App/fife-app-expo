import React, { useEffect, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  StyleProp,
  TextInput as RNTextInput,
  TextInputKeyPressEventData,
  View,
  ViewStyle,
} from "react-native";
import { Chip, IconButton, TextInput } from "react-native-paper";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";
import { ThemedText } from "./ThemedText";

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

const TagInput = ({
  value,
  onChange,
  placeholder = "Új kulcsszó…",
  style,
}: TagInputProps) => {
  const theme = useAppTheme();
  const inputRef = useRef<RNTextInput>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (adding) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [adding]);

  const commitTag = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return false;
    if (value.includes(trimmed)) return false;
    onChange([...value, trimmed]);
    return true;
  };

  const handleChangeText = (text: string) => {
    if (text.includes(",")) {
      const parts = text.split(",");
      const toCommit = parts.slice(0, -1);
      const next = [...value];
      for (const p of toCommit) {
        const t = p.trim();
        if (t && !next.includes(t)) next.push(t);
      }
      onChange(next);
      setDraft(parts[parts.length - 1]);
    } else {
      setDraft(text);
    }
  };

  const handleSubmit = () => {
    if (commitTag(draft)) {
      setDraft("");
    } else if (!draft.trim()) {
      setAdding(false);
    }
  };

  const handleBlur = () => {
    if (commitTag(draft)) {
      setDraft("");
    }
    if (!draft.trim()) {
      setAdding(false);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (e.nativeEvent.key === "Backspace" && draft === "" && value.length > 0) {
      e.preventDefault?.();
      onChange(value.slice(0, -1));
    }
  };

  const cancelAdding = () => {
    setDraft("");
    setAdding(false);
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <View
      style={[
        {
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: Spacing.xs,
        },
        style,
      ]}
    >
      {value.map((tag, i) => (
        <View
          key={`tag-${i}-${tag}`}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.secondaryContainer,
            borderRadius: BorderRadius.md,
            paddingLeft: Spacing.md,
            paddingRight: Spacing.md + 16,
            paddingVertical: Spacing.xs,
            position: "relative",
          }}
        >
          <ThemedText
            style={{
              color: theme.colors.onSecondaryContainer,
              fontSize: 14,
            }}
          >{tag}
          </ThemedText>
          <IconButton
            icon="close"
            size={16}
            onPress={() => removeTag(i)}
            style={{ position: "absolute", right: 0, margin: 0 }}
            accessibilityLabel="Eltávolítás"
          />
        </View>
      ))}

      {adding ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            minWidth: 140,
            height:32,
            borderWidth: 1,
            borderColor: theme.colors.primary,
            borderRadius: BorderRadius.pill,
            paddingLeft: Spacing.sm,
            paddingRight: Spacing.xs,
            backgroundColor: theme.colors.background,
          }}
        >
          <TextInput
            ref={inputRef}
            mode="flat"
            value={draft}
            placeholder={placeholder}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSubmit}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            returnKeyType="done"
            blurOnSubmit={false}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            style={{
              flexGrow: 1,
              flexShrink: 1,
              backgroundColor: "transparent",
              fontSize: 14,
              height: 32,
              paddingHorizontal: 0,
            }}
            contentStyle={{ paddingHorizontal: 0 }}
          />
          <IconButton
            icon="close"
            size={16}
            onPress={cancelAdding}
            style={{ margin: 0 }}
            accessibilityLabel="Mégse"
          />
        </View>
      ) : (
        <Chip
          mode="outlined"
          icon="plus"
          onPress={() => setAdding(true)}
          style={{
            borderStyle: "dashed",
            borderColor: theme.colors.outline,
            backgroundColor: "transparent",
          }}
        >
          Új kulcsszó
        </Chip>
      )}
    </View>
  );
};

export default TagInput;
