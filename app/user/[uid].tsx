import BuzinessItem from "@/components/buziness/BuzinessItem";
import SupabaseImage from "@/components/SupabaseImage";
import { ThemedView } from "@/components/ThemedView";
import { Tables } from "@/database.types";
import elapsedTime from "@/lib/functions/elapsedTime";
import { RootState } from "@/lib/redux/store";
import { BuzinessSearchItemInterface, UserState } from "@/lib/redux/store.type";
import { RecommendProfileButton } from "@/lib/supabase/RecommendProfileButton";
import { supabase } from "@/lib/supabase/supabase";
import {
  Link,
  router,
  useFocusEffect,
  useGlobalSearchParams,
} from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useSelector } from "react-redux";

type UserInfo = Tables<"profiles">;

interface ExUser extends UserInfo {
  recommendations?: number;
}

export default function Index() {
  const { uid: paramUid } = useGlobalSearchParams();
  const uid: string = String(paramUid);
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  console.log(myUid, uid);

  const myProfile = myUid === uid;
  const [data, setData] = useState<ExUser | null>(null);
  const [recommended, setRecommended] = useState(false);
  const [buzinesses, setBuzinesses] = useState<BuzinessSearchItemInterface[]>(
    [],
  );

  const load = () => {
    console.log("uid", uid);

    supabase
      .from("profiles")
      .select(
        "*, profileRecommendations!profileRecommendations_profile_id_fkey ( count )",
      )
      .eq("id", paramUid)
      .then(({ data, error }) => {
        if (error) {
          console.log("err", error.message);
          return;
        }
        if (data) {
          setData({
            ...data[0],
            recommendations: data[0].profileRecommendations[0].count,
          });
          supabase
            .from("buziness")
            .select(
              "*, profiles ( full_name ), buzinessRecommendations ( count )",
            )
            .eq("author", paramUid)
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
              }
            });
          console.log(data);
        }
      });
    if (myUid) {
      supabase
        .from("profileRecommendations")
        .select("count")
        .eq("profile_id", uid)
        .then((res) => {
          setRecommended(!!res.data?.[0].count);
        });
    }
  };
  useFocusEffect(
    useCallback(() => {
      load();
      return () => {};
    }, [uid]),
  );

  if (uid)
    return (
      <ThemedView style={{ flex: 1 }}>
        <View style={{ flexDirection: "row" }}>
          <SupabaseImage
            bucket="avatars"
            path={uid + "/" + data?.avatar_url}
            style={{ width: 100, height: 100 }}
          />
          <View style={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text>{data?.full_name}</Text>
            </View>
            <View style={{ flexDirection: "row", flex: 1 }}>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text>{data?.recommendations}</Text>
                <Text>Pajtások</Text>
              </View>
              {data?.created_at && (
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text>
                    {elapsedTime(Date.parse(data.created_at.toString()))}
                  </Text>
                  <Text>Fife</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 4, margin: 4 }}>
          {myProfile ? (
            <Link asChild style={{ flex: 1 }} href={{ pathname: "/user/edit" }}>
              <Button mode="contained">Profil szerkesztése</Button>
            </Link>
          ) : (
            <>
              <RecommendProfileButton
                profileId={uid}
                recommended={recommended}
                setRecommended={setRecommended}
              />
              <Button style={{ flex: 1 }} mode="contained-tonal" disabled>
                Üzenek neki
              </Button>
            </>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text>Bizniszeim</Text>
          <ScrollView contentContainerStyle={{ gap: 4 }}>
            {buzinesses.map((buzinessItem) => (
              <BuzinessItem
                data={buzinessItem}
                key={buzinessItem.id}
                showOptions
              />
            ))}
            {myProfile && (
              <View>
                <Button onPress={() => router.push("/biznisz/new")}>
                  <Text>Új Biznisz felvétele</Text>
                </Button>
              </View>
            )}
          </ScrollView>
        </View>
      </ThemedView>
    );
}
