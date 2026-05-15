import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Spacing } from "@/constants/spacing";
import { Divider, ActivityIndicator } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import UserItem from "./UserItem";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { NearestProfile, User } from "@/redux/store.type";
import { ThemedView } from "../ThemedView";

interface UsersListProps {
  load: () => void;
  data: NearestProfile[];
  error: string | null;
  canLoadMore: boolean;
  footerContent?: React.ReactNode;
}

export const UsersList: React.FC<UsersListProps> = ({
  load,
  data,
  canLoadMore,
  footerContent,
  error,
}) => {
  const { userSearchParams } = useSelector(
    (state: RootState) => state.users,
  );
  const loading = userSearchParams?.loading || false;

  return (
    <View style={styles.container}>
      {!!error && <ThemedView style={{margin:6}} type="error">
      <ThemedText type="error">{error}</ThemedText> 
      </ThemedView>}
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
            <View style={{ padding: Spacing.lg }}>
              {(!!data.length && canLoadMore ? (
                <ActivityIndicator />
              ) : (
                <ThemedText style={{ alignSelf: "center" }}>
                  Nem található több fife
                </ThemedText>
              ))}
            </View>
            {footerContent}
          </>
        }
        onEndReached={() => {
          if (canLoadMore && !loading) {
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

      {userSearchParams?.loading && !data.length && (
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
