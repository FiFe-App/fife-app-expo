import ErrorScreen from "@/components/ErrorScreen";
import ProfileImage from "@/components/ProfileImage";
import { ThemedView } from "@/components/ThemedView";
import MyBuzinesses from "@/components/user/MyBuzinesses";
import RecommendationsModal from "@/components/user/RecommendationsModal";
import ReportProfileModal from "@/components/user/ReportProfileModal";
import BlockUserModal from "@/components/user/BlockUserModal";
import { Tables } from "@/database.types";
import elapsedTime from "@/lib/functions/elapsedTime";
import ContactsCard from "@/components/buziness/ContactsCard";
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
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Badge,
  Button,
  FAB,
  Icon,
  IconButton,
  Portal,
  Surface,
  Text,
  TouchableRipple,

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
import SectionLabel from "@/components/buziness/SectionLabel";
import { useAppTheme } from "@/assets/theme";

type UserInfo = Partial<Tables<"profiles">>;

export default function UserPage() {
  const { uid: paramUid } = useLocalSearchParams<{ uid: string }>();
  const uid: string = paramUid ?? "";
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const { functions }: TutorialState = useSelector(
    (state: RootState) => state.tutorial,
  );
  const theme = useAppTheme();

  const dispatch = useDispatch();
  const myProfile = myUid === uid;
  const [data, setData] = useState<UserInfo | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [contacts, setContacts] = useState<Tables<"contacts">[]>([]);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [showRecommendsModal, setShowRecommendsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [notFound, setNotFound] = useState(false);
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
          .maybeSingle()
          .then(({ data, error }) => {
            if (error) {
              console.log("err", error.message);
              setNotFound(true);
              return;
            }
            if (data) {
              setData(data);
              setNotFound(false);
              setRecommendations(
                data.profileRecommendations.map((pr) => pr.author),
              );
            } else {
              setNotFound(true);
            }
          });

        if (!myProfile && myUid) {
          supabase
            .from("blocked_users")
            .select("id", { count: "exact", head: true })
            .eq("blocker_id", myUid)
            .eq("blocked_id", uid)
            .then(({ count }) => setIsBlocked((count ?? 0) > 0));
        }

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
      setData(null);
      setNotFound(false);
      return () => {
        setShowRecommendsModal(false);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid]),
  );

  if (notFound) {
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <ErrorScreen
          icon="account-off"
          title="Nem található"
          text="Ez a felhasználó nem létezik vagy törölte fiókját."
        />
      </>
    );
  }

  return (
    <>
      {<Stack.Screen options={{ title:myProfile ? "Profilod" : "" }} />}
      <ThemedView style={{ flex: 1 }}>
        {data && uid && (
          <ScrollView contentContainerStyle={{ paddingBottom: myProfile ? 96 : 0 }}>
            <ThemedView style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.xxl, paddingBottom: Spacing.xl, gap: Spacing.xl }}>
              {/* Report / Block buttons */}
              {!myProfile && (
                <View style={{ position: "absolute", right: Spacing.sm, top: Spacing.sm, zIndex: 1, flexDirection: "row" }}>
                  <IconButton
                    icon="alert-octagon"
                    size={20}
                    onPress={() => setShowReportModal(true)}
                  />
                  <IconButton
                    icon={isBlocked ? "account-check" : "account-cancel"}
                    size={20}
                    iconColor={isBlocked ? undefined : "#c0392b"}
                    onPress={async () => {
                      if (isBlocked) {
                        await supabase
                          .from("blocked_users")
                          .delete()
                          .eq("blocker_id", myUid!)
                          .eq("blocked_id", uid);
                        setIsBlocked(false);
                      } else {
                        setShowBlockModal(true);
                      }
                    }}
                  />
                </View>
              )}

              {/* Centered avatar with gold ring */}
              <View style={{ alignItems: "center", gap: Spacing.md }}>
                <View style={{
                  borderRadius: BorderRadius.full,
                  borderWidth: 3,
                  borderColor: theme.colors.primary,
                  padding: 3,
                }}>
                  <ProfileImage
                    modal
                    uid={uid}
                    avatar_url={data.avatar_url}
                    style={{ width: 100, height: 100, borderRadius: BorderRadius.full }}
                  />
                </View>
                <Text variant="headlineMedium" style={{ textAlign: "center" }}>
                  {data?.full_name}
                </Text>

                {/* Username */}
                {!!data?.username && (
                  <TouchableRipple
                    onPress={() => {
                      Clipboard.setStringAsync(`www.fifeapp.hu/@${data.username}`).then(() => {
                        dispatch(addSnack({ title: "Vágólapra másolva!" }));
                      });
                    }}
                    style={{ borderRadius: BorderRadius.xs }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
                      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        @{data.username}
                      </Text>
                      <Icon source="content-copy" size={14} color={theme.colors.onSurfaceVariant} />
                    </View>
                  </TouchableRipple>
                )}
              </View>

              {/* Stats card */}
              <Surface
                style={{
                  flexDirection: "row",
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.lg,
                  width: "100%",
                }}
                elevation={1}
              >
                <TouchableRipple
                  onPress={() => {
                    if (uid)
                      dispatch(viewFunction({ key: "friendsProfile", uid }));
                    setShowRecommendsModal(true);
                  }}
                  style={{ flex: 1, alignItems: "center", borderRadius: BorderRadius.md }}
                >
                  <View style={{ alignItems: "center", paddingVertical: Spacing.xs }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text variant="headlineSmall" style={{ fontWeight: "700", color: theme.colors.primary }}>
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

                <View style={{ width: 1, backgroundColor: theme.colors.outlineVariant, marginVertical: Spacing.xs }} />

                <TouchableRipple
                  onPress={() => router.push({ pathname: "/user/[uid]/connections", params: { uid } })}
                  style={{ flex: 1, alignItems: "center", borderRadius: BorderRadius.md }}
                >
                  <View style={{ alignItems: "center", paddingVertical: Spacing.xs }}>
                    <Text variant="headlineSmall" style={{ fontWeight: "700", color: theme.colors.primary }}>
                      {connectionsCount}
                    </Text>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Kapcsolatok
                    </Text>
                  </View>
                </TouchableRipple>

                <View style={{ width: 1, backgroundColor: theme.colors.outlineVariant, marginVertical: Spacing.xs }} />

                {data?.created_at && (
                  <View style={{ flex: 1, alignItems: "center", paddingVertical: Spacing.xs }}>
                    <Text variant="headlineSmall" style={{ fontWeight: "700", color: theme.colors.primary }}>
                      {elapsedTime(Date.parse(data.created_at.toString()))}
                    </Text>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Fife
                    </Text>
                  </View>
                )}
              </Surface>

              {/* Contacts */}
              {contacts.length > 0 && (
                <View style={{ width: "100%", gap: Spacing.sm }}>
                  <SectionLabel label="Elérhetőségek" />
                  <ContactsCard contacts={contacts} />
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
                      <Button mode="contained-tonal" style={{ borderRadius: BorderRadius.pill }}>
                        Profilom szerkesztése
                      </Button>
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

            {/* Businesses */}
            <Measure name="user-biznisz-tabs">
              <MyBuzinesses uid={uid} myProfile={myProfile} name={data.full_name ?? undefined} />
            </Measure>
          </ScrollView>
        )}
        {myProfile && (
          <FAB
            icon="plus"
            label="Új biznisz"
            onPress={() => router.push("/biznisz/new")}
            style={{
              position: "absolute",
              right: Spacing.md,
              bottom: Spacing.md,
              borderRadius: BorderRadius.pill,
            }}
          />
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
          <BlockUserModal
            show={showBlockModal}
            setShow={setShowBlockModal}
            profileId={uid}
            profileName={data.full_name}
            onBlocked={() => {
              setIsBlocked(true);
              router.back();
            }}
          />
        </Portal>
      )}
    </>
  );
}
