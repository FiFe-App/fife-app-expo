import { supabase } from "@/lib/supabase/supabase";
import { BuzinessSearchItemInterface } from "@/redux/store.type";
import { RootState } from "@/redux/store";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useSelector } from "react-redux";
import BuzinessItem from "../buziness/BuzinessItem";
import { ThemedText } from "../ThemedText";

interface SavedBuzinessesProps {
  uid: string;
}

const SavedBuzinesses = ({ uid }: SavedBuzinessesProps) => {
  const { savedBuzinesses, uid: myUid } = useSelector(
    (state: RootState) => state.user
  );
  const [buzinesses, setBuzinesses] = useState<BuzinessSearchItemInterface[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uid !== myUid || !savedBuzinesses.length) {
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("buziness")
      .select("*, profiles ( full_name ), buzinessRecommendations ( count )")
      .in("id", savedBuzinesses)
      .order("created_at", { ascending: false })
      .then((res) => {
        if (res.data) {
          setBuzinesses(
            res.data.map((b) => {
              return {
                ...b,
                authorName: b.profiles?.full_name || "???",
                recommendations: b.buzinessRecommendations[0].count,
              };
            })
          );
        }
        setLoading(false);
      });
  }, [savedBuzinesses, uid, myUid]);

  if (uid !== myUid) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 4 }}>
      <ScrollView contentContainerStyle={{ gap: 8, flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ActivityIndicator />
          </View>
        ) : buzinesses.length ? (
          buzinesses.map((buzinessItem) => (
            <BuzinessItem
              data={buzinessItem}
              key={buzinessItem.id}
              showOptions={false}
            />
          ))
        ) : (
          <View style={{ alignItems: "center", gap: 16, padding: 8 }}>
            <ThemedText type="subtitle">
              Itt fognak megjelenni az elmentett bizniszek.
            </ThemedText>
            <Text>
              Elmenthetsz bizniszeket későbbre, hogy könnyen megtaláld őket.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SavedBuzinesses;
