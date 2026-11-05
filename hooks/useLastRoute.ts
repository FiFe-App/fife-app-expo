import { usePathname, useRootNavigationState, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { InteractionManager, Platform } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { clearLastRoute, setLastRoute } from "@/redux/reducers/appReducer";
import { RootState } from "@/redux/store";

/**
 * Putting the user back where they were after the app was killed.
 *
 * Android reclaims a backgrounded app whenever it needs the memory, and the
 * next tap is a cold start, not a resume: the splash, and then the beginning
 * of the app. Nothing can stop the kill — what this does is make it
 * uninteresting, by remembering the screen they were on and going straight
 * back to it.
 *
 * Native only. On the web the address bar is the truth: whoever opens
 * fifeapp.hu asked for the front page, and a link they followed must not be
 * overridden by where they happened to be last week.
 */

/** After this long, a cold start is a new visit rather than an interrupted one. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Screens that are a step in something rather than a place: sending somebody
 * back into the middle of signing in or registering would strand them.
 *
 * The biznisz editor is on the list for a different reason. It is the heaviest
 * screen in the app — a map, the media picker, the contact editor — and making
 * it the first thing a cold start mounts is asking for trouble on a phone that
 * has just run out of memory. Nothing is lost by leaving it out: what the user
 * typed is kept by hooks/useBuzinessDraft.ts and is waiting when they open it
 * again.
 */
const NOT_WORTH_RETURNING_TO = [
  /^\/$/,
  /^\/login(\/|$)/,
  /^\/csatlakozom(\/|$)/,
  /^\/user\/password-reset(\/|$)/,
  /^\/user\/deleted-account(\/|$)/,
  /^\/meghivo(\/|$)/,
  /^\/leiratkozas(\/|$)/,
  /^\/biznisz\/new(\/|$)/,
  /^\/biznisz\/edit(\/|$)/,
];

export const isRestorablePath = (path: string): boolean =>
  path.startsWith("/") && !NOT_WORTH_RETURNING_TO.some((p) => p.test(path));

export const isFreshEnough = (at: string, now = Date.now()): boolean => {
  const saved = new Date(at).getTime();
  return Number.isFinite(saved) && now - saved < MAX_AGE_MS && saved <= now;
};

export function useLastRoute() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const uid = useSelector((state: RootState) => state.user.uid);
  const lastRoute = useSelector((state: RootState) => state.app.lastRoute);
  // Navigating before the router has mounted throws, and an exception thrown
  // from this effect takes the whole app down without a message — which on a
  // phone looks like the app closing by itself on launch.
  const navigationState = useRootNavigationState();
  const routerReady = !!navigationState?.key;

  // Read once, at the first render of the app: the moment the user goes
  // anywhere, this is overwritten by the recorder below.
  const [restoreTarget] = useState(() => lastRoute);
  const [launchedAt] = useState(() => pathname);
  const restored = useRef(false);

  // Restore — only on a start that landed on the app's own entry point. A deep
  // link, a notification or a shared biznisz opens somewhere specific, and
  // that is where the user wants to be.
  useEffect(() => {
    if (Platform.OS === "web" || restored.current) return;
    if (!routerReady || !uid) return;
    restored.current = true;

    const target = restoreTarget;
    if (!target?.path || !isFreshEnough(target.at)) return;
    if (launchedAt !== "/") return;
    if (!isRestorablePath(target.path) || target.path === pathname) return;

    // Forgotten before it is used: if the screen being restored cannot survive
    // being the first thing a cold start mounts, the next start has to land on
    // the home screen rather than try the same thing again. A restore that
    // works records the same path again a moment later, below.
    dispatch(clearLastRoute());

    // After the launch work rather than in the middle of it, so the restored
    // screen mounts onto an app that is already up.
    const task = InteractionManager.runAfterInteractions(() => {
      try {
        router.replace(target.path as `/${string}`);
      } catch (error) {
        // Never fatal. Being in the wrong place is a nuisance; taking the app
        // down on launch is not.
        console.warn("Could not restore the last screen:", error);
      }
    });
    return () => task.cancel();
    // Deliberately narrow: this runs once, as soon as there is both a router
    // and a user to restore for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerReady, uid]);

  // Record. Cheap enough to write on every screen change — it is one small
  // object, and redux-persist batches the write.
  useEffect(() => {
    if (Platform.OS === "web" || !uid) return;
    if (!isRestorablePath(pathname)) return;
    dispatch(setLastRoute({ path: pathname, at: new Date().toISOString() }));
  }, [pathname, uid, dispatch]);
}
