/**
 * The link a member shares to invite somebody (see components/InviteCard.tsx).
 *
 * Always an https URL on the public site, never the app's own scheme: whoever
 * receives it does not have the app yet, which is the entire point. The web
 * build serves app/meghivo/[uid].tsx there, and a visitor who already has the
 * app installed still lands on the same page.
 */
export const INVITE_BASE_URL = "https://fifeapp.hu";

export const getInviteUrl = (uid: string) => `${INVITE_BASE_URL}/meghivo/${uid}`;
