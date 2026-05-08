import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Surface, Text } from "react-native-paper";
import CategoryChip from "../CategoryChip";
import MetaStat from "../MetaStat";
import ProfileImage from "../ProfileImage";
import { NearestProfile, User } from "@/redux/store.type";
import toDistanceText from "@/lib/functions/distanceText";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";

interface UserItemProps {
  data: NearestProfile | User;
  showOptions?: boolean;
}

const UserItem = ({ data, showOptions }: UserItemProps) => {
  const { id, full_name, avatar_url, created_at, distance } = data as NearestProfile;
  const recommendations = "profileRecommendations" in data
    ? (data.profileRecommendations?.[0]?.count || 0)
    : ("recommendations" in data ? (data as NearestProfile).recommendations : 0);
  const buzinesses = data?.buzinesses?.map(b => b.title.split(" $ ")[0]) || [];

  return (
    <Link href={{ pathname: "/user/[uid]", params: { uid: id } }} asChild>
      <Pressable>
        <Surface style={styles.container} elevation={2} mode="flat">
        <View style={{ flexDirection: "row", gap: Spacing.md }}>
          <ProfileImage
            modal
            uid={id}
            size={50}
            avatar_url={avatar_url}
            style={{ width: 80, height: 80, borderRadius: BorderRadius.sm }}
          />
          <View style={{ flex: 1, gap: Spacing.xs }}>
            <Text variant="titleLarge" style={{ fontSize: 18, lineHeight: 24 }}>{full_name || "Nincs név"}</Text>
            <View style={{ flexWrap: "wrap", flexDirection: "row", gap: Spacing.xs }}>
              {buzinesses?.map((buziness, i) => (
                <CategoryChip key={"buziness" + i}>{buziness}</CategoryChip>
              ))}
            </View>
            <View style={{ flexWrap: "wrap", flexDirection: "row", gap: Spacing.sm }}>
              {!showOptions && !!created_at && distance != null && (
                <MetaStat icon="map-marker">{toDistanceText(distance / 1000)} távolságra</MetaStat>
              )}
              {recommendations > 0 && (
                <MetaStat icon="account-group">{recommendations} ember ajánlja</MetaStat>
              )}
            </View>
          </View>
        </View>
        </Surface>
      </Pressable>
    </Link>
  );
};

export default UserItem;

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
});
