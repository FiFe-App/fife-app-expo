import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/supabase";

export type SearchSuggestion = { query_text: string; hit_count: number };

export function useSearchSuggestions(prefix: string, enabled: boolean = true) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {     
      const { data } = await supabase.rpc("get_popular_search_queries", {
        p_prefix: prefix.trim(),
        p_limit: 6,
      });
      setSuggestions((data as unknown as SearchSuggestion[]) ?? []);
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [prefix, enabled]);

  return suggestions;
}
