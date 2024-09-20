import BuzinessItem from "@/components/buziness/BuzinessItem";
import { ThemedView } from "@/components/ThemedView";
import ProfileImage from "@/components/user/ProfileImage";
import { Tables } from "@/database.types";
import elapsedTime from "@/lib/functions/elapsedTime";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import axios from "axios";
import { router, useFocusEffect, useGlobalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useSelector } from "react-redux";

type UserInfo = Tables<"profiles">;

export default function Index() {
  const { uid: paramUid } = useGlobalSearchParams();
  const uid: string = paramUid?.[0] || "";
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  console.log(myUid, uid);

  const myProfile = myUid === uid;
  const [data, setData] = useState<UserInfo | null>(null);
  const [buzinesses, setBuzinesses] = useState<Tables<"buziness">[]>([]);

  const load = () => {
    console.log(axios.defaults);

    supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .then(({ data, error }) => {
        if (error) {
          console.log(error);
          return;
        }
        if (data) {
          setData(data[0]);
          supabase
            .from("buziness")
            .select()
            .eq("author", uid)
            .then((res) => {
              if (res.data) {
                setBuzinesses(res.data);
              }
            });
          console.log(data);
        }
      });
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
          <ProfileImage uid={uid} style={{ width: 100, height: 100 }} />
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
                <Text>{0}</Text>
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
          <Button style={{ flex: 1 }} mode="contained" disabled>
            Legyen a pajtásom
          </Button>
          <Button style={{ flex: 1 }} mode="contained-tonal" disabled>
            Üzenek neki
          </Button>
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
                <Button onPress={() => router.push("biznisz/new")}>
                  <Text>Új Biznisz felvétele</Text>
                </Button>
              </View>
            )}
          </ScrollView>
        </View>
      </ThemedView>
    );
}
