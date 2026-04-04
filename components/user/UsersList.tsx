import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Divider, ActivityIndicator } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import UserItem from "./UserItem";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { NearestProfile, User } from "@/redux/store.type";

interface UsersListProps {
  load: () => void;
  data: NearestProfile[];
  canLoadMore: boolean;
  footerContent?: React.ReactNode;
}

export const UsersList: React.FC<UsersListProps> = ({
  load,
  data,
  canLoadMore,
  footerContent,
}) => {
  const { userSearchParams } = useSelector(
    (state: RootState) => state.users,
  );
  const loading = userSearchParams?.loading || false;

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item, index) => item.id === "-1" ? `divider-${index}` : item.id}
        renderItem={({ item }) =>
          item.id === "-1" ? (
            <Divider style={{ marginVertical: 16 }} />
          ) : (
            <UserItem data={item} />
          )
        }
        ListFooterComponent={
          <>
            <View style={{ padding: 16 }}>
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
          gap: 8,
          marginVertical: 8,
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
  businessItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
