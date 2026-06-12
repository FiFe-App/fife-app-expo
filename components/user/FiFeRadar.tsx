import React from "react";
import { FlatList, Pressable, View } from "react-native";
import { ActivityIndicator, Icon, IconButton, Text } from "react-native-paper";
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
          style={{ width: 72, height: 72, borderRadius: BorderRadius.full }}
        />
        <Text variant="labelMedium" numberOfLines={1} style={{ textAlign: "center", maxWidth: 88 }}>
          {data.full_name || "Nincs név"}
        </Text>
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
      <ThemedView
        type="card"
        style={{
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: Spacing.xs }}>
          <ThemedText variant="labelLarge" type="bold" style={{ color: theme.colors.secondary }}>
            FiFe Radar
          </ThemedText>
          <Icon size={18} color={theme.colors.secondary} source="wifi" />
        </View>
        <IconButton
          icon="chevron-right"
          size={22}
          style={{ margin: 0 }}
          onPress={() => router.push("/fifeRadar")}
        />
      </ThemedView>
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
          gap: Spacing.md,
          paddingHorizontal: Spacing.md,
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
