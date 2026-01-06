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
import { ThemedView } from "../ThemedView";
import { useTranslation } from "react-i18next";

interface MyBuzinessesProps {
  uid: string;
  myProfile: boolean;
}

const MyBuzinesses = ({ uid, myProfile }: MyBuzinessesProps) => {
  const { t } = useTranslation();
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
        ) : buzinesses.length ? (
          buzinesses.map((buzinessItem) => (
            <BuzinessItem
              data={buzinessItem}
              key={buzinessItem.id}
              showOptions
            />
          ))
        ) : (
          <View style={{ alignItems: "center", gap: 16, padding: 8 }}>

            <ThemedView responsive={400} style={{flexDirection:"row",padding:10, alignItems:"center"}}>
              <Image
                source={require("../../assets/images/img-prof.png")}
                style={{ height: 200, width: 200 }}
              />
              <View style={{alignItems:"center",justifyContent:"center" ,flex:1,gap:16}}>
                <ThemedText type="subtitle">
                  {t("myBuzinesses.empty")}
                </ThemedText>
                <FAB
                  icon={"plus"}
                  label={t("myBuzinesses.newBiznisz")}
                  visible={myProfile}
                  onPress={() => router.push("/biznisz/new")}
                />
              </View>
            </ThemedView>
            <Text>
              {t("myBuzinesses.description")}
            </Text>
          </View>
        )}
      </ScrollView>
      {!!buzinesses.length && <FAB
        icon={"plus"}
        label={t("myBuzinesses.newBiznisz")}
        style={[styles.fabStyle]}
        visible={myProfile}
        onPress={() => router.push("/biznisz/new")}
      />}
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
