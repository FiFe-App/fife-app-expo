import { supabase } from "@/lib/supabase/supabase";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { BuzinessSearchItemInterface } from "@/redux/store.type";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { useDispatch } from "react-redux";
import BuzinessItem from "../buziness/BuzinessItem";
import SectionLabel from "../buziness/SectionLabel";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";

interface MyBuzinessesProps {
  uid: string;
  myProfile: boolean;
  name?: string;
}

const MyBuzinesses = ({ uid, myProfile, name }: MyBuzinessesProps) => {
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const [buzinesses, setBuzinesses] = useState<BuzinessSearchItemInterface[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    console.log("UID", uid);

    if (uid === undefined) return;
    setLoading(true);
    supabase
      .from("buziness")
      .select("*, profiles ( full_name ), buzinessRecommendations ( count )")
      .eq("author", uid)
      .order("created_at")
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
        if (uid) dispatch(viewFunction({ key: "buzinessProfile", uid }));
      });
  }, [dispatch, uid]);
  return (
    <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg, gap: Spacing.md }}>
      {loading ? (
        <View style={{ padding: Spacing.xxxl, alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      ) : buzinesses.length ? (
        <>
          <SectionLabel label={myProfile ? "Bizniszeim" : `${name} bizniszei`} />
          {buzinesses.map((buzinessItem) => (
            <BuzinessItem
              data={buzinessItem}
              key={buzinessItem.id}
              showOptions
            />
          ))}
        </>
      ) : (
        <View style={{ alignItems: "center", gap: Spacing.lg, padding: Spacing.sm }}>
          <ThemedView responsive={400} style={{ flexDirection: "row", padding: Spacing.sm, alignItems: "center" }}>
            <Image
              source={require("@/assets/images/img-prof.png")}
              style={{ height: 200, width: 200 }}
            />
            <View style={{ alignItems: "center", justifyContent: "center", flex: 1, gap: Spacing.lg }}>
              <ThemedText type="subtitle">
                {myProfile
                  ? "Itt fognak megjelenni a saját bizniszeid."
                  : `${name} még nem adott meg bizniszt.`}
              </ThemedText>
              {myProfile && (
                <Button
                  mode="contained"
                  icon="plus"
                  style={{ borderRadius: BorderRadius.pill }}
                  onPress={() => router.push("/biznisz/new")}
                >
                  Új biznisz
                </Button>
              )}
            </View>
          </ThemedView>
          <Text>
            A te bizniszeid azon hobbijaid, képességeid vagy szakmáid listája,
            amelyeket meg szeretnél osztani másokkal is. {"\n"}Ha, mondjuk,
            futószalagon gyártod a sütiket, és ezt felveszed a bizniszeid
            közé, mások által megtalálható leszel a süti kulcsszóval.
          </Text>
        </View>
      )}
    </View>
  );
};

export default MyBuzinesses;
