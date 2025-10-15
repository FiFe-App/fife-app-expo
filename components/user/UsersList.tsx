import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Divider, ActivityIndicator } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import UserItem from "./UserItem";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";


interface UsersListProps {
  load: () => void;
  canLoadMore: boolean;
}

export const UsersList: React.FC<UsersListProps> = ({
  load,
  canLoadMore,
}) => {
  const { users, userSearchParams } = useSelector(
    (state: RootState) => state.users,
  );
  const loading = userSearchParams?.loading || false;

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          gap: 8,
          marginVertical: 8,
        }}
        onScroll={({ nativeEvent }) => {
          if (!canLoadMore || loading) return;
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 24;
          if (isBottom && canLoadMore && !loading) {
            load();
          }
        }}
        scrollEventThrottle={100}
      >
        {users.map((userItem) =>
          userItem.id === "-1" ? (
            <Divider
              key={Math.random() * 100000 + 100000 + "div"}
              style={{ marginVertical: 16 }}
            />
          ) : (
            <UserItem data={userItem} key={userItem.id} />
          ),
        )}
        <View style={{ padding: 16 }}>
          {!loading &&
            (!!users.length && canLoadMore ? (
              loading && <ActivityIndicator />
            ) : (
              <ThemedText style={{ alignSelf: "center" }}>
                Nem található több fife
              </ThemedText>
            ))}
        </View>
      </ScrollView>

      {userSearchParams?.loading && !users.length && (
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
  businessItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
