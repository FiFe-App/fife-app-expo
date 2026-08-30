import { useCallback, useRef, useState } from "react";
import { Dimensions } from "react-native";
import { useSelector } from "react-redux";

import { buildIlikeOrFilter } from "@/lib/functions/postgrestIlikeOr";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { ProfileSearchResult } from "@/redux/store.type";

/** Shown instead of the raw PostgREST message, which is English and unhelpful. */
export const PROFILE_SEARCH_ERROR = "Nem sikerült a keresés. Próbáld újra.";

/** The search ran and matched nobody — not an error state. */
export const NO_PROFILE_RESULTS = "Nincs találat";
export const NO_PROFILE_RESULTS_HINT =
  "Próbálj rövidebb nevet, vagy keress a @felhasználónévre.";

/**
 * Exactly the columns `authenticated` may read from `profiles`
 * (migration 20260304120000) plus the two embeds `UserItem` renders. Widening
 * this list makes the whole query fail, it does not just drop a field.
 */
const SELECT =
  "id, full_name, username, avatar_url, website, created_at, updated_at, viewed_functions, " +
  "profileRecommendations!profileRecommendations_profile_id_fkey(count), " +
  "buzinesses:buziness(title)";

const SEARCH_COLUMNS = ["full_name", "username"];

export function useProfileSearch() {
  const PAGE_SIZE = Math.floor(Dimensions.get("window").height / 100);

  const myUid = useSelector((state: RootState) => state.user.uid);

  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const pageRef = useRef(0);
  /** The sanitised or-expression of the current search, replayed by loadNext. */
  const filterRef = useRef<string | null>(null);
  /** Monotonic token so a slow early keystroke cannot overwrite a later one. */
  const requestIdRef = useRef(0);
  const myUidRef = useRef(myUid);
  myUidRef.current = myUid;

  // A fresh builder per request: PostgrestFilterBuilder mutates its own URL and
  // .or()/.order() append rather than replace, so a shared instance would carry
  // every previous search's filters into the next one.
  const runPage = useCallback(
    (filter: string, page: number) => {
      let query = supabase.from("profiles").select(SELECT).or(filter);
      // nearest_profiles excludes the caller; keep the two lists consistent.
      if (myUidRef.current) query = query.neq("id", myUidRef.current);
      return query
        .order("created_at", { ascending: false })
        // created_at is nullable and ties are common, so paging needs a
        // deterministic tiebreak or rows repeat across pages.
        .order("id", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    },
    [PAGE_SIZE],
  );

  const search = useCallback(
    async (query: string) => {
      const filter = buildIlikeOrFilter(SEARCH_COLUMNS, query);
      filterRef.current = filter;
      pageRef.current = 0;
      const token = ++requestIdRef.current;

      // An empty filter would become ilike."%%", i.e. the whole table.
      if (!filter) {
        setResults([]);
        setHasMore(false);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: queryError } = await runPage(filter, 0);
      if (token !== requestIdRef.current) return;

      if (queryError) {
        console.error("profile search failed", queryError);
        setError(PROFILE_SEARCH_ERROR);
        setResults([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      setResults((data ?? []) as unknown as ProfileSearchResult[]);
      setHasMore((data?.length ?? 0) === PAGE_SIZE);
      setLoading(false);
    },
    [runPage, PAGE_SIZE],
  );

  const loadNext = useCallback(async () => {
    const filter = filterRef.current;
    if (!filter || !hasMore || loading) return;

    const nextPage = pageRef.current + 1;
    const token = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await runPage(filter, nextPage);
    if (token !== requestIdRef.current) return;

    if (queryError) {
      console.error("profile search page failed", queryError);
      setError(PROFILE_SEARCH_ERROR);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as unknown as ProfileSearchResult[];
    setResults((previous) => [...previous, ...rows]);
    setHasMore(rows.length === PAGE_SIZE);
    pageRef.current = nextPage;
    setLoading(false);
  }, [hasMore, loading, runPage, PAGE_SIZE]);

  return { results, loading, error, hasMore, search, loadNext };
}
