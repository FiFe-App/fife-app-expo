import React, { useEffect, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  StyleProp,
  TextInput as RNTextInput,
  TextInputKeyPressEventData,
  View,
  ViewStyle,
} from "react-native";
import { Chip, IconButton, Surface, TextInput, TouchableRipple } from "react-native-paper";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";
import { ThemedText } from "./ThemedText";
import { useTagSuggestions } from "@/hooks/useTagSuggestions";

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  /**
   * Offer autocomplete from the shared tag dictionary (public.tags), ranked by how many
   * live usages each tag has. Off by default so existing call sites keep their exact
   * behaviour; suggesting the established spelling is what stops one concept from living
   * on as a dozen typos.
   */
  suggest?: boolean;
}

const TagInput = ({
  value,
  onChange,
  placeholder = "Új kulcsszó…",
  style,
  suggest = false,
}: TagInputProps) => {
  const theme = useAppTheme();
  const inputRef = useRef<RNTextInput>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const suggestions = useTagSuggestions(draft, suggest && adding, value);

  /**
   * Set while a suggestion press is being delivered. Pressing a suggestion blurs the
   * input first, and the existing blur handler commits the draft and closes the input —
   * which would tear the list down from under the finger before the press lands. Press-in
   * fires before blur on both web and native, so this flag lets that one blur pass.
   */
  const suppressBlurRef = useRef(false);

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
    if (suppressBlurRef.current) {
      // A suggestion is being pressed; selectSuggestion below does the commit.
      suppressBlurRef.current = false;
      return;
    }
    if (commitTag(draft)) {
      setDraft("");
    }
    if (!draft.trim()) {
      setAdding(false);
    }
  };

  /**
   * Commits a suggested tag and keeps the field open, so several can be picked in a row.
   * Goes through commitTag, which means trimming and de-duplication behave exactly as
   * they do for a typed tag.
   */
  const selectSuggestion = (name: string) => {
    suppressBlurRef.current = false;
    commitTag(name);
    setDraft("");
    // Deferred like the open-the-field focus above: the press has just blurred the
    // input, and focusing again in the same tick races that blur.
    setTimeout(() => inputRef.current?.focus(), 0);
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

  const showSuggestions = suggest && adding && suggestions.length > 0;

  return (
    <View style={style}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: Spacing.xs,
        }}
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
              submitBehavior="submit"
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

      {/*
        Rendered in normal flow rather than as an absolute overlay: these inputs live
        inside scroll views, where an overlay gets clipped on native, and pushing the
        form down a little is a fair trade in a settings screen.
      */}
      {showSuggestions && (
        <Surface
          elevation={2}
          mode="flat"
          style={{
            marginTop: Spacing.xs,
            borderRadius: BorderRadius.md,
            overflow: "hidden",
          }}
        >
          {suggestions.map((s) => (
            <TouchableRipple
              key={`suggestion-${s.name}`}
              onPressIn={() => {
                suppressBlurRef.current = true;
              }}
              onPress={() => selectSuggestion(s.name)}
              accessibilityRole="button"
              accessibilityLabel={`${s.name} hozzáadása`}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  gap: Spacing.sm,
                }}
              >
                <ThemedText style={{ flexShrink: 1 }}>{s.name}</ThemedText>
                <ThemedText
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {s.usage_count}
                </ThemedText>
              </View>
            </TouchableRipple>
          ))}
        </Surface>
      )}
    </View>
  );
};

export default TagInput;
