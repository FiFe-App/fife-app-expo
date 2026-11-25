import { useFifeSearch } from "@/hooks/useFifeSearch";
import {
  NO_PROFILE_RESULTS,
  NO_PROFILE_RESULTS_HINT,
  useProfileSearch,
} from "@/hooks/useProfileSearch";
import { RootState } from "@/redux/store";
import type { NearestProfile } from "@/redux/store.type";
import { avatarThumbnailUrls } from "@/components/search/pins";
import { Image } from "expo-image";
import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";

/** The most fifék the map asks for at once: every one of them is a pin. */
const MAP_PAGE_SIZE = 100;

interface Options {
  /** Only the open tab loads anything. */
  enabled: boolean;
  q: string;
  reloadKey: number;
  view: "list" | "map";
}

/**
 * The fifék of the search screen: the FiFe Radar (who lives around) with no query, the people
 * matching a name or @username with one. Their place is the filter's. The hook lives in the
 * search screen, not in the tab, so the map can stay one and the same while the tabs change.
 */
export function useFifeResults({ enabled, q, reloadKey, view }: Options) {
  const searchCircle = useSelector(
    (state: RootState) => state.users.userSearchParams?.searchCircle,
  );
  const radar = useFifeSearch(view === "map" ? MAP_PAGE_SIZE : undefined);
  const profiles = useProfileSearch();
  const { fetch: fetchRadar } = radar;
  const { search: searchProfiles } = profiles;
  const isSearching = q.trim().length > 0;

  // Both fetches are gated on isSearching, so the proximity query cannot run — and cannot raise
  // NO_LOCATION_ERROR — while a name search is on screen: the list renders an error card
  // instead of its rows, which would hide results from the people without a location set.
  useEffect(() => {
    if (enabled && !isSearching) fetchRadar();
  }, [enabled, isSearching, searchCircle, reloadKey, fetchRadar]);

  useEffect(() => {
    if (enabled && isSearching) searchProfiles(q);
  }, [enabled, isSearching, q, reloadKey, searchProfiles]);

  // The pins are the radar's fifék with a place. (A name search finds people whose place is not
  // public, so it has nothing to pin.)
  const pinned = useMemo<NearestProfile[]>(
    () =>
      isSearching
        ? []
        : radar.data.filter((p) => p.id !== "-1" && p.lat != null && p.long != null),
    [isSearching, radar.data],
  );

  // Have every thumbnail in the cache before the pins ask for them: the map then draws the
  // pictures at once instead of one network wait per pin.
  useEffect(() => {
    if (enabled && view === "map" && pinned.length > 0) {
      Image.prefetch(avatarThumbnailUrls(pinned), "memory-disk").catch(() => {});
    }
  }, [enabled, view, pinned]);

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

  return { isSearching, pinned, list, loading: list.loading };
}
