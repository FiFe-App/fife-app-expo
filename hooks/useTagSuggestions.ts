import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/supabase";

export type TagSuggestion = { name: string; usage_count: number };

/**
 * Debounced autocomplete over the shared tag dictionary (public.tags), ranked by how
 * many live usages each tag has. Mirrors hooks/useSearchSuggestions.ts, which does the
 * same job for the search bar.
 *
 * `exclude` drops tags the caller has already picked, so the list never offers something
 * TagInput would refuse as a duplicate.
 */
export function useTagSuggestions(
  prefix: string,
  enabled: boolean = true,
  exclude: string[] = [],
) {
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped per request so a slow response can't overwrite a newer one's results.
  const requestIdRef = useRef(0);

  // Compared by value: a fresh array literal from the caller on every render would
  // otherwise restart the debounce on each keystroke of an unrelated field.
  const excludeKey = exclude.join("\u0000").toLowerCase();

  useEffect(() => {
    const trimmed = prefix.trim();
    if (!enabled || !trimmed) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      const { data, error } = await supabase.rpc("search_tags", {
        p_prefix: trimmed,
        p_limit: 8,
      });
      if (requestId !== requestIdRef.current) return;
      if (error) {
        // Offline or transient: an empty list just means "no suggestions", and the user
        // can still type the tag by hand.
        setSuggestions([]);
        return;
      }
      const taken = new Set(excludeKey ? excludeKey.split("\u0000") : []);
      setSuggestions(
        ((data as unknown as TagSuggestion[]) ?? []).filter(
          (s) => !taken.has(s.name.toLowerCase()),
        ),
      );
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [prefix, enabled, excludeKey]);

  return suggestions;
}
