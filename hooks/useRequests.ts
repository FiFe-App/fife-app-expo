import { useCallback, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import type { RequestItem, RequestScope } from "@/lib/requests/types";
import { useMyLocation } from "./useMyLocation";

const DEFAULT_LOCATION = { lat: 47.4979, long: 19.0402 };

/**
 * A paged slice of the requests feed (the requests_feed RPC). Local state, like
 * useNearbyBuzinesses, so the home strip and the full list never share (or fight over) a page.
 *
 * `load(scope, query)` starts over; `loadMore()` continues with the same scope and query.
 */
export function useRequests(take = 10) {
  const { myLocation } = useMyLocation();
  const profileLocation = useSelector(
    (state: RootState) => state.user.userData?.location,
  );

  const [data, setData] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  // False until the first load settles, so "nothing here" can be told from "not loaded yet".
  const [fetched, setFetched] = useState(false);

  const paramsRef = useRef<{ scope: RequestScope; query: string }>({
    scope: "all",
    query: "",
  });
  const skipRef = useRef(0);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  // Bumped on every load() so a loadMore() still in flight from before a reset
  // cannot append its stale page onto the fresh list.
  const requestIdRef = useRef(0);

  const getLocation = useCallback(() => {
    if (myLocation)
      return { lat: myLocation.coords.latitude, long: myLocation.coords.longitude };
    if (profileLocation) return { lat: profileLocation.lat, long: profileLocation.lng };
    return DEFAULT_LOCATION;
  }, [myLocation, profileLocation]);

  const runPage = useCallback(
    async (skip: number) => {
      const { scope, query } = paramsRef.current;
      const { lat, long } = getLocation();
      const { data: rows, error: rpcError } = await supabase.rpc("requests_feed", {
        p_scope: scope,
        p_query: query || undefined,
        p_lat: lat,
        p_long: long,
        p_skip: skip,
        p_take: take,
      });
      if (rpcError) throw new Error("Sajnos hiba történt, próbáld meg később");
      return (rows ?? []) as RequestItem[];
    },
    [getLocation, take],
  );

  const load = useCallback(
    async (scope: RequestScope, query = "") => {
      paramsRef.current = { scope, query: query.trim() };
      const requestId = ++requestIdRef.current;
      skipRef.current = 0;
      hasMoreRef.current = true;
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const rows = await runPage(0);
        if (requestId !== requestIdRef.current) return;
        setData(rows);
        const more = rows.length === take;
        setHasMore(more);
        hasMoreRef.current = more;
        skipRef.current = rows.length;
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : "Ismeretlen hiba");
        setData([]);
        setHasMore(false);
        hasMoreRef.current = false;
      }
      if (requestId !== requestIdRef.current) return;
      loadingRef.current = false;
      setLoading(false);
      setFetched(true);
    },
    [runPage, take],
  );

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    const requestId = requestIdRef.current;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const rows = await runPage(skipRef.current);
      if (requestId !== requestIdRef.current) return;
      setData((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...rows.filter((r) => !seen.has(r.id))];
      });
      const more = rows.length === take;
      setHasMore(more);
      hasMoreRef.current = more;
      skipRef.current += rows.length;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Ismeretlen hiba");
    }
    if (requestId !== requestIdRef.current) return;
    loadingRef.current = false;
    setLoading(false);
  }, [runPage, take]);

  /** Drops one row locally, e.g. after the user deleted it. */
  const remove = useCallback((id: number) => {
    setData((prev) => prev.filter((r) => r.id !== id));
  }, []);

  /** Patches one row locally, e.g. after the user marked it solved. */
  const patch = useCallback((id: number, changes: Partial<RequestItem>) => {
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }, []);

  return { data, loading, error, hasMore, fetched, load, loadMore, remove, patch };
}
