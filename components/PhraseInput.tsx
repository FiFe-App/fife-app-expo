import { useAppTheme } from "@/assets/theme";
import { Spacing } from "@/constants/spacing";
import { useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput } from "react-native";

interface Props {
  phrase: string;
  value: string;
  onChangeText: (text: string) => void;
}

export const PhraseInput = ({ phrase, value, onChangeText }: Props) => {
  const ref = useRef<TextInput>(null);
  const { colors } = useAppTheme();

  return (
    <Pressable style={styles.container} onPress={() => ref.current?.focus()}>
      {/* Invisible sizer — sets the container to the natural phrase dimensions */}
      <Text pointerEvents="none" style={[styles.text, { opacity: 0, color: colors.onBackground }]} selectable={false}>
        {phrase}
      </Text>

      {/* Ghost phrase */}
      <Text pointerEvents="none" style={[styles.text, styles.fill, { opacity: 0.5, color: colors.onBackground }]}>
        {phrase}
      </Text>

      {/* Input — text is transparent so only the cursor renders */}
      <TextInput
        ref={ref}
        style={[styles.text, styles.fill, { color: "transparent" }]}
        cursorColor={colors.onBackground}
        value={value}
        onChangeText={onChangeText}
        multiline
        submitBehavior="submit"
        scrollEnabled={false}
        allowFontScaling
      />

      {/* Typed text overlay — identical style to sizer so characters align exactly */}
      <Text pointerEvents="none" style={[styles.text, styles.fill, { color: colors.onBackground }]}>
        {value}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#ff0000",
    borderRadius: 8,
  },
  text: {
    fontSize: 15,
    letterSpacing: 1,
    fontWeight: "400",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    ...Platform.select({
      web: { userSelect: "none", cursor: "text" } as object,
    }),
  },
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
