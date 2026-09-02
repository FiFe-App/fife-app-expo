import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { router } from "expo-router";
import { Spacing } from "@/constants/spacing";
import { Divider, ActivityIndicator } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import UserItem from "./UserItem";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { NearestProfile, ProfileSearchResult } from "@/redux/store.type";
import { ThemedView } from "../ThemedView";
import { Button } from "../Button";
import { NO_LOCATION_ERROR, NO_NEARBY_USERS, NO_NEARBY_USERS_HINT } from "@/hooks/useFifeSearch";

interface UsersListProps {
  load: () => void;
  data: (NearestProfile | ProfileSearchResult)[];
  error: string | null;
  canLoadMore: boolean;
  footerContent?: React.ReactNode;
  loading?: boolean;
  /** Empty-state copy, defaulting to the proximity radar's wording. */
  emptyTitle?: string;
  emptyHint?: string;
  endOfListText?: string;
}

export const UsersList: React.FC<UsersListProps> = ({
  load,
  data,
  canLoadMore,
  footerContent,
  error,
  loading: loadingProp,
  emptyTitle = NO_NEARBY_USERS,
  emptyHint = NO_NEARBY_USERS_HINT,
  endOfListText = "Nem található több fife",
}) => {
  const { userSearchParams } = useSelector(
    (state: RootState) => state.users,
  );
  const loading = loadingProp ?? userSearchParams?.loading ?? false;

  if (error) return (
        <ThemedView style={{ flex:1, justifyContent:"center", margin: 6, alignItems: "center", gap: Spacing.md, padding:Spacing.sm }}>
          <View>
            <ThemedText>{error}</ThemedText>
          </View>
          {error === NO_LOCATION_ERROR && (
            <Button mode="contained" onPress={() => router.push("/user/edit")}>
              Beállítom
            </Button>
          )}
        </ThemedView>
      );

  return (
    <View style={styles.container}>

      <FlatList
        data={data}
        keyExtractor={(item, index) => item.id === "-1" ? `divider-${index}` : item.id}
        renderItem={({ item }) =>
          item.id === "-1" ? (
            <Divider style={{ marginVertical: Spacing.lg }} />
          ) : (
            <UserItem data={item} />
          )
        }
        ListFooterComponent={
          <>
            <View style={{ padding: Spacing.lg, gap: Spacing.xs }}>
              {!!data.length && canLoadMore ? (
                <ActivityIndicator />
              ) : data.length ? (
                <ThemedText style={{ alignSelf: "center", textAlign:"center" }}>
                  {endOfListText}
                </ThemedText>
              ) : (
                // No results at all — "no more" would be misleading here.
                <>
                  <ThemedText style={{ alignSelf: "center" }}>{emptyTitle}</ThemedText>
                  <ThemedText variant="labelSmall" style={{ alignSelf: "center", textAlign: "center" }}>
                    {emptyHint}
                  </ThemedText>
                </>
              )}
            </View>
            {footerContent}
          </>
        }
        onEndReached={() => {
          if (canLoadMore && !loading && data.length > 0) {
            load();
          }
        }}
        onEndReachedThreshold={0.7}
        contentContainerStyle={{
          gap: Spacing.sm,
          marginVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
        }}
      />

      {loading && !data.length && (
        <View style={{ flex: 1 }}>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
