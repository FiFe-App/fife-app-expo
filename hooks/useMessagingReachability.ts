import { useCallback } from "react";
import { Platform } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNotificationPrefs } from "@/hooks/useNotificationPrefs";
import {
  canReceiveMessageNotifications,
  isUnreachableForMessaging,
} from "@/lib/notifications/messagingReachability";
import { addSnack } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";

/**
 * Keeps "I accept direct messages" and "I can be told about them" from drifting
 * apart.
 *
 * Switching messaging on used to say nothing about notifications, so an account
 * with both channels off collected messages it never heard about — and the
 * person who wrote never got an answer. Every path that turns messaging on now
 * goes through `ensureReachable`, and `unreachable` flags the accounts that are
 * already in that state.
 */
export function useMessagingReachability() {
  const dispatch = useDispatch();
  const { prefs, hydrated, setPref, reload } = useNotificationPrefs();
  const messagingEnabled = useSelector(
    (state: RootState) => state.user.messagingEnabled,
  );

  const unreachable = isUnreachableForMessaging({
    messagingEnabled,
    prefs,
    hydrated,
  });

  /**
   * Make sure at least one channel can deliver a message notification,
   * switching one on if none can. Push is tried first on native — a chat is
   * worth interrupting for, and it is the channel people expect — with email as
   * the fallback when the OS permission is refused. Returns false only if the
   * write itself failed.
   */
  const ensureReachable = useCallback(async (): Promise<boolean> => {
    // The defaults claim email is on, so an un-hydrated read would happily
    // report someone reachable who isn't.
    const current = hydrated ? prefs : ((await reload()) ?? prefs);
    if (canReceiveMessageNotifications(current)) return true;

    if (Platform.OS !== "web" && (await setPref("notifyPush", true))) {
      dispatch(addSnack({ title: "Szólunk a telefonodon, ha üzenetet kapsz." }));
      return true;
    }

    // setPref has already explained a refused push permission in a dialog by
    // now; email is what is left, and silence is the worse outcome.
    const email = await setPref("notifyEmail", true);
    if (email) {
      dispatch(addSnack({ title: "Emailben szólunk, ha üzenetet kapsz." }));
    }
    return email;
  }, [hydrated, prefs, reload, setPref, dispatch]);

  return { unreachable, hydrated, ensureReachable };
}
