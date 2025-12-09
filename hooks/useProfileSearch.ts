import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { storeUsers, storeUserSearchParams } from "@/redux/reducers/usersReducer";
import { supabase } from "@/lib/supabase/supabase";
import { User } from "@/redux/store.type";
import { Dimensions } from "react-native";



export function useProfileSearch() {
  const PAGE_SIZE = Math.floor(Dimensions.get("window").height/100);
  console.log("page size",PAGE_SIZE);
  
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const lastQuery = useRef<string|undefined>("");
  const dispatch = useDispatch();
  const request = useMemo(() => supabase
    .from("profiles")
    .select("*, profileRecommendations!profileRecommendations_profile_id_fkey(count), buzinesses:buziness(title)"),
  [])
    .order("created_at", { ascending: false });
    
  // Store users in Redux whenever results change
  useEffect(() => {
    if (results.length === 0) return;
    dispatch(storeUsers(results));
  }, [results, dispatch]);
  useEffect(() => {
    dispatch(storeUserSearchParams({ loading }));
  }, [dispatch, loading]);

  const search = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    pageRef.current = 0;
    lastQuery.current = query;
    setHasMore(true);
    const q = request
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
  }, [request, PAGE_SIZE]);

  const loadNext = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    setError(null);
    const nextPage = pageRef.current + 1;
    
    const q = request
      .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);
    const { data, error } = await q;
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setResults(prev => [...prev, ...(data || [])]);
    dispatch(storeUserSearchParams({ skip: nextPage * PAGE_SIZE }));
    setHasMore((data?.length || 0) === PAGE_SIZE);
    pageRef.current = nextPage;
    setLoading(false);
  }, [hasMore, loading, request, PAGE_SIZE, dispatch]);

  return { results, loading, error, hasMore, search, loadNext };
}
