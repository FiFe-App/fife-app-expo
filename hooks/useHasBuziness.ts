import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

/**
 * Whether the signed-in user has published any biznisz.
 *
 * Uses a head-only count so nothing but the number crosses the wire — the
 * caller only needs "any or none". `loading` stays true until the answer is
 * known, so callers can avoid flashing UI that depends on it.
 */
export function useHasBuziness() {
  const uid = useSelector((state: RootState) => state.user.uid);
  const [hasBuziness, setHasBuziness] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setHasBuziness(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("buziness")
      .select("id", { count: "exact", head: true })
      .eq("author", uid)
      .then(({ count, error }) => {
        if (cancelled) return;
        // On error, claim they have one: better to hide an encouragement card
        // than to tell someone with a dozen bizniszek to upload their first.
        setHasBuziness(error ? true : (count ?? 0) > 0);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { hasBuziness, loading };
}
