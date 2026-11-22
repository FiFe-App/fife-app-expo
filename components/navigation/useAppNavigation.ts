import { Href, router, usePathname, useSegments } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { MODE_HOME, modeForPath, otherMode, type AppMode } from "@/lib/mode/appMode";

/**
 * Pre-render the other side's first screen while the app is idle, so the
 * Én/Mi switch only has to bring an already-built screen forward. Turn it off
 * if the speculative render ever costs more than it saves.
 */
const PREFETCH_OTHER_SIDE = true;
/** Safety net: a switch whose navigation never lands is undone after this. */
const SWITCH_TIMEOUT_MS = 10000;

const prefetched = new Set<string>();

/**
 * Everything the app's navigation needs to know, shared by the bottom bar
 * (phones, tablets) and the sidebar (wide screens), so the two can never
 * disagree on which side or tab is active, or on how the Én/Mi switch behaves.
 */
export function useAppNavigation() {
  const segment = useSegments();
  const pathname = usePathname();
  const unreadCounts = useSelector((state: RootState) => state.chat.unreadCounts);
  // The side the route is on. It only changes once the new screen has been
  // rendered — which, on a heavy screen, can take a while.
  const routeMode = modeForPath(pathname);
  // A switch the user just asked for, remembered together with the route it
  // was asked on. The switch and the tabs follow it at once, and the (slow)
  // navigation starts after they have painted, so the control never waits for
  // the screen it is leading to.
  const [pending, setPending] = useState<{ target: AppMode; from: string } | null>(null);
  // It only counts while the route is still the one it was asked on. The
  // moment the route moves anywhere (the switch landed, a back gesture, a deep
  // link) the route is the source of truth again — also in the very render
  // where it moved, before any effect has had a chance to clean up.
  const pendingMode = pending && pending.from === pathname ? pending.target : null;
  const mode = pendingMode ?? routeMode;
  const switching = pendingMode !== null;

  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    setPending(null);
  }, [pathname]);

  // If the navigation never lands, don't stay on a side the route isn't on.
  // Tied to the pending switch itself, so it can't outlive or cut short a
  // newer one.
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setPending(null), SWITCH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [pending]);

  // Warm up the other side while idle (see PREFETCH_OTHER_SIDE). Once per
  // side and session: after that it is already built.
  useEffect(() => {
    if (!PREFETCH_OTHER_SIDE) return;
    const href = MODE_HOME[otherMode(routeMode)];
    if (prefetched.has(href)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => {
        prefetched.add(href);
        try {
          router.prefetch?.(href);
        } catch {
          // Best effort only: a failed warm-up just means a slower first switch.
        }
      }, 1000);
    });
    return () => {
      task.cancel();
      if (timer) clearTimeout(timer);
    };
  }, [routeMode]);

  const first = segment[0] ?? "";
  // While switching, the new side's first tab (where the switch lands) already
  // shows as selected and the old route's tabs are no longer lit.
  const active = {
    me: switching ? pendingMode === "en" : pathname === "/me",
    naplo: !switching && pathname.startsWith("/user/emotion-history"),
    help: !switching && pathname.startsWith("/user/get-help"),
    settings: !switching && pathname.startsWith("/beallitasok"),
    us: switching ? pendingMode === "mi" : first.includes("home") || first.includes("fifeRadar"),
    search: !switching && (first === "search" || pathname === "/biznisz"),
    chat: !switching && (first.includes("chat") || first === "group"),
    // Én's own pages also live under /user, so only the Mi side's /user pages
    // light up the profile tab.
    profil: !switching && first.includes("user") && mode === "mi",
  };

  const lastNavTime = useRef(0);

  const navigateTo = useCallback((path: Href) => {
    const now = Date.now();
    if (now - lastNavTime.current < 300) return;
    // Skip if already on the exact same route
    if (pathname === path) return;

    lastNavTime.current = now;
    router.navigate(path);
  }, [pathname]);

  const switchMode = useCallback(() => {
    if (pendingMode) return;
    const from = pathnameRef.current;
    const target = otherMode(modeForPath(from));
    setPending({ target, from });
    // Navigate only after the switch has had a frame to paint, then a plain
    // timeout later so the render of the new screen can't hold that frame back.
    requestAnimationFrame(() =>
      setTimeout(() => {
        // The route moved on its own in the meantime: the request is stale.
        if (pathnameRef.current !== from) return;
        // Not routed through navigateTo: its 300 ms tap throttle would drop the
        // switch whenever a tab was tapped just before, leaving the control on
        // a side the route never goes to.
        lastNavTime.current = Date.now();
        try {
          router.navigate(MODE_HOME[target]);
        } catch {
          setPending(null);
        }
      }, 0),
    );
  }, [pendingMode]);

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return { mode, switching, active, navigateTo, switchMode, totalUnread };
}
