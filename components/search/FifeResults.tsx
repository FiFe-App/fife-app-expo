import { UsersList } from "@/components/user/UsersList";
import { useFifeSearch } from "@/hooks/useFifeSearch";
import {
  NO_PROFILE_RESULTS,
  NO_PROFILE_RESULTS_HINT,
  useProfileSearch,
} from "@/hooks/useProfileSearch";
import { RootState } from "@/redux/store";
import { useEffect } from "react";
import { useSelector } from "react-redux";

/**
 * The fifék of the search screen: the FiFe Radar (who lives around) with no query, the people
 * matching a name or @username with one. The place of the radar is the filter's.
 */
export const FifeResults = ({ q, reloadKey }: { q: string; reloadKey: number }) => {
  const searchCircle = useSelector(
    (state: RootState) => state.users.userSearchParams?.searchCircle,
  );
  const radar = useFifeSearch();
  const profiles = useProfileSearch();
  const { fetch: fetchRadar } = radar;
  const { search: searchProfiles } = profiles;
  const isSearching = q.trim().length > 0;

  // Both fetches are gated on isSearching, so the proximity query cannot run — and cannot raise
  // NO_LOCATION_ERROR — while a name search is on screen: UsersList renders an error card
  // instead of the list, which would hide results from the people without a location set.
  useEffect(() => {
    if (!isSearching) fetchRadar();
  }, [isSearching, searchCircle, reloadKey, fetchRadar]);

  useEffect(() => {
    if (isSearching) searchProfiles(q);
  }, [isSearching, q, reloadKey, searchProfiles]);

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
