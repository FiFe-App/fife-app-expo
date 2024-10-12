import { ContactList } from "@/components/buziness/ContactList";
import SupabaseImage from "@/components/SupabaseImage";
import { ThemedView } from "@/components/ThemedView";
import MyBuzinesses from "@/components/user/MyBuzinesses";
import { Tables } from "@/database.types";
import elapsedTime from "@/lib/functions/elapsedTime";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { RecommendProfileButton } from "@/lib/supabase/RecommendProfileButton";
import { supabase } from "@/lib/supabase/supabase";
import { Link, useFocusEffect, useGlobalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { Tabs, TabScreen, TabsProvider } from "react-native-paper-tabs";

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
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "First" },
    { key: "second", title: "Second" },
  ]);

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
        <TabsProvider
          defaultIndex={0}
          // onChangeIndex={handleChangeIndex} optional
        >
          <Tabs
          // uppercase={false} // true/false | default=true (on material v2) | labels are uppercase
          // showTextLabel={false} // true/false | default=false (KEEP PROVIDING LABEL WE USE IT AS KEY INTERNALLY + SCREEN READERS)
          // iconPosition // leading, top | default=leading
          // style={{ backgroundColor:'#fff' }} // works the same as AppBar in react-native-paper
          // dark={false} // works the same as AppBar in react-native-paper
          // theme={} // works the same as AppBar in react-native-paper
          // mode="scrollable" // fixed, scrollable | default=fixed
          // showLeadingSpace={true} //  (default=true) show leading space in scrollable tabs inside the header
          // disableSwipe={false} // (default=false) disable swipe to left/right gestures
          >
            <TabScreen label="Bizniszek" icon="briefcase">
              <MyBuzinesses uid={uid} myProfile={myProfile} />
            </TabScreen>
            <TabScreen label="Elérhetőségek" icon="email-multiple">
              <ContactList uid={uid} />
            </TabScreen>
          </Tabs>
        </TabsProvider>
      </ThemedView>
    );
}
