import { ThemedView } from "@/components/ThemedView";
import { getLoginHref } from "@/lib/auth/loginRedirect";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { router, useGlobalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Text } from "react-native-paper";
import { useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";

export default function UsernameRedirect() {
  const { username: raw } = useGlobalSearchParams();
  const [status, setStatus] = useState<"loading" | "not-found" | "redirected">("loading");
  const usernameParam = typeof raw === "string" ? raw : String(raw || "");
  const username = usernameParam.startsWith("@") ? usernameParam.slice(1) : usernameParam;
  const myUid = useSelector((state: RootState) => state.user.uid);

  useEffect(() => {
    const go = async () => {
      if (!username) { setStatus("not-found"); return; }
      // Profiles are for members only (and anon cannot read them): sign in
      // first, then the login screen brings the visitor back here.
      if (!myUid) {
        router.replace(getLoginHref(`/${usernameParam}`));
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("username", username)
        .limit(1)
        .maybeSingle();
      if (error) {
        setStatus("not-found");
        return;
      }
      if (data?.id) {
        setStatus("redirected");
        router.replace(`/user/${data.id}`);
      } else {
        setStatus("not-found");
      }
    };
    go();
  }, [username, usernameParam, myUid]);

  return (
    <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg }}>
      {status === "loading" && (
        <View style={{ alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: Spacing.sm }}>Betöltés…</Text>
        </View>
      )}
      {status === "not-found" && (
        <View style={{ alignItems: "center" }}>
          <Text>Nincs ilyen felhasználónév.</Text>
        </View>
      )}
    </ThemedView>
  );
}
