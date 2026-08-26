import { supabase } from "@/lib/supabase/supabase";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { BuzinessSearchItemInterface } from "@/redux/store.type";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

/**
 * Fetches the businesses authored by `uid`, refetching on every focus so
 * creating/editing a biznisz and navigating back shows up without a manual
 * refresh. Shared by UserPage.tsx (any profile) and the edit screen's own
 * "Bizniszeim" tab (always the signed-in user).
 */
export function useMyBuzinesses(uid: string | undefined) {
  const [buzinesses, setBuzinesses] = useState<BuzinessSearchItemInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      setLoading(true);
      supabase
        .from("buziness")
        .select("*, profiles ( full_name ), buzinessRecommendations ( count )")
        .eq("author", uid)
        .order("created_at", { ascending: false })
        .then((res) => {
          if (res.data) {
            setBuzinesses(
              res.data.map((b) => ({
                ...b,
                authorName: b.profiles?.full_name || "???",
                recommendations: b.buzinessRecommendations[0].count,
              })),
            );
            setLoading(false);
          }
          dispatch(viewFunction({ key: "buzinessProfile", uid }));
        });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid]),
  );

  return { buzinesses, loading };
}
