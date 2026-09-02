import React from "react";
import { FlatList, Pressable, View } from "react-native";
import { ActivityIndicator, Icon } from "react-native-paper";
import { Link, router } from "expo-router";
import { NearestProfile } from "@/redux/store.type";
import ProfileImage from "../ProfileImage";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";
import { NO_LOCATION_ERROR, NO_NEARBY_USERS, NO_NEARBY_USERS_HINT } from "@/hooks/useFifeSearch";
import { Button } from "../Button";
import { useDispatch } from "react-redux";
import { storeUserSearchParams } from "@/redux/reducers/usersReducer";

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
        <ThemedText variant="labelSmall" type="bold" numberOfLines={1} style={{ textAlign: "center", maxWidth: 88, fontFamily:"Piazzolla-Regular" }}>
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
  const theme = useAppTheme();
  const dispatch = useDispatch();

  return (
    <View>
      <Pressable
        onPress={() => {
          // This strip shows nearby fifék, so open the proximity list rather
          // than whatever name search was last run.
          dispatch(storeUserSearchParams({ text: "" }));
          router.push("/fifeRadar");
        }}
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
          <ThemedText variant="labelMedium" type="bold" style={{ color: theme.colors.primary }}>
            Muti többet
          </ThemedText>
          <Icon size={18} color={theme.colors.primary} source="chevron-right" />
        </View>
      </Pressable>
      {!!error && (
        <ThemedView style={{ flex:1, margin: 6, alignItems: "center", gap: Spacing.sm, padding:Spacing.sm }}>
          <View style={{flex:1,flexShrink:1}}>
            <ThemedText type="label">{error}</ThemedText>
          </View>
          {error === NO_LOCATION_ERROR && (
            <Button mode="contained" onPress={() => router.push("/user/edit")}>
              Beállítom
            </Button>
          )}
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
          // An empty horizontal list is "at the end" on mount, which would
          // request page 2 before page 1 has even arrived.
          if (canLoadMore && !loading && users.length > 0) load?.();
        }}
        onEndReachedThreshold={0.7}
        ListFooterComponent={
          canLoadMore && !!users.length ? (
            <ActivityIndicator style={{ marginHorizontal: Spacing.md }} />
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ padding: Spacing.lg }} />
          ) : error ? null : (
            // Search ran and found nobody — say so instead of rendering a
            // blank strip that looks like a failed load.
            <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.xs }}>
              <ThemedText type="label">{NO_NEARBY_USERS}</ThemedText>
              <ThemedText variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {NO_NEARBY_USERS_HINT}
              </ThemedText>
            </View>
          )
        }
      />
    </View>
  );
};
