import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { openRequestComposer } from "@/redux/reducers/requestsReducer";
import { RootState } from "@/redux/store";
import { Pressable, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import ProfileImage from "../ProfileImage";

/**
 * The "post something" box of the community screen, like the one on top of a social feed: an
 * avatar and a field that is not one. Tapping it opens the new-request modal
 * (NewRequestModal), whose title input looks the same.
 */
export const RequestComposerPrompt = () => {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const uid = useSelector((state: RootState) => state.user.uid);
  const avatarUrl = useSelector((state: RootState) => state.user.userData?.avatar_url);

  if (!uid) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        marginHorizontal: Spacing.md,
        marginVertical: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        backgroundColor: theme.colors.elevation.level1,
      }}
    >
      <ProfileImage
        uid={uid}
        avatar_url={avatarUrl}
        style={{ width: 40, height: 40, borderRadius: BorderRadius.md }}
      />
      <Pressable
        testID="request-composer-prompt"
        accessibilityRole="button"
        accessibilityLabel="Új kérés írása"
        onPress={() => dispatch(openRequestComposer())}
        style={{
          flex: 1,
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.sm,
          paddingHorizontal: Spacing.md,
          borderRadius: BorderRadius.full,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
          backgroundColor: theme.colors.background,
        }}
      >
        <Text
          numberOfLines={1}
          style={{ flex: 1, color: theme.colors.onSurfaceVariant, fontFamily: "RedHatText" }}
        >
          Kell valamiben segítség?
        </Text>
        <Icon source="hand-heart-outline" size={20} color={theme.colors.primary} />
      </Pressable>
    </View>
  );
};

export default RequestComposerPrompt;
