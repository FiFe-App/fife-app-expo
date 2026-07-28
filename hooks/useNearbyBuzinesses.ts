import { useCallback, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { BuzinessSearchItemInterface } from "@/redux/store.type";
import { useMyLocation } from "./useMyLocation";

const DEFAULT_LOCATION = { lat: 47.4979, long: 19.0402 };

/** Nearest buzinesses via hybrid_buziness_search (business-search edge function)
 * without text search. Uses local state so the biznisz page's redux-backed
 * results stay untouched. Paginates in pages of `take` so the home screen can
 * load more on scroll. */
export function useNearbyBuzinesses(take = 5) {
  const { myLocation } = useMyLocation();

  // Profile location as fallback when GPS is not available
  const profileLocation = useSelector(
    (state: RootState) => state.user.userData?.location,
  );

  const [data, setData] = useState<BuzinessSearchItemInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Refs so the scroll-driven fetchNextPage guard stays correct without
  // recreating the callback (and re-binding the scroll handler) on every
  // state change.
  const skipRef = useRef(0);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const getSearchLocation = useCallback(() => {
    if (myLocation)
      return {
        lat: myLocation.coords.latitude,
        long: myLocation.coords.longitude,
      };
    if (profileLocation)
      return { lat: profileLocation.lat, long: profileLocation.lng };
    return DEFAULT_LOCATION;
  }, [myLocation, profileLocation]);

  const runSearch = useCallback(
    async (skip: number) => {
      const { data: buzinesses, error } = await supabase.functions.invoke(
        "business-search",
        {
          body: {
            query: "",
            take,
            skip,
            ingyen: false,
            maxdistance: 100000,
            ...getSearchLocation(),
          },
        },
      );
      if (error) throw new Error(error.message);
      return (buzinesses || []) as BuzinessSearchItemInterface[];
    },
    [take, getSearchLocation],
  );

  const fetch = useCallback(async () => {
    setLoading(true);
    loadingRef.current = true;
    setError(null);
    try {
      const buzinesses = await runSearch(0);
      setData(buzinesses);
      const more = buzinesses.length === take;
      setHasMore(more);
      hasMoreRef.current = more;
      skipRef.current = take;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setData([]);
      setHasMore(false);
      hasMoreRef.current = false;
    }
    setLoading(false);
    loadingRef.current = false;
  }, [runSearch, take]);

  const fetchNextPage = useCallback(async () => {
    // Guard via refs so repeated scroll events can't fire overlapping requests
    // or page past the end.
    if (loadingRef.current || !hasMoreRef.current) return;
    setLoading(true);
    loadingRef.current = true;
    setError(null);
    try {
      const buzinesses = await runSearch(skipRef.current);
      setData((prev) => [...prev, ...buzinesses]);
      const more = buzinesses.length === take;
      setHasMore(more);
      hasMoreRef.current = more;
      skipRef.current += take;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
    setLoading(false);
    loadingRef.current = false;
  }, [runSearch, take]);

  return { data, loading, error, hasMore, fetch, fetchNextPage };
}
