import { BuzinessSearchItemInterface } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import BuzinessItem from "../buziness/BuzinessItem";
import { router } from "expo-router";

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
  }, []);

  return (
    <View style={{ flex: 1, padding: 4 }}>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        {loading && <ActivityIndicator />}
        {buzinesses.map((buzinessItem) => (
          <BuzinessItem data={buzinessItem} key={buzinessItem.id} showOptions />
        ))}
        {myProfile && (
          <View>
            <Button onPress={() => router.navigate("/biznisz/new")}>
              <Text>Új Biznisz felvétele</Text>
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MyBuzinesses;
