import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, Link } from "expo-router";
import { ActivityIndicator, Button } from "react-native-paper";
import { supabase } from "@/lib/supabase/supabase";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";

export default function Meghivas() {
  const { invite } = useLocalSearchParams();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!invite || typeof invite !== "string") {
        setProfileName(null);
        setLoading(false);
        return;
      }
      // Assuming invite is the inviter's user id (uid)
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", invite)
        .single();
      if (error || !data) {
        setProfileName(null);
      } else {
        setProfileName(data.full_name);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [invite]);

  return (
    <ThemedView type="default" style={styles.container}>
      {loading ?
        <ActivityIndicator /> :
        <View style={styles.content}>
          <ThemedText type="title">
            Szia!{"\n"}{profileName || "egy felhasználó"} meghívott téged a FiFe Appba.
          </ThemedText>
          <ThemedText style={styles.greeting}>
            {"\n\n"}
            Ez azt jelenti, hogy ő megbízik benned, és szeretné, ha csatlakoznál ehhez a segítői közösséghez.
          </ThemedText>
        </View>
      }
      <View style={{ alignItems: "flex-end", justifyContent: "center", height: 48, margin: 50 }}>


        <Link href={"/csatlakozom"} asChild
          disabled={loading}>
          <Button mode="contained">Tovább</Button>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  content: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
  },
});
