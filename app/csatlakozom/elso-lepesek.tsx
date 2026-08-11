import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { supabase } from "@/lib/supabase/supabase";
import { setTutorialActive, startTutorial } from "@/redux/reducers/tutorialReducer";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { fetchUserProfile } from "@/lib/auth/fetchUserProfile";
import {
  describeAuthRedirectError,
  getAuthRedirectTokens,
} from "@/lib/auth/authRedirectParams";
import { useAuthRedirectParams } from "@/hooks/useAuthRedirectParams";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { ActivityIndicator, Button, Icon } from "react-native-paper";
import { Spacing } from "@/constants/spacing";
import { useDispatch, useSelector } from "react-redux";

const PROFILE_FAILED = "Nem sikerült betölteni a profilodat. Próbáld újra!";

export default function Index() {
  const dispatch = useDispatch();
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const params = useAuthRedirectParams();

  // Both are keyed on the parsed params, which are themselves memoised on the
  // fragment: rebuilding them on every render made them new dependencies each
  // time, so the effect below re-ran after each of its own dispatches and kept
  // calling `setSession`/`fetchUserProfile`.
  const linkError = useMemo(() => describeAuthRedirectError(params), [params]);
  const tokens = useMemo(() => getAuthRedirectTokens(params), [params]);

  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    dispatch(startTutorial(true));
    dispatch(setTutorialActive(true));
  }, [dispatch]);

  useEffect(() => {
    // A refused link carries the reason instead of tokens. Handing that to
    // `setSession` only yields "Auth session missing!", which hides why it
    // failed and offers the user no way forward.
    // `uid` guards against re-exchanging an already-spent launch URL, which
    // stays readable for the rest of the app's lifetime.
    if (!tokens || uid) return;

    let cancelled = false;
    supabase.auth.setSession(tokens).then(async ({ data, error }) => {
      if (cancelled) return;
      if (error) return setFailure(error.message);
      if (!data.user) return setFailure(PROFILE_FAILED);

      try {
        const profile = await fetchUserProfile(data.user, dispatch);
        // No profile row means nothing was dispatched, so `uid` never arrives
        // and the screen would sit on the spinner forever.
        if (!cancelled && !profile) setFailure(PROFILE_FAILED);
      } catch (e) {
        if (!cancelled) setFailure(String(e));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch, tokens, uid]);

  // Derived rather than held in state: both the route params and the restored
  // session can land after the first render, and an error latched on that first
  // render used to stick around even once the sign-in succeeded.
  const error =
    linkError ?? failure ?? (!tokens && !uid ? "A regisztráció nem sikerült." : null);

  return (
    <ThemedView
      style={{
        flex: 1,
        alignItems: "center",
        gap: Spacing.xxxl,
      }}
    >
      {!error && !uid && <ActivityIndicator />}
      {error && (
        <>
          <Icon source="emoticon-sad" size={100} />
          <ThemedText type="title">Valami hiba történt!</ThemedText>
          <ThemedText>{error}</ThemedText>
          <Link
            asChild
            href={linkError ? "/csatlakozom/email-ellenorzes" : "/csatlakozom/regisztracio"}
          >
            <Button mode="contained">Megpróbálom újra</Button>
          </Link>
        </>
      )}
      {!error && uid && (
        <>
          <View style={{ justifyContent: "center", flex: 1, gap: Spacing.lg, width: "100%" }}>
            <ThemedText type="title" style={{ textAlign: "center" }}>
              Gratulálok!
            </ThemedText>
            <ThemedText style={{ textAlign: "center" }}>Most már te is FiFe vagy!</ThemedText>
            <Image source={require("@/assets/images/Connected.png")} contentFit="contain" style={{ width: "100%", height: 400, alignSelf: "center" }} />

          </View>
        </>
      )}
    </ThemedView>
  );
}
