import Aptabase, { trackEvent as aptabaseTrackEvent } from "@aptabase/react-native";
import Constants from "expo-constants";

/**
 * Anonymous usage analytics (Aptabase). Nothing here may identify a person:
 * no uid, no e-mail, no ids of users/buzinesses/chats, no free text the user
 * typed (search queries, messages, notes) and nothing from the emotion log
 * beyond the fact that an entry was saved. Send event names and coarse,
 * enum-like properties only.
 *
 * Every call is a no-op when EXPO_PUBLIC_APTABASE_KEY isn't set, so dev
 * builds, tests and forks without a key just don't report anything.
 */

type Props = Record<string, string | number | boolean>;

const APP_KEY = process.env.EXPO_PUBLIC_APTABASE_KEY;

let enabled = false;

export const initAnalytics = () => {
  if (enabled || !APP_KEY) return;
  try {
    Aptabase.init(APP_KEY, {
      enableWeb: true,
      // Only needed on web (native reads it from the binary), but keeps the
      // version the dashboard groups by identical on every platform.
      appVersion: Constants.expoConfig?.version,
      enableCrashReporting: true
    });
    enabled = true;
  } catch (e) {
    console.warn("Analytics init failed", e);
  }
};

export const trackEvent = (name: string, props?: Props) => {
  if (!enabled) return;
  try {
    aptabaseTrackEvent(name, props);
  } catch {
    // Analytics must never break the app.
  }
};

/**
 * Route pattern for a screen, e.g. "/user/[uid]" rather than "/user/8f3c…",
 * so ids never leave the device. Route groups like "(tabs)" are dropped.
 */
export const screenNameFromSegments = (segments: string[]) =>
  "/" + segments.filter((s) => !(s.startsWith("(") && s.endsWith(")"))).join("/");

/** Coarse bucket for a count, so exact numbers can't fingerprint anything. */
export const countBucket = (n: number) =>
  n === 0 ? "0" : n < 5 ? "1-4" : n < 20 ? "5-19" : "20+";
