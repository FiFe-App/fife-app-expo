import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { setLastRoute } from "@/redux/reducers/appReducer";
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
 */
const NOT_WORTH_RETURNING_TO = [
  /^\/$/,
  /^\/login(\/|$)/,
  /^\/csatlakozom(\/|$)/,
  /^\/user\/password-reset(\/|$)/,
  /^\/user\/deleted-account(\/|$)/,
  /^\/meghivo(\/|$)/,
  /^\/leiratkozas(\/|$)/,
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
    restored.current = true;

    if (!uid || launchedAt !== "/") return;
    if (!restoreTarget?.path || !isFreshEnough(restoreTarget.at)) return;
    if (!isRestorablePath(restoreTarget.path)) return;
    if (restoreTarget.path === pathname) return;

    router.replace(restoreTarget.path as `/${string}`);
    // Deliberately keyed on nothing that changes: this runs once per app start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // Record. Cheap enough to write on every screen change — it is one small
  // object, and redux-persist batches the write.
  useEffect(() => {
    if (Platform.OS === "web" || !uid) return;
    if (!isRestorablePath(pathname)) return;
    dispatch(setLastRoute({ path: pathname, at: new Date().toISOString() }));
  }, [pathname, uid, dispatch]);
}
