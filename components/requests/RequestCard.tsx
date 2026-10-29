import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { requestAge, requestPlaceText } from "@/lib/requests/format";
import { REQUESTS_BUCKET } from "@/lib/requests/requestImages";
import type { RequestItem } from "@/lib/requests/types";
import { RootState } from "@/redux/store";
import { Link } from "expo-router";
import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Surface, Text } from "react-native-paper";
import { useSelector } from "react-redux";
import CategoryChip from "../CategoryChip";
import MetaStat from "../MetaStat";
import ProfileImage from "../ProfileImage";
import SupabaseImage from "../SupabaseImage";
import { ThemedText } from "../ThemedText";
import RequestMenu from "./RequestMenu";

interface RequestCardProps {
  data: RequestItem;
  /** Small card for the horizontal strip on the community screen. */
  compact?: boolean;
  onDeleted?: (id: number) => void;
  onBlocked?: (author: string) => void;
  onSolved?: (id: number) => void;
}

/** "Megoldva" / "Illik a bizniszedhez" badges, shared by the card and the detail page. */
export const RequestBadges = ({
  solved,
  match,
}: {
  solved: boolean;
  match: boolean;
}) => {
  const theme = useAppTheme();
  if (!solved && !match) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs }}>
      {solved && (
        <CategoryChip
          style={{ backgroundColor: theme.colors.nature }}
          textStyle={{ color: theme.colors.onNature }}
        >
          megoldva
        </CategoryChip>
      )}
      {match && !solved && (
        <CategoryChip
          style={{ backgroundColor: theme.colors.tertiary }}
          textStyle={{ color: theme.colors.onTertiary }}
        >
          illik a bizniszedhez
        </CategoryChip>
      )}
    </View>
  );
};

const RequestCard = memo(
  ({ data, compact, onDeleted, onBlocked, onSolved }: RequestCardProps) => {
    const theme = useAppTheme();
    const uid = useSelector((state: RootState) => state.user.uid);
    const solved = data.status === "solved";
    const mine = data.author === uid;
    const place = requestPlaceText(data);
    const age = requestAge(data.created_at);
    const firstImage = data.images?.[0];

    const card = (
      <Surface
        style={[styles.container, compact && styles.compact, solved && { opacity: 0.8 }]}
        elevation={2}
        mode="flat"
      >
        <View style={styles.header}>
          <ProfileImage
            uid={data.author}
            avatar_url={data.author_avatar}
            style={{ width: 36, height: 36, borderRadius: BorderRadius.md }}
          />
          <View style={{ flex: 1 }}>
            <ThemedText type="bold" numberOfLines={1} variant="labelLarge">
              {mine ? "Te" : (data.author_name ?? "Törölt felhasználó")}
            </ThemedText>
            <Text
              variant="labelSmall"
              numberOfLines={1}
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {age} · {place}
            </Text>
          </View>
          {!compact && (
            <RequestMenu
              request={data}
              onDeleted={() => onDeleted?.(data.id)}
              onBlocked={() => onBlocked?.(data.author)}
              onSolved={() => onSolved?.(data.id)}
            />
          )}
        </View>

        <View style={{ gap: Spacing.xs }}>
          <Text variant="titleMedium" numberOfLines={compact ? 2 : 3}>
            {data.title}
          </Text>
          <RequestBadges solved={solved} match={!!data.is_match && !mine} />
          {!!data.description && (
            <Text
              variant="bodyMedium"
              numberOfLines={compact ? 2 : 4}
              ellipsizeMode="tail"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {data.description}
            </Text>
          )}
        </View>

        {!compact && !!firstImage && (
          <View style={styles.imageWrap}>
            <SupabaseImage
              bucket={REQUESTS_BUCKET}
              path={firstImage}
              style={styles.image}
              resizeMode="cover"
            />
            {data.images.length > 1 && (
              <View style={[styles.imageCount, { backgroundColor: theme.colors.scrim }]}>
                <Icon source="image-multiple" size={14} color="#fff" />
                <Text variant="labelSmall" style={{ color: "#fff" }}>
                  {data.images.length}
                </Text>
              </View>
            )}
          </View>
        )}

        {!compact && data.tags?.length > 0 && (
          <View style={styles.tags}>
            {data.tags.map((tag) => (
              <CategoryChip key={tag}>{tag}</CategoryChip>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <MetaStat icon="comment-outline">
            {data.comment_count > 0 ? `${data.comment_count} hozzászólás` : "Hozzászólok"}
          </MetaStat>
          {compact && !!firstImage && <MetaStat icon="image">kép</MetaStat>}
        </View>
      </Surface>
    );

    return (
      <Link href={{ pathname: "/kerelmek/[id]", params: { id: data.id } }} asChild>
        <Pressable testID={`request-card-${data.id}`} accessibilityRole="button">
          {card}
        </Pressable>
      </Link>
    );
  },
);

RequestCard.displayName = "RequestCard";

export default RequestCard;

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  compact: {
    width: 260,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  imageWrap: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  imageCount: {
    position: "absolute",
    right: Spacing.sm,
    bottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
});
