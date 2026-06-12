import { Linking, Pressable, StyleProp, Text, TextStyle } from "react-native";
import { useAppTheme } from "@/assets/theme";
import { ThemedText } from "../ThemedText";

const UrlText = ({
  text = "",
  style,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
}) => {
  const theme = useAppTheme();

  // Matches URLs (must start with http/https or www) and phone numbers (7+ digits)
  const regex =
    /(https?:\/\/[^\s]+|www\.[a-zA-Z0-9\-._~%]+(\/[^\s]*)?|\+?[\d][\d\s\-\.()]{5,}\d)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const { index } = match;
    const matched = match[0];
    const end = index + matched.length;

    if (index > lastIndex) {
      parts.push(<Text key={`t-${lastIndex}`}>{text.slice(lastIndex, index)}</Text>);
    }

    const isPhone = /^\+?[\d][\d\s\-\.()]{5,}\d$/.test(matched);
    const href = isPhone
      ? `tel:${matched.replace(/[\s\-\.()]/g, "")}`
      : matched.startsWith("http")
      ? matched
      : `https://${matched}`;

    parts.push(
      <Pressable key={`l-${index}`} onPress={() => Linking.openURL(href)}>
        <ThemedText style={[{ color: theme.colors.secondary }, style]}>{matched}</ThemedText>
      </Pressable>,
    );

    lastIndex = end;
  }

  if (lastIndex < text.length) {
    parts.push(<Text key={`t-${lastIndex}`}>{text.slice(lastIndex)}</Text>);
  }

  return <ThemedText style={style}>{parts}</ThemedText>;
};

export default UrlText;
