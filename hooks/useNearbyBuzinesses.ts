import { useCallback, useEffect, useRef, useState } from "react";
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

  // The user's interest tags. The server ORs them together and sorts the matching
  // listings to the front, so this is what makes the opening list personal.
  const interests = useSelector((state: RootState) => state.user.interests);

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
  // Bumped on every fetch() so a fetchNextPage() still in flight from before
  // a reset can't append its (now stale) page onto the freshly reset list.
  const requestIdRef = useRef(0);

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
            interests: interests ?? [],
            ...getSearchLocation(),
          },
        },
      );
      if (error) throw new Error(error.message);
      return (buzinesses || []) as BuzinessSearchItemInterface[];
    },
    [take, getSearchLocation, interests],
  );

  const fetch = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    loadingRef.current = true;
    setError(null);
    try {
      const buzinesses = await runSearch(0);
      if (requestId !== requestIdRef.current) return;
      setData(buzinesses);
      const more = buzinesses.length === take;
      setHasMore(more);
      hasMoreRef.current = more;
      skipRef.current = take;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Unknown error");
      setData([]);
      setHasMore(false);
      hasMoreRef.current = false;
    }
    if (requestId !== requestIdRef.current) return;
    setLoading(false);
    loadingRef.current = false;
  }, [runSearch, take]);

  const fetchNextPage = useCallback(async () => {
    // Guard via refs so repeated scroll events can't fire overlapping requests
    // or page past the end.
    if (loadingRef.current || !hasMoreRef.current) return;
    const requestId = requestIdRef.current;
    setLoading(true);
    loadingRef.current = true;
    setError(null);
    try {
      const buzinesses = await runSearch(skipRef.current);
      // A fresh fetch() may have reset the list while this page was in
      // flight; discard this stale page instead of appending onto the reset data.
      if (requestId !== requestIdRef.current) return;
      setData((prev) => {
        const seen = new Set(prev.map((b) => b.id));
        const deduped = buzinesses.filter((b) => !seen.has(b.id));
        return [...prev, ...deduped];
      });
      const more = buzinesses.length === take;
      setHasMore(more);
      hasMoreRef.current = more;
      skipRef.current += take;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Unknown error");
    }
    if (requestId !== requestIdRef.current) return;
    setLoading(false);
    loadingRef.current = false;
  }, [runSearch, take]);

  // Editing the interests has to reorder the feed. The home screen's focus effect only
  // fetches when the list is empty, so without this the user would save a new interest
  // and come back to the same stale order. fetch() bumps requestIdRef, which discards any
  // page still in flight from the previous interest set.
  const interestsKey = (interests ?? []).join("\u0000");
  const lastInterestsKeyRef = useRef<string | null>(null);
  useEffect(() => {
    // Skip the first run: the screen's own focus effect already fetches the first page,
    // and firing here too would spend a second request on the same result.
    if (lastInterestsKeyRef.current === null) {
      lastInterestsKeyRef.current = interestsKey;
      return;
    }
    if (lastInterestsKeyRef.current === interestsKey) return;
    lastInterestsKeyRef.current = interestsKey;
    skipRef.current = 0;
    hasMoreRef.current = true;
    fetch();
  }, [interestsKey, fetch]);

  return { data, loading, error, hasMore, fetch, fetchNextPage };
}
