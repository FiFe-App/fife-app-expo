import { theme } from "@/assets/theme";
import { UsersList } from "@/components/user/UsersList";
import { Spacing } from "@/constants/spacing";
import MapSelector from "@/components/MapSelector/MapSelector";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  storeUserSearchParams
} from "@/redux/reducers/usersReducer";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { RootState } from "@/redux/store";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import style from "@/components/styles";
import {
  Icon, Modal,
  Portal
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import WhatToDo from "@/components/WhatToDo";
import { Button } from "@/components/Button";
import { useFifeSearch } from "@/hooks/useFifeSearch";
import { useProfileSearch } from "@/hooks/useProfileSearch";

export default function Index() {
  const { uid } = useSelector((state: RootState) => state.user);
  const { userSearchParams } = useSelector(
    (state: RootState) => state.users,
  );
  const searchCircle = userSearchParams?.searchCircle;
  const dispatch = useDispatch();

  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const [whatVisible, setWhatVisible] = useState(false);
  const { fetch, data, fetchNextPage, hasMore, error } = useFifeSearch();
  const { results: newestUsers, search: fetchNewest } = useProfileSearch();


  useEffect(() => {
    fetch();
  }, [searchCircle]);


  useFocusEffect(
    useCallback(() => {
      if (data.length === 0) {
        fetch();
      }
      if (newestUsers.length === 0) {
        fetchNewest();
      }
      if (uid) dispatch(viewFunction({ key: "homePage", uid }));
    }, [data.length, newestUsers.length, uid, dispatch, fetch, fetchNewest]),
  );

  return (
    <>
      {uid && (
        <ThemedView style={{ flex: 1, zIndex: 100 }} type="default">
          <ThemedView type="card" style={{ paddingHorizontal: Spacing.lg, paddingTop: 0, paddingBottom: Spacing.sm, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: Spacing.xs }}>
              <ThemedText variant="labelLarge" type="bold" style={{ color: theme.colors.secondary }}>Fife Radar</ThemedText>
              <Icon size={18} color={theme.colors.secondary} source="wifi" />
            </View>
            <Button
              icon={searchCircle ? "map-marker" : "map-marker-outline"}
              mode="text"
              labelStyle={{marginVertical: Spacing.xs}}
              onPress={() => setLocationMenuVisible(true)}
            >Hol keresel?</Button>
          </ThemedView>
          <UsersList load={fetchNextPage} canLoadMore={hasMore} data={data} error={error}/>
          <WhatToDo visible={whatVisible} onDismiss={() => setWhatVisible(false)} />
          <Portal>
            <Modal
              visible={locationMenuVisible}
              onDismiss={() => {
                setLocationMenuVisible(false);
              }}
              style={{ alignItems: "center" }}
              contentContainerStyle={[
                {
                  width: "90%",
                  height: "90%",
                },
              ]}
            >
              <ThemedView style={style.containerStyle}>
                <MapSelector
                  data={searchCircle}
                  setData={(sC) => {
                    if (
                      (sC && "location" in sC && "radius" in sC) ||
                    sC == undefined
                    ) {
                      dispatch(storeUserSearchParams({ searchCircle: sC }));
                      setLocationMenuVisible(false);
                    }
                  }}
                  searchEnabled
                  markerOnly
                  setOpen={setLocationMenuVisible}
                />
              </ThemedView>
            </Modal>
          </Portal>
        </ThemedView>
      )}
    </>
  );
}