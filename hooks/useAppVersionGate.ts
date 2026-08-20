import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import {
  AppVersionStatus,
  fetchAppVersionStatus,
  getCurrentAppVersion,
} from "@/lib/appVersion/appVersionStatus";

const DISMISSED_UPDATE_KEY = "appVersionGate.dismissedUpdate";

/** Don't re-ask the server on every foreground while the user tabs around. */
const RECHECK_AFTER_MS = 5 * 60 * 1000;

export interface AppVersionGate {
  /** This build is below `min_version`: nothing but the update screen. */
  blocked: boolean;
  /** A newer release exists and the user hasn't waved it away yet. */
  updateAvailable: boolean;
  status: AppVersionStatus | null;
  currentVersion: string | null;
  checking: boolean;
  /** Re-ask the server, ignoring the throttle. */
  recheck: () => Promise<void>;
  /** Hide the soft prompt until the next release. */
  dismissUpdate: () => void;
}

/**
 * Asks the server whether this build may still run, on startup and whenever
 * the app comes back to the foreground — a session can be open for days, so
 * startup alone would let a blocked build keep going indefinitely.
 *
 * Every failure path leaves the gate open. The check is a courtesy to the
 * user, not a security boundary: the real enforcement of what an old client
 * may do lives in RLS and the edge functions.
 */
export const useAppVersionGate = (): AppVersionGate => {
  const [status, setStatus] = useState<AppVersionStatus | null>(null);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const lastCheckedAt = useRef(0);
  const mounted = useRef(true);

  const currentVersion = getCurrentAppVersion();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_UPDATE_KEY)
      .then((value) => {
        if (mounted.current) setDismissedVersion(value);
      })
      .catch(() => {});
  }, []);

  const check = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastCheckedAt.current < RECHECK_AFTER_MS) return;
    lastCheckedAt.current = now;

    setChecking(true);
    const result = await fetchAppVersionStatus();
    if (!mounted.current) return;
    // A failed check keeps whatever we knew before rather than clearing it:
    // going offline must not lift a block the user is already looking at.
    if (result) setStatus(result);
    setChecking(false);
  }, []);

  useEffect(() => {
    check(true);
  }, [check]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => subscription.remove();
  }, [check]);

  const dismissUpdate = useCallback(() => {
    const version = status?.latestVersion;
    if (!version) return;
    setDismissedVersion(version);
    AsyncStorage.setItem(DISMISSED_UPDATE_KEY, version).catch(() => {});
  }, [status?.latestVersion]);

  return {
    blocked: status?.status === "blocked",
    updateAvailable:
      status?.status === "update_available" &&
      dismissedVersion !== status.latestVersion,
    status,
    currentVersion,
    checking,
    recheck: () => check(true),
    dismissUpdate,
  };
};
