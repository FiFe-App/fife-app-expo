import { supabase } from "@/lib/supabase/supabase";
import { BuzinessSearchItemInterface } from "@/redux/store.type";
import { RootState } from "@/redux/store";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { ActivityIndicator, Icon, Text } from "react-native-paper";
import { useSelector } from "react-redux";
import BuzinessItem from "../buziness/BuzinessItem";
import { ThemedText } from "../ThemedText";
import { Spacing } from "@/constants/spacing";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";
import { router } from "expo-router";
import { ThemedView } from "../ThemedView";
import { useAppTheme } from "@/assets/theme";

interface SavedBuzinessesProps {
  uid: string;
}

const SavedBuzinesses = ({ uid }: SavedBuzinessesProps) => {
  const { savedBuzinesses, uid: myUid } = useSelector(
    (state: RootState) => state.user
  );
  const theme = useAppTheme();
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
      <ScrollView 

        stickyHeaderIndices={[0]}
      contentContainerStyle={{ gap: Spacing.sm, flexGrow: 1, paddingBottom: MODE_SWITCH_CLEARANCE }}>
        <ThemedView
          style={{
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between", 
            backgroundColor: theme.colors.background
          }}
        >
          <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", gap: Spacing.xs }}>
            <ThemedText variant="labelLarge" type="bold" style={{ color: theme.colors.secondary }}>
              Elmentett bizniszeid
            </ThemedText>
            <Icon size={18} color={theme.colors.secondary} source="bookmark" />
          </View>
        </ThemedView>
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
          <View style={{ alignItems: "center", gap: Spacing.lg, padding: Spacing.sm }}>
            <ThemedText type="subtitle">
              Itt fognak megjelenni az elmentett bizniszek.
            </ThemedText>
            <Text>
              Elmenthetsz bizniszeket későbbre, hogy könnyen megtaláld őket.
            </Text>
          </View>
        )}
      </ScrollView>
  );
};

export default SavedBuzinesses;
