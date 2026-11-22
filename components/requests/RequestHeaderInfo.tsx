import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Text } from "react-native-paper";
import ProfileImage from "../ProfileImage";
import { ThemedText } from "../ThemedText";

interface RequestHeaderInfoProps {
  authorId: string;
  /** "Te" for the user's own request. */
  name: string;
  avatarUrl?: string | null;
  /** "2 órája" */
  age: string;
  /** "Újpest, 3.2 km" / "Bárhol" */
  place: string;
}

/**
 * The middle of the request page's app bar, between the back arrow and the ⋮ menu: who asked,
 * when, and where the help is needed. Tapping it opens the asker's profile.
 */
export const RequestHeaderInfo = ({ authorId, name, avatarUrl, age, place }: RequestHeaderInfoProps) => {
  const theme = useAppTheme();

  return (
    <Pressable
      testID="request-header"
      accessibilityRole="button"
      accessibilityLabel={`${name} profilja`}
      onPress={() => router.navigate({ pathname: "/user/[uid]", params: { uid: authorId } })}
      style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}
    >
      <ProfileImage
        uid={authorId}
        avatar_url={avatarUrl}
        style={{ width: 36, height: 36, borderRadius: BorderRadius.md }}
      />
      <View style={{ flex: 1 }}>
        <ThemedText type="bold" numberOfLines={1}>
          {name}
        </ThemedText>
        <Text variant="labelSmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
          {age} · {place}
        </Text>
      </View>
    </Pressable>
  );
};

export default RequestHeaderInfo;
