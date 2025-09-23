import { ContactList } from "@/components/buziness/ContactList";
import ProfileImage from "@/components/ProfileImage";
import { ThemedView } from "@/components/ThemedView";
import MyBuzinesses from "@/components/user/MyBuzinesses";
import RecommendationsModal from "@/components/user/RecommendationsModal";
import { Tables } from "@/database.types";
import elapsedTime from "@/lib/functions/elapsedTime";
import {
  clearBuziness,
  clearBuzinessSearchParams,
} from "@/redux/reducers/buzinessReducer";
import { setOptions } from "@/redux/reducers/infoReducer";
import { logout } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { TutorialState, UserState } from "@/redux/store.type";
import { RecommendProfileButton } from "@/lib/supabase/RecommendProfileButton";
import { supabase } from "@/lib/supabase/supabase";
import {
  Link,
  router,
  useFocusEffect,
  useGlobalSearchParams,
} from "expo-router";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import {
  Badge,
  Button,
  Portal,
  Text,
  TouchableRipple,
} from "react-native-paper";
import { Tabs, TabScreen, TabsProvider } from "react-native-paper-tabs";

import { useDispatch, useSelector } from "react-redux";
import globStyles from "@/constants/Styles";
import {
  clearTutorialState,
  viewFunction,
} from "@/redux/reducers/tutorialReducer";
import { theme } from "@/assets/theme";

type UserInfo = Tables<"profiles">;

export default function Index() {
  const { uid: paramUid } = useGlobalSearchParams();
  const uid: string = String(paramUid);
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const { functions }: TutorialState = useSelector(
    (state: RootState) => state.tutorial,
  );

  const dispatch = useDispatch();
  const myProfile = myUid === uid;
  const [data, setData] = useState<UserInfo | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [showRecommendsModal, setShowRecommendsModal] = useState(false);
  const iRecommended = recommendations.includes(myUid || "");

  useFocusEffect(
    useCallback(() => {
      const load = () => {
        if (!uid) return;

        setShowRecommendsModal(false);

        supabase
          .from("profiles")
          .select(
            "*, profileRecommendations!profileRecommendations_profile_id_fkey(*)",
          )
          .eq("id", uid)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.log("err", error.message);
              return;
            }
            if (data) {
              setData(data);
              setRecommendations(
                data.profileRecommendations.map((pr) => pr.author),
              );
              console.log(data);
            }
          });
      };
      load();
      if (myProfile)
        dispatch(
          setOptions([
            {
              icon: "exit-run",
              onPress: () => {
                dispatch(logout());
                dispatch(clearBuziness());
                dispatch(clearTutorialState());
                dispatch(clearBuzinessSearchParams());
                router.navigate("/");
              },
              title: "Kijelentkezés",
            },
          ]),
        );
      return () => {
        setShowRecommendsModal(false);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid]),
  );

  return (
    <>
      <ThemedView style={{ flex: 1 }}>
        {data && uid && (
          <>
            <ThemedView style={{ padding: 16, gap: 8 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <ProfileImage
                  modal
                  uid={uid}
                  avatar_url={data.avatar_url}
                  style={{ width: 100, height: 100 }}
                />
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flex: 1,
                      paddingLeft: 16,
                      justifyContent: "center",
                    }}
                  >
                    <Text variant="titleLarge">{data?.full_name}</Text>
                  </View>
                  <View style={{ flexDirection: "row", flex: 1 }}>
                    <TouchableRipple
                      style={{ flex: 1 }}
                      onPress={() => {
                        if (uid)
                          dispatch(viewFunction({ key: "friendsProfile", uid }));
                        setShowRecommendsModal(true);
                      }}
                    >
                      <View
                        style={{
                          flex: 1,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text> Támogatók: {recommendations.length}</Text>
                        {functions.includes("friendsProfile") && (
                          <Badge style={globStyles.badge}>ÚJ</Badge>
                        )}
                      </View>
                    </TouchableRipple>
                    {data?.created_at && (
                      <View
                        style={{
                          flex: 1,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text>
                          {elapsedTime(Date.parse(data.created_at.toString()))} Fife
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 4, margin: 4 }}>
                {myProfile ? (
                  <Link
                    asChild
                    style={{ flex: 1 }}
                    href={{ pathname: "/user/edit" }}
                  >
                    <Button mode="contained-tonal">Profilom szerkesztése</Button>
                  </Link>
                ) : (
                  <>
                    <RecommendProfileButton
                      profileId={uid}
                      style={{ flex: 1 }}
                      recommended={iRecommended}
                      setRecommended={(recommendedByMe) => {
                        if (myUid) {
                          if (recommendedByMe)
                            setRecommendations([...recommendations, myUid]);
                          else
                            setRecommendations(
                              recommendations.filter((uid) => uid !== myUid),
                            );
                        }
                      }}
                    />
                  </>
                )}
              </View>
            </ThemedView>
            <TabsProvider defaultIndex={0}>
              <Tabs theme={theme} style={{ backgroundColor: theme.colors.background }}>
                <TabScreen
                  label="Bizniszek"
                  badge={
                    functions.includes("buzinessProfile") ? "ÚJ" : undefined
                  }
                  icon="briefcase"
                >
                  <MyBuzinesses uid={uid} myProfile={myProfile} />
                </TabScreen>
                <TabScreen
                  label="Elérhetőségek"
                  badge={
                    functions.includes("contactsProfile") ? "ÚJ" : undefined
                  }
                  icon="email-multiple"
                >
                  <ContactList uid={uid} edit={myProfile} />
                </TabScreen>
              </Tabs>
            </TabsProvider>
          </>
        )}
      </ThemedView>
      {!!data?.full_name && (
        <Portal>
          <RecommendationsModal
            show={showRecommendsModal}
            setShow={setShowRecommendsModal}
            uid={uid}
            name={data.full_name}
          />
        </Portal>
      )}
    </>
  );
}
