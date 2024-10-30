import { BuzinessSearchItemInterface } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, FAB } from "react-native-paper";
import BuzinessItem from "../buziness/BuzinessItem";

interface MyBuzinessesProps {
  uid: string;
  myProfile: boolean;
}

const MyBuzinesses = ({ uid, myProfile }: MyBuzinessesProps) => {
  const [buzinesses, setBuzinesses] = useState<BuzinessSearchItemInterface[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    supabase
      .from("buziness")
      .select("*, profiles ( full_name ), buzinessRecommendations ( count )")
      .eq("author", uid)
      .then((res) => {
        if (res.data) {
          setBuzinesses(
            res.data.map((b) => {
              return {
                ...b,
                authorName: b.profiles?.full_name || "???",
                recommendations: b.buzinessRecommendations[0].count,
              };
            }),
          );
          setLoading(false);
        }
      });
  }, [uid]);
  return (
    <SafeAreaView style={{ flex: 1, padding: 4 }}>
      <ScrollView contentContainerStyle={{ gap: 8, flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ActivityIndicator style={{}} />
          </View>
        ) : (
          buzinesses.map((buzinessItem) => (
            <BuzinessItem
              data={buzinessItem}
              key={buzinessItem.id}
              showOptions
            />
          ))
        )}
      </ScrollView>
      <FAB
        icon={"plus"}
        label={"Új biznisz"}
        style={[styles.fabStyle]}
        visible={myProfile}
        onPress={() => router.push("/biznisz/new")}
      />
    </SafeAreaView>
  );
};

export default MyBuzinesses;

const styles = StyleSheet.create({
  fabStyle: {
    bottom: 16,
    right: 16,
    position: "absolute",
  },
});
