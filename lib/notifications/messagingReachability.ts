import { NotificationPrefs } from "@/redux/store.type";

/**
 * Whether a new message would actually reach the user.
 *
 * The `notify` edge function delivers a message notification over push or
 * email and nothing else (see `sendNotification` in supabase/functions/notify),
 * so with both switched off the message lands silently in a screen the user has
 * no reason to open. Someone who advertises MESSAGE among their contacts has
 * told the rest of the app they can be written to, so that combination is a
 * broken promise rather than a preference — the app either fixes it when
 * messaging is switched on or warns about it afterwards.
 */
export const canReceiveMessageNotifications = (prefs: NotificationPrefs) =>
  prefs.notifyPush || prefs.notifyEmail;

/**
 * True when the account accepts direct messages it cannot be told about.
 * `hydrated` matters: the defaults claim both channels are off, which would
 * flash the warning at everyone on every cold start.
 */
export const isUnreachableForMessaging = ({
  messagingEnabled,
  prefs,
  hydrated,
}: {
  messagingEnabled: boolean | undefined;
  prefs: NotificationPrefs;
  hydrated: boolean;
}) => hydrated && !!messagingEnabled && !canReceiveMessageNotifications(prefs);
