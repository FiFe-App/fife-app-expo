import React from "react";
import { FlatList, Pressable, View } from "react-native";
import { ActivityIndicator, Icon, Text } from "react-native-paper";
import { Link, router } from "expo-router";
import { NearestProfile } from "@/redux/store.type";
import ProfileImage from "../ProfileImage";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { theme } from "@/assets/theme";

interface FiFeRadarProps {
  data: NearestProfile[];
  load?: () => void;
  canLoadMore?: boolean;
  loading?: boolean;
  error?: string | null;
}

/** Alternating layout: even items show image with name below,
 * odd items show name on top with image below. */
const RadarItem = ({ data, reversed }: { data: NearestProfile; reversed: boolean }) => (
  <Link href={{ pathname: "/user/[uid]", params: { uid: data.id } }} asChild>
    <Pressable>
      <View
        style={{
          width: 92,
          alignItems: "center",
          gap: Spacing.xs,
          flexDirection: reversed ? "column-reverse" : "column",
        }}
      >
        <ProfileImage
          uid={data.id}
          avatar_url={data.avatar_url}
          style={{ width: 72, height: 72, borderRadius: BorderRadius.md }}
        />
        <ThemedText variant="labelSmall" type="bold" numberOfLines={1} style={{ textAlign: "center", maxWidth: 88 }}>
          {data.full_name || "Nincs név"}
        </ThemedText>
      </View>
    </Pressable>
  </Link>
);

export const FiFeRadar: React.FC<FiFeRadarProps> = ({
  data,
  load,
  canLoadMore,
  loading,
  error,
}) => {
  const users = data.filter((item) => item.id !== "-1");

  return (
    <View>
      <Pressable
        onPress={() => router.push("/fifeRadar")}
        style={{
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: theme.colors.background,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: Spacing.xs }}>
          <ThemedText variant="labelLarge" type="bold" style={{ color: theme.colors.secondary }}>
            FiFe Radar
          </ThemedText>
          <Icon size={18} color={theme.colors.secondary} source="wifi" />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
          <ThemedText variant="labelMedium" style={{ color: theme.colors.secondary }}>
            Több
          </ThemedText>
          <Icon size={18} color={theme.colors.secondary} source="chevron-right" />
        </View>
      </Pressable>
      {!!error && (
        <ThemedView style={{ margin: 6, alignItems: "center" }} type="error">
          <ThemedText type="error">{error}</ThemedText>
        </ThemedView>
      )}
      <FlatList
        horizontal
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <RadarItem data={item} reversed={index % 2 === 1} />
        )}
        contentContainerStyle={{
          gap: Spacing.xs,
          paddingHorizontal: Spacing.xs,
          paddingVertical: Spacing.sm,
          alignItems: "center",
        }}
        showsHorizontalScrollIndicator={false}
        onEndReached={() => {
          if (canLoadMore && !loading) load?.();
        }}
        onEndReachedThreshold={0.7}
        ListFooterComponent={
          canLoadMore && !!users.length ? (
            <ActivityIndicator style={{ marginHorizontal: Spacing.md }} />
          ) : null
        }
        ListEmptyComponent={
          loading ? <ActivityIndicator style={{ padding: Spacing.lg }} /> : null
        }
      />
    </View>
  );
};
