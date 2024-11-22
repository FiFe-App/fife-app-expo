import { supabase } from "@/lib/supabase/supabase";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { BuzinessSearchItemInterface } from "@/redux/store.type";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, FAB, Text } from "react-native-paper";
import { useDispatch } from "react-redux";
import BuzinessItem from "../buziness/BuzinessItem";
import { ThemedText } from "../ThemedText";

interface MyBuzinessesProps {
  uid: string;
  myProfile: boolean;
}

const MyBuzinesses = ({ uid, myProfile }: MyBuzinessesProps) => {
  const dispatch = useDispatch();
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
    <SafeAreaView style={{ flex: 1, padding: 4 }}>
      <ScrollView contentContainerStyle={{ gap: 8, flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ActivityIndicator style={{}} />
          </View>
        ) : !!buzinesses.length ? (
          buzinesses.map((buzinessItem) => (
            <BuzinessItem
              data={buzinessItem}
              key={buzinessItem.id}
              showOptions
            />
          ))
        ) : (
          <View style={{ alignItems: "center", gap: 16, padding: 8 }}>
            <Image
              source={require("../../assets/images/img-prof.png")}
              style={{ height: 200, width: 200 }}
            />
            <ThemedText type="subtitle">
              Itt fognak megjelenni a bizniszeid.
            </ThemedText>
            <Text>
              A te bizniszeid azon hobbijaid, képességeid vagy szakmáid listája,
              amelyeket meg szeretnél osztani másokkal is. {"\n"}Ha te mondjuk
              úgy gyártod a sütiket, mint egy gép, és ezt felveszed a bizniszeid
              közé, mások által megtalálható leszel a süti kulcsszóval.
            </Text>
          </View>
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
