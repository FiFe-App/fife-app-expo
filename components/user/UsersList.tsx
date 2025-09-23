import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Divider, ActivityIndicator, Button } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import UserItem from "./UserItem";
import { RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  loadUsers,
  storeUserSearchParams,
} from "@/redux/reducers/usersReducer";
import { useMyLocation } from "@/hooks/useMyLocation";

interface UsersListProps {
  load: (arg0: number) => void;
  canLoadMore: boolean;
}

export const UsersList: React.FC<UsersListProps> = ({
  load,
  canLoadMore,
}) => {
  const dispatch = useDispatch();
  const { users, userSearchParams } = useSelector(
    (state: RootState) => state.users,
  );
  const { myLocation } = useMyLocation();
  const skip = userSearchParams?.skip || 0;
  const loading = userSearchParams?.loading || false;
  const take = 5;
  const loadNext = () => {
    dispatch(
      loadUsers([
        {
          id: "-1",
          avatar_url: null,
          created_at: null,
          full_name: null,
          updated_at: null,
          username: null,
          viewed_functions: null,
          website: null
        },
      ]),
    );
    dispatch(storeUserSearchParams({ skip: skip + take }));
    load(skip + take);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          gap: 8,
          marginVertical: 8,
        }}
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
              <Button onPress={loadNext} style={{ alignSelf: "center" }}>
                További fifék
              </Button>
            ) : (
              <ThemedText style={{ alignSelf: "center" }}>
                Nem található több fifék
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
