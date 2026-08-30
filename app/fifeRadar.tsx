import { theme } from "@/assets/theme";
import { UsersList } from "@/components/user/UsersList";
import { Spacing } from "@/constants/spacing";
import MapSelector from "@/components/MapSelector/MapSelector";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  storeUserSearchParams
} from "@/redux/reducers/usersReducer";
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
import { Button } from "@/components/Button";
import { useFifeSearch } from "@/hooks/useFifeSearch";
import {
  NO_PROFILE_RESULTS,
  NO_PROFILE_RESULTS_HINT,
  useProfileSearch,
} from "@/hooks/useProfileSearch";

export default function FifeRadarScreen() {
  const { uid } = useSelector((state: RootState) => state.user);
  const searchCircle = useSelector(
    (state: RootState) => state.users.userSearchParams?.searchCircle,
  );
  const searchText = useSelector(
    (state: RootState) => state.users.userSearchParams?.text ?? "",
  );
  const isSearching = searchText.trim().length > 0;
  const dispatch = useDispatch();

  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const fife = useFifeSearch();
  const profile = useProfileSearch();
  const { fetch: fetchNearby, data: nearbyData } = fife;

  // Both fetch paths are gated on isSearching so the proximity query cannot run
  // — and, more importantly, cannot raise NO_LOCATION_ERROR — while a name
  // search is on screen. UsersList renders an error card instead of the list, so
  // an ungated fetch would hide results from exactly the people without a
  // location set, who are the ones most likely to search by name.
  useEffect(() => {
    if (!isSearching) fetchNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearching, searchCircle]);

  useEffect(() => {
    if (isSearching) profile.search(searchText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearching, searchText]);

  useFocusEffect(
    useCallback(() => {
      if (isSearching || nearbyData.length > 0) return;
      fetchNearby();
    }, [isSearching, nearbyData.length, fetchNearby]),
  );

  const list = isSearching
    ? {
      data: profile.results,
      error: profile.error,
      loading: profile.loading,
      canLoadMore: profile.hasMore,
      load: profile.loadNext,
      emptyTitle: NO_PROFILE_RESULTS,
      emptyHint: NO_PROFILE_RESULTS_HINT,
      endOfListText: "Nem található több profil",
    }
    : {
      data: fife.data,
      error: fife.error,
      loading: fife.loading,
      canLoadMore: fife.hasMore,
      load: fife.fetchNextPage,
    };

  return (
    <>
      {uid && (
        <ThemedView style={{ flex: 1, zIndex: 100 }} type="default">
          <ThemedView type="card" style={{ paddingHorizontal: Spacing.lg, paddingTop: 0, paddingBottom: Spacing.sm, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", gap: Spacing.xs }}>
              <ThemedText variant="labelLarge" type="bold" numberOfLines={1} style={{ color: theme.colors.secondary, flexShrink: 1 }}>
                {isSearching ? `Találatok: ${searchText}` : "FiFe Radar"}
              </ThemedText>
              {!isSearching && <Icon size={18} color={theme.colors.secondary} source="wifi" />}
            </View>
            {isSearching ? (
              <Button
                icon="close"
                mode="text"
                labelStyle={{ marginVertical: Spacing.xs }}
                // Not clearUserSearchParams: that resets the slice to {} and
                // would drop searchCircle along with the query.
                onPress={() => dispatch(storeUserSearchParams({ text: "" }))}
              >Törlés</Button>
            ) : (
              <Button
                icon={searchCircle ? "map-marker" : "map-marker-outline"}
                mode="text"
                labelStyle={{marginVertical: Spacing.xs}}
                onPress={() => setLocationMenuVisible(true)}
              >Hol keresel?</Button>
            )}
          </ThemedView>
          <UsersList {...list} />
          <Portal>
            <Modal
              visible={locationMenuVisible}
              onDismiss={() => {
                setLocationMenuVisible(false);
              }}
              style={{ alignItems: "center" }}
              contentContainerStyle={[
                {
                  width: "100%",
                  height: "100%",
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
