import { useRequests } from "@/hooks/useRequests";
import type { RequestScope } from "@/lib/requests/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** The most requests the map asks for at once: every one of them is a pin. */
const MAP_PAGE_SIZE = 100;

interface Options {
  /** Only the open tab loads anything. */
  enabled: boolean;
  q: string;
  scope: RequestScope;
  reloadKey: number;
  view: "list" | "map";
}

/**
 * The kérések of the search screen: the slice the filter picked, narrowed by the query. The
 * hook lives in the search screen, not in the tab, so the map can stay one and the same while
 * the tabs change.
 */
export function useRequestResults({ enabled, q, scope, reloadKey, view }: Options) {
  const requests = useRequests(view === "map" ? MAP_PAGE_SIZE : 10);
  const { load } = requests;
  // "Search around here" on the map: the place the kérések are looked up around, in place of the
  // user's own. Back on the list the user's own place counts again.
  const [center, setCenter] = useState<{ lat: number; long: number } | undefined>(undefined);
  const activeCenter = view === "map" ? center : undefined;

  useEffect(() => {
    if (enabled) load(scope, q, activeCenter);
  }, [enabled, scope, q, reloadKey, load, activeCenter]);

  // A request made, solved or deleted elsewhere must show up when the user comes back; the
  // first focus is covered by the effect above.
  const paramsRef = useRef({ scope, q, center: activeCenter, enabled });
  useEffect(() => {
    paramsRef.current = { scope, q, center: activeCenter, enabled };
  }, [scope, q, activeCenter, enabled]);
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      const { scope: s, q: query, center: c, enabled: on } = paramsRef.current;
      if (on) load(s, query, c);
    }, [load]),
  );

  // The pins are the requests with a place ("Bárhol" has none).
  const pinned = useMemo(
    () => requests.data.filter((r) => r.lat != null && r.long != null),
    [requests.data],
  );

  return { ...requests, pinned, activeCenter, setCenter };
}
