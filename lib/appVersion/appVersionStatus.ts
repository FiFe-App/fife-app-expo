import Constants from "expo-constants";
import { Linking, Platform } from "react-native";
import { openBrowserAsync } from "expo-web-browser";

import { supabase } from "@/lib/supabase/supabase";

export type AppPlatform = "android" | "ios" | "web";

/**
 * `ok`               — nothing to do.
 * `update_available` — a newer release exists; the user is nudged, once.
 * `blocked`          — this build is below `min_version` and must not run.
 */
export type VersionGateStatus = "ok" | "update_available" | "blocked";

export interface AppVersionStatus {
  status: VersionGateStatus;
  minVersion: string;
  latestVersion: string;
  updateUrl: string | null;
  message: string | null;
}

export const getAppPlatform = (): AppPlatform =>
  Platform.OS === "android" ? "android" : Platform.OS === "ios" ? "ios" : "web";

/**
 * The version this build reports, straight from `app.config.js`. On native
 * that is the version baked into the binary (or into the OTA bundle that
 * replaced it), which is exactly what we want to gate on.
 *
 * `null` when the config isn't there to read (an odd runtime, a test): the
 * gate then does nothing at all, rather than treating an unknown version as
 * version zero and locking the user out of a working app.
 */
export const getCurrentAppVersion = (): string | null =>
  Constants.expoConfig?.version ?? null;

/**
 * Asks the server what to do with this version. Returns `null` when the
 * answer is unknown — no network, no row for the platform, an error — and
 * every caller treats that as "carry on". A version gate that locks people
 * out whenever Supabase hiccups is worse than one that misses a beat.
 */
export const fetchAppVersionStatus = async (
  version: string | null = getCurrentAppVersion(),
  platform: AppPlatform = getAppPlatform(),
): Promise<AppVersionStatus | null> => {
  if (!version) return null;

  const { data, error } = await supabase.rpc("get_app_version_status", {
    p_platform: platform,
    p_version: version,
  });

  if (error) {
    console.warn("Version check failed", error.message);
    return null;
  }

  const row = data?.[0];
  if (!row) return null;

  return {
    status: (row.status ?? "ok") as VersionGateStatus,
    minVersion: row.min_version,
    latestVersion: row.latest_version,
    updateUrl: row.update_url ?? null,
    message: row.message ?? null,
  };
};

/**
 * Reload the web build from the network. The deploy is cached by a service
 * worker (see workbox-config.js), so a plain reload can hand back the very
 * bundle we are trying to replace.
 */
const reloadWebApp = async () => {
  if (typeof window === "undefined") return;
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn("Could not clear the cached web build", error);
  }
  window.location.reload();
};

/**
 * Sends the user wherever the update lives: the store listing on native, a
 * fresh copy of the bundle on web.
 */
export const openUpdate = async (status: AppVersionStatus | null) => {
  if (Platform.OS === "web") {
    await reloadWebApp();
    return;
  }

  const url = status?.updateUrl;
  if (!url) return;

  try {
    await openBrowserAsync(url);
  } catch {
    await Linking.openURL(url);
  }
};

/** Whether {@link openUpdate} has somewhere to go. */
export const canOpenUpdate = (status: AppVersionStatus | null): boolean =>
  Platform.OS === "web" || !!status?.updateUrl;
