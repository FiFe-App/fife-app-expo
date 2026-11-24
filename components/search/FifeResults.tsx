import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import UserItem from "@/components/user/UserItem";
import { UsersList } from "@/components/user/UsersList";
import { useFifeSearch } from "@/hooks/useFifeSearch";
import {
  NO_PROFILE_RESULTS,
  NO_PROFILE_RESULTS_HINT,
  useProfileSearch,
} from "@/hooks/useProfileSearch";
import { storeUserSearchParams } from "@/redux/reducers/usersReducer";
import { RootState } from "@/redux/store";
import { NearestProfile } from "@/redux/store.type";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Marker } from "../mapView/mapView";
import ProfileImage from "../ProfileImage";
import { ThemedText } from "../ThemedText";
import ResultsMap from "./ResultsMap";
import ViewSwitch from "./ViewSwitch";

const PIN = 44;
/** The most fifék the map asks for at once. */
const MAP_PAGE_SIZE = 100;

/** A pin of the map: the profile picture of the fife, ringed when picked. */
const FifePin = ({ profile, selected }: { profile: NearestProfile; selected: boolean }) => {
  const theme = useAppTheme();
  return (
    <View
      style={{
        width: PIN,
        height: PIN,
        borderRadius: BorderRadius.full,
        borderWidth: selected ? 4 : 2,
        borderColor: selected ? theme.colors.primary : theme.colors.background,
        overflow: "hidden",
        backgroundColor: theme.colors.surfaceVariant,
        transform: [{ scale: selected ? 1.2 : 1 }],
      }}
    >
      <ProfileImage
        uid={profile.id}
        avatar_url={profile.avatar_url}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
};

/**
 * The fifék of the search screen: the FiFe Radar (who lives around) with no query, the people
 * matching a name or @username with one. The place of the radar is the filter's. In the map view
 * the radar's fifék are pins with their profile pictures, and the one picked is a card at the
 * bottom of the map, as with the bizniszek; there is no list.
 */
export const FifeResults = ({
  q,
  reloadKey,
  view,
}: {
  q: string;
  reloadKey: number;
  view: "list" | "map";
}) => {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const searchCircle = useSelector(
    (state: RootState) => state.users.userSearchParams?.searchCircle,
  );
  // Every fife on the map is a pin, so it asks for more of them than a list page holds.
  const radar = useFifeSearch(view === "map" ? MAP_PAGE_SIZE : undefined);
  const profiles = useProfileSearch();
  const { fetch: fetchRadar } = radar;
  const { search: searchProfiles } = profiles;
  const isSearching = q.trim().length > 0;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Both fetches are gated on isSearching, so the proximity query cannot run — and cannot raise
  // NO_LOCATION_ERROR — while a name search is on screen: UsersList renders an error card
  // instead of the list, which would hide results from the people without a location set.
  useEffect(() => {
    if (!isSearching) fetchRadar();
  }, [isSearching, searchCircle, reloadKey, fetchRadar]);

  useEffect(() => {
    if (isSearching) searchProfiles(q);
  }, [isSearching, q, reloadKey, searchProfiles]);

  // The pins are the radar's fifék with a place. (A name search finds people whose place is not
  // public, so it has nothing to pin.)
  const pinned = useMemo(
    () =>
      isSearching
        ? []
        : radar.data.filter((p) => p.id !== "-1" && p.lat != null && p.long != null),
    [isSearching, radar.data],
  );
  const selected = pinned.find((p) => p.id === selectedId) ?? null;

  if (view === "map") {
    return (
      <View style={{ flex: 1 }}>
        <ResultsMap
          onBackgroundPress={() => setSelectedId(null)}
          viewSwitch={<ViewSwitch inMap />}
          card={selected ? <UserItem data={selected} /> : undefined}
          onSearchHere={({ latitude, longitude }) => {
            setSelectedId(null);
            dispatch(
              storeUserSearchParams({
                searchCircle: { location: { latitude, longitude }, radius: 1000 },
              }),
            );
          }}
          searchHereLoading={radar.loading}
        >
          {pinned.map((profile) => (
            <Marker
              key={profile.id}
              coordinate={{ latitude: profile.lat, longitude: profile.long }}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={profile.id === selectedId ? 10 : 1}
              onPress={() => setSelectedId(profile.id)}
            >
              <FifePin profile={profile} selected={profile.id === selectedId} />
            </Marker>
          ))}
        </ResultsMap>
        {isSearching && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: Spacing.md,
              right: 72,
              top: Spacing.sm,
              padding: Spacing.sm,
              borderRadius: BorderRadius.md,
              backgroundColor: theme.colors.surface,
            }}
          >
            <ThemedText variant="labelMedium" style={{ textAlign: "center" }}>
              A névkeresés találatai nem jelennek meg a térképen.
            </ThemedText>
          </View>
        )}
      </View>
    );
  }

  const list = isSearching
    ? {
        data: profiles.results,
        error: profiles.error,
        loading: profiles.loading,
        canLoadMore: profiles.hasMore,
        load: profiles.loadNext,
        emptyTitle: NO_PROFILE_RESULTS,
        emptyHint: NO_PROFILE_RESULTS_HINT,
        endOfListText: "Nem található több fife\n\nKis és nagybetű, illetve ékezetek számítanak!",
      }
    : {
        data: radar.data,
        error: radar.error,
        loading: radar.loading,
        canLoadMore: radar.hasMore,
        load: radar.fetchNextPage,
      };

  return <UsersList {...list} />;
};

export default FifeResults;
