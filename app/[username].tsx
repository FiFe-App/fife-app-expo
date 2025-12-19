import { ThemedView } from "@/components/ThemedView";
import { supabase } from "@/lib/supabase/supabase";
import { router, useGlobalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Text } from "react-native-paper";

export default function UsernameRedirect() {
    const { username: raw } = useGlobalSearchParams();
    const [status, setStatus] = useState<"loading" | "not-found" | "redirected">("loading");
    const usernameParam = typeof raw === "string" ? raw : String(raw || "");
    const username = usernameParam.startsWith("@") ? usernameParam.slice(1) : usernameParam;

    useEffect(() => {
        const go = async () => {
            if (!username) { setStatus("not-found"); return; }
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
    }, [username]);

    return (
        <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
            {status === "loading" && (
                <View style={{ alignItems: "center" }}>
                    <ActivityIndicator />
                    <Text style={{ marginTop: 8 }}>Betöltés…</Text>
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
