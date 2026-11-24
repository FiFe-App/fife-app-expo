import { router } from "expo-router";
import { useCallback } from "react";
import { useDispatch } from "react-redux";

import { supabase } from "@/lib/supabase/supabase";
import { clearBuziness, clearBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { clearChatReadState, clearDrafts } from "@/redux/reducers/chatReducer";
import { clearEmotionLogs } from "@/redux/reducers/emotionLogsReducer";
import { clearTutorialState } from "@/redux/reducers/tutorialReducer";
import { logout } from "@/redux/reducers/userReducer";

/**
 * Signs out and clears everything the signed-in user left in the store, then
 * goes back to the start. Shared by the profile's menu and the Én side's
 * settings, so both log out exactly the same way.
 */
export function useLogout() {
  const dispatch = useDispatch();
  return useCallback(async () => {
    await supabase.auth.signOut();
    dispatch(logout());
    dispatch(clearBuziness());
    dispatch(clearTutorialState());
    dispatch(clearBuzinessSearchParams());
    dispatch(clearEmotionLogs());
    dispatch(clearDrafts());
    dispatch(clearChatReadState());
    router.navigate("/");
  }, [dispatch]);
}
