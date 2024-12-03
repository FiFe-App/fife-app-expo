import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { supabase } from "@/lib/supabase/supabase";
import { setName, login as sliceLogin } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { User } from "@supabase/auth-js";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { ActivityIndicator, Button, Icon } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Index() {
  const dispatch = useDispatch();
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const { "#": hash } = useLocalSearchParams<{ "#": string }>();
  console.log(hash);

  const token_data = hash
    ? Object.fromEntries(hash.split("&").map((e) => e.split("=")))
    : null;
  const [error, setError] = useState<string | null>(
    uid || token_data ? null : "A regisztráció nem sikerült.",
  );

  useEffect(() => {
    const getUserData = async (userData: User) => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select()
        .eq("id", userData.id)
        .single();
      if (error) {
        setError(error.message);
      }
      if (profile) {
        console.log("profile", profile);

        dispatch(sliceLogin(profile?.id));
        dispatch(setName(profile?.full_name));
        return;
      }
    };
    if (token_data) {
      //dispatch(logout());
      console.log(token_data);

      supabase.auth
        .setSession({
          refresh_token: token_data.refresh_token,
          access_token: token_data?.access_token,
        })
        .then(({ data, error }) => {
          if (error) setError(error.message);
          if (data.user) getUserData(data.user);
        });
    }
  }, [dispatch, token_data]);

  return (
    <ThemedView
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      {!error && !uid && <ActivityIndicator />}
      {error && (
        <>
          <Icon source="emoticon-sad" size={100} />
          <ThemedText type="title">Valami hiba történt!</ThemedText>
          <ThemedText>{error}</ThemedText>
          <Link asChild href="/csatlakozom/regisztracio">
            <Button mode="contained">Megpróbálom újra</Button>
          </Link>
        </>
      )}
      {!error && uid && (
        <>
          <Icon source="check-circle" size={100} />
          <ThemedText type="title" style={{ textAlign: "center" }}>
            Gratulálok!
          </ThemedText>
          <View style={{ alignItems: "center" }}>
            <ThemedText>Most már te is FiFe vagy!</ThemedText>
            <ThemedText>Első lépésként állítsd be az adataidat</ThemedText>
          </View>
          <Link asChild href="/user/edit">
            <Button mode="contained">Profilom szerkesztése</Button>
          </Link>
        </>
      )}
    </ThemedView>
  );
}
