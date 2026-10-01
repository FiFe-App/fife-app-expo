import { Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard";

import { SITE_URL } from "@/lib/siteUrl";

/**
 * The link to a biznisz page on the public site.
 *
 * It only opens for a signed-out visitor if the author marked the biznisz
 * public (the `public` column and the buziness SELECT policy); otherwise the
 * page asks them to sign in. Sharing is offered either way — a member who gets
 * the link is taken straight to it.
 */
export const getBuzinessUrl = (id: number | string) => `${SITE_URL}/biznisz/${id}`;

export type ShareResult = "shared" | "copied" | "dismissed" | "failed";

/**
 * Hands the link over the way the platform does it: the native share sheet on
 * iOS/Android, the Web Share API where the browser has one (mobile Safari,
 * Chrome on Android), and the clipboard everywhere else — desktop browsers
 * mostly have no share sheet, and a link on the clipboard is still a link the
 * user can paste into Facebook.
 */
export async function shareBuziness(
  id: number | string,
  title?: string,
): Promise<ShareResult> {
  const url = getBuzinessUrl(id);
  const message = title ? `${title} – FiFe App\n${url}` : url;

  if (Platform.OS === "web") {
    const webNavigator =
      typeof navigator !== "undefined"
        ? (navigator as Navigator & { share?: (data: ShareData) => Promise<void> })
        : undefined;
    if (webNavigator?.share) {
      try {
        await webNavigator.share({ title, text: title, url });
        return "shared";
      } catch {
        // Cancelled, or the browser refused (share needs a user gesture and a
        // secure context). Falling through to the clipboard still gives the
        // user the link instead of nothing.
      }
    }
    try {
      await Clipboard.setStringAsync(url);
      return "copied";
    } catch {
      return "failed";
    }
  }

  try {
    const result = await Share.share({ message, url, title });
    return result.action === Share.dismissedAction ? "dismissed" : "shared";
  } catch {
    try {
      await Clipboard.setStringAsync(url);
      return "copied";
    } catch {
      return "failed";
    }
  }
}
