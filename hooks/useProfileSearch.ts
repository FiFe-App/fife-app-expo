import { useState, useRef, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { storeUsers } from "@/redux/reducers/usersReducer";
import type { Database } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";

const PAGE_SIZE = 20;

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useProfileSearch() {
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const lastQuery = useRef<string|undefined>("");
  const dispatch = useDispatch();
  // Store users in Redux whenever results change
  useEffect(() => {
    dispatch(storeUsers(results));
  }, [results, dispatch]);

  const search = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    pageRef.current = 0;
    lastQuery.current = query;
    setHasMore(true);
    let q = supabase
      .from("profiles")
      .select("*, profileRecommendations!profileRecommendations_profile_id_fkey(count), buzinesses:buziness(title)")
      .not("full_name", "is", null)
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1);
    const { data, error } = await q;
    console.log("recommendations",data?.map(p=>p.profileRecommendations));
      
    if (error) {
      setError(error.message);
      setResults([]);
      setLoading(false);
      return;
    }
    setResults(data || []);
    setHasMore((data?.length || 0) === PAGE_SIZE);
    setLoading(false);
  }, []);

  const loadNext = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    setError(null);
    const nextPage = pageRef.current + 1;
    let q = supabase.from("profiles").select("*").order("full_name", { ascending: true }).range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);
    if (lastQuery.current) {
      q = q.ilike("full_name", `%${lastQuery.current}%`);
    }
    const { data, error } = await q;
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setResults(prev => [...prev, ...(data || [])]);
    setHasMore((data?.length || 0) === PAGE_SIZE);
    pageRef.current = nextPage;
    setLoading(false);
  }, [hasMore, loading]);

  return { results, loading, error, hasMore, search, loadNext };
}
