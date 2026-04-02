import ProfileImage from "@/components/ProfileImage";
import { ThemedView } from "@/components/ThemedView";
import MyBuzinesses from "@/components/user/MyBuzinesses";
import RecommendationsModal from "@/components/user/RecommendationsModal";
import ReportProfileModal from "@/components/user/ReportProfileModal";
import { Tables } from "@/database.types";
import elapsedTime from "@/lib/functions/elapsedTime";
import getLinkForContact from "@/lib/functions/getLinkForContact";
import typeToIcon from "@/lib/functions/typeToIcon";
import typeToValueLabel from "@/lib/functions/typeToValueLabel";
import {
  clearBuziness,
  clearBuzinessSearchParams,
} from "@/redux/reducers/buzinessReducer";
import { setOptions } from "@/redux/reducers/infoReducer";
import { addSnack } from "@/redux/reducers/infoReducer";
import { logout } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { TutorialState, UserState } from "@/redux/store.type";
import { RecommendProfileButton } from "@/lib/supabase/RecommendProfileButton";
import { supabase } from "@/lib/supabase/supabase";
import {
  Link,
  router,
  Stack,
  useFocusEffect,
  useGlobalSearchParams,
} from "expo-router";
import React, { useCallback, useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import {
  Badge,
  Button,
  Icon,
  IconButton,
  List,
  Portal,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import * as Clipboard from "expo-clipboard";

import { useDispatch, useSelector } from "react-redux";
import globStyles from "@/constants/Styles";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import {
  clearTutorialState,
  viewFunction,
} from "@/redux/reducers/tutorialReducer";
import Measure from "@/components/tutorial/Measure";

type UserInfo = Tables<"profiles">;

export default function UserPage() {
  const { uid: paramUid } = useGlobalSearchParams();
  const uid: string = String(paramUid);
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const { functions }: TutorialState = useSelector(
    (state: RootState) => state.tutorial,
  );
  const theme = useTheme();

  const dispatch = useDispatch();
  const myProfile = myUid === uid;
  const [data, setData] = useState<UserInfo | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [contacts, setContacts] = useState<Tables<"contacts">[]>([]);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [showRecommendsModal, setShowRecommendsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const iRecommended = recommendations.includes(myUid || "");

  useFocusEffect(
    useCallback(() => {
      const load = () => {
        if (!uid) return;

        setShowRecommendsModal(false);

        supabase
          .from("profiles")
          .select(
            "id, full_name, username, avatar_url, website, created_at, updated_at, viewed_functions, profileRecommendations!profileRecommendations_profile_id_fkey(*)",
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
            }
          });

        supabase
          .from("contacts")
          .select("*")
          .eq("author", uid)
          .then((res) => {
            if (res.data) setContacts(res.data);
          });

        supabase
          .from("profileRecommendations")
          .select("id", { count: "exact", head: true })
          .eq("author", uid)
          .then((res) => {
            setConnectionsCount(res.count ?? 0);
          });
      };
      load();
      if (myProfile)
        dispatch(
          setOptions([
            {
              icon: "archive",
              onPress: () => router.push("/user/saved-buzinesses"),
              title: "Mentett bizniszek",
            },
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
      {<Stack.Screen options={{ title:myProfile ? "Profilod" : "" }} />}
      <ThemedView style={{ flex: 1 }}>
        {data && uid && (
          <ScrollView>
            <ThemedView style={{ padding: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm }}>
              {/* Hero: Avatar left, name + stats right */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.lg, position: "relative" }}>
                {!myProfile && (
                  <IconButton
                    icon="alert-octagon"
                    size={20}
                    onPress={() => setShowReportModal(true)}
                    style={{ position: "absolute", right: -Spacing.sm, top: -Spacing.sm, zIndex: 1 }}
                  />
                )}
                <ProfileImage
                  modal
                  uid={uid}
                  avatar_url={data.avatar_url}
                  style={{ width: 80, height: 80, borderRadius: BorderRadius.full }}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="titleLarge">{data?.full_name}</Text>
                  {/* Stats row */}
                  <View style={{ flexDirection: "row", marginTop: Spacing.xs }}>
                    <TouchableRipple
                      onPress={() => {
                        if (uid)
                          dispatch(viewFunction({ key: "friendsProfile", uid }));
                        setShowRecommendsModal(true);
                      }}
                      style={{ flex: 1, borderRadius: BorderRadius.md }}
                    >
                      <View style={{ paddingVertical: Spacing.xs }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text variant="titleMedium" style={{ fontWeight: "700" }}>
                            {recommendations.length}
                          </Text>
                          {functions.includes("friendsProfile") && (
                            <Badge style={globStyles.badge}>ÚJ</Badge>
                          )}
                        </View>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Támogatók
                        </Text>
                      </View>
                    </TouchableRipple>

                    <TouchableRipple
                      onPress={() => router.push({ pathname: "/user/[uid]/connections", params: { uid } })}
                      style={{ flex: 1, borderRadius: BorderRadius.md }}
                    >
                      <View style={{ paddingVertical: Spacing.xs }}>
                        <Text variant="titleMedium" style={{ fontWeight: "700" }}>
                          {connectionsCount}
                        </Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Kapcsolatok
                        </Text>
                      </View>
                    </TouchableRipple>

                    {data?.created_at && (
                      <View style={{ flex: 1, paddingVertical: Spacing.xs }}>
                        <Text variant="titleMedium" style={{ fontWeight: "700" }}>
                          {elapsedTime(Date.parse(data.created_at.toString()))}
                        </Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Fife
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Username */}
              {!!data?.username && (
                <TouchableRipple
                  onPress={() => {
                    Clipboard.setStringAsync(`www.fifeapp.hu/@${data.username}`).then(() => {
                      dispatch(addSnack({ title: "Vágólapra másolva!" }));
                    });
                  }}
                  style={{ borderRadius: BorderRadius.xs, alignSelf: "flex-start" }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
                    <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      @{data.username}
                    </Text>
                    <Icon source="content-copy" size={14} color={theme.colors.onSurfaceVariant} />
                  </View>
                </TouchableRipple>
              )}

              {/* Contacts */}
              {contacts.length > 0 && (
                <View style={{ width: "100%" }}>
                  {contacts.map((contact) => (
                    <TouchableRipple
                      key={contact.id}
                      onPress={() => {
                        const link = getLinkForContact(contact);
                        if (link) Linking.openURL(String(link));
                      }}
                      onLongPress={() => {
                        Clipboard.setStringAsync(contact.data).then(() => {
                          dispatch(addSnack({ title: "Vágólapra másolva!" }));
                        });
                      }}
                    >
                      <List.Item
                        title={contact.data}
                        description={contact.title || typeToValueLabel(contact.type)}
                        left={(props) => (
                          <List.Icon {...props} icon={typeToIcon(contact.type)} />
                        )}
                        right={(props) => (
                          <List.Icon {...props} icon="open-in-new" />
                        )}
                      />
                    </TouchableRipple>
                  ))}
                </View>
              )}
              {myProfile && contacts.length === 0 && (
                <TouchableRipple
                  onPress={() => router.push("/user/edit")}
                  style={{ borderRadius: BorderRadius.sm }}
                >
                  <Text variant="labelMedium" style={{ color: theme.colors.primary, padding: Spacing.xs }}>
                    Elérhetőségek hozzáadása
                  </Text>
                </TouchableRipple>
              )}

              {/* Action button */}
              <View style={{ width: "100%" }}>
                {myProfile ? (
                  <Measure name="edit-profile">
                    <Link
                      asChild
                      style={{ width: "100%" }}
                      href={{ pathname: "/user/edit" }}
                    >
                      <Button mode="contained-tonal">Profilom szerkesztése</Button>
                    </Link>
                  </Measure>
                ) : (
                  <RecommendProfileButton
                    profileId={uid}
                    style={{ width: "100%" }}
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
                )}
              </View>
            </ThemedView>
            <View style={{ height: 1, backgroundColor: theme.colors.surfaceVariant, marginHorizontal: Spacing.lg }} />

            {/* Businesses inline */}
            <Measure name="user-biznisz-tabs">
              <MyBuzinesses uid={uid} myProfile={myProfile} name={data.full_name ?? undefined} />
            </Measure>
          </ScrollView>
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
          <ReportProfileModal
            show={showReportModal}
            setShow={setShowReportModal}
            profileId={uid}
            profileName={data.full_name}
          />
        </Portal>
      )}
    </>
  );
}
