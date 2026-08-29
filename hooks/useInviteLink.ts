import * as Clipboard from "expo-clipboard";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { INVITE_BASE_URL, getInviteUrl } from "@/lib/invitations/inviteLink";
import { addSnack } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";

/**
 * The member's own invite link, and the one way to hand it over.
 *
 * Two places give it out — the dismissible card on the home screen and the
 * permanent section in Profil → Beállítások — and they must not each build
 * their own URL or confirm the copy differently: the link is what credits the
 * inviter once the guest registers (see app/meghivo/[uid].tsx).
 *
 * Without a uid the plain site is still better than an invite crediting
 * nobody; neither caller is rendered signed out anyway.
 */
export function useInviteLink() {
  const uid = useSelector((state: RootState) => state.user.uid);
  const dispatch = useDispatch();

  const inviteUrl = useMemo(
    () => (uid ? getInviteUrl(uid) : INVITE_BASE_URL),
    [uid],
  );

  const copyInviteLink = useCallback(async () => {
    await Clipboard.setStringAsync(inviteUrl);
    dispatch(addSnack({ title: "Meghívó vágólapon" }));
  }, [inviteUrl, dispatch]);

  return { inviteUrl, copyInviteLink };
}
