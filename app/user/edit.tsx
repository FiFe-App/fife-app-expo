import AdatokTab from "@/components/user/edit/AdatokTab";
import ProfileStatsCard from "@/components/user/ProfileStatsCard";
import BeallitasokTab from "@/components/user/edit/BeallitasokTab";
import MyBuzinesses from "@/components/user/MyBuzinesses";
import ProfileImage from "@/components/ProfileImage";
import { ThemedView } from "@/components/ThemedView";
import VersionFooter from "@/components/version/VersionFooter";
import { Tables } from "@/database.types";
import {
  AVATARS_BUCKET,
  getAvatarPath,
  getAvatarThumbnailFileName,
  getAvatarThumbnailPath,
} from "@/lib/functions/avatarPaths";
import createThumbnail from "@/lib/functions/createThumbnail";
import getUploadData from "@/lib/functions/getUploadData";
import { supabase } from "@/lib/supabase/supabase";
import { useMyBuzinesses } from "@/hooks/useMyBuzinesses";
import { addSnack, showLoading, hideLoading, setOptions, clearOptions } from "@/redux/reducers/infoReducer";
import { setName, setUserData, setLocation, logout } from "@/redux/reducers/userReducer";
import { clearBuziness, clearBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { clearTutorialState } from "@/redux/reducers/tutorialReducer";
import { clearEmotionLogs } from "@/redux/reducers/emotionLogsReducer";
import { clearChatReadState, clearDrafts } from "@/redux/reducers/chatReducer";
import { RootState } from "@/redux/store";
import { UserState, CircleType } from "@/redux/store.type";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import * as ExpoImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, ScrollView, View, Platform } from "react-native";
import { Button, IconButton, Surface } from "react-native-paper";
import { Tabs, TabScreen, TabsProvider } from "react-native-paper-tabs";
import { useDispatch, useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";

type UserInfo = Partial<Tables<"profiles">>;
type Tab = "bizniszeim" | "adatok" | "beallitasok";
const TAB_ORDER: Tab[] = ["adatok", "bizniszeim", "beallitasok"];

export default function Index() {
  const { uid: myUid, userData }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [profile, setProfile] = useState<UserInfo>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | undefined>(undefined);
  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<CircleType | undefined>();
  const [activeTab, setActiveTab] = useState<Tab>(TAB_ORDER[0]);
  const dispatch = useDispatch();
  const { buzinesses, loading: buzinessesLoading } = useMyBuzinesses(myUid);
  const contactEditRef = useRef<{
    saveContacts: () => Promise<
      | PostgrestSingleResponse<unknown>
      | {
        error: string;
      }
      | undefined
    >;
  }>(null);

  const load = () => {
    console.log("loaded user", myUid);
    if (!myUid) return;
    dispatch(showLoading({ title: "Betöltés...", dismissable: false }));
    setLoading(true);
    supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, website, created_at, updated_at, viewed_functions")
      .eq("id", myUid)
      .then(async ({ data, error }) => {
        if (error) {
          console.log("err", error.message);
          dispatch(hideLoading());
          return;
        }
        if (data) {
          setProfile(data[0]);
          if (data[0]?.avatar_url) backfillThumbnail(data[0].avatar_url);
          // Fetch own location via secure function
          const { data: loc } = await supabase.rpc("get_my_profile_location");
          const myLoc = loc?.[0];
          if (myLoc?.location_wkt) {
            const match = myLoc.location_wkt.match(/POINT\(([\d.-]+) ([\d.-]+)\)/);
            if (match) {
              setUserLocation({
                location: {
                  latitude: parseFloat(match[2]),
                  longitude: parseFloat(match[1]),
                },
                radius: Number(myLoc.location_radius_m ?? 0),
              });
            }
          }
          console.log(data);
          setLoading(false);
          dispatch(hideLoading());
        }
      });
  };
  useFocusEffect(
    useCallback(() => {
      load();
      return () => { };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myUid]),
  );

  useFocusEffect(
    useCallback(() => {
      dispatch(
        setOptions([
          {
            icon: "eye-outline",
            onPress: () => {
              if (myUid) router.push({ pathname: "/user/[uid]", params: { uid: myUid } });
            },
            title: "Hogy látják a profilom mások",
          },
          {
            icon: "archive",
            onPress: () => router.push("/user/saved-buzinesses"),
            title: "Mentett bizniszek",
          },
          {
            icon: "exit-run",
            onPress: async () => {
              await supabase.auth.signOut();
              dispatch(logout());
              dispatch(clearBuziness());
              dispatch(clearTutorialState());
              dispatch(clearBuzinessSearchParams());
              dispatch(clearEmotionLogs());
              dispatch(clearDrafts());
              dispatch(clearChatReadState());
              router.navigate("/");
            },
            title: "Kijelentkezés",
          },
        ]),
      );
      return () => {
        dispatch(clearOptions());
      };
    }, [dispatch, myUid]),
  );

  const save = useCallback(async () => {
    setLoading(true);
    dispatch(showLoading({ title: "Mentés...", dismissable: false }));
    if (!myUid) return;

    const response = await contactEditRef.current?.saveContacts();
    console.log(response);

    if (response?.error) {
      console.log(response.error);
      setLoading(false);
      dispatch(hideLoading());
      return;
    }
    supabase
      .from("profiles")
      .upsert(
        {
          ...profile,
          id: myUid,
        },
        { onConflict: "id" },
      )
      .then(async (res) => {
        setLoading(false);
        console.log("res", res);

        if (res.error) {
          console.log(res.error);
          dispatch(hideLoading());
          return;
        }
        // location/location_radius_m are not in the authenticated SELECT
        // grant, so they must be written via a SECURITY DEFINER function
        const { error: locError } = await supabase.rpc(
          "update_my_profile_location",
          {
            lat: userLocation?.location.latitude ?? null,
            long: userLocation?.location.longitude ?? null,
            radius_m: userLocation?.radius ?? null,
          },
        );
        if (locError) console.log("location update error", locError);
        // Redux only reads the location back on login/app start, so without
        // this the FiFe Radar keeps claiming no location is set until the
        // app is restarted.
        else
          dispatch(
            setLocation(
              userLocation
                ? {
                  latitude: userLocation.location.latitude,
                  longitude: userLocation.location.longitude,
                  radius: userLocation.radius,
                }
                : null,
            ),
          );
        setProfile({ ...profile, location: userLocation?.location || null });
        dispatch(setName(profile?.full_name));
        console.log(res);
        dispatch(hideLoading());
        dispatch(addSnack({ title: "Mentve!" }));
      });
  }, [dispatch, myUid, profile, userLocation]);

  const deleteImage = async () => {
    if (!myUid || !profile?.avatar_url) return;
    setImageLoading(true);
    await supabase.storage
      .from(AVATARS_BUCKET)
      .remove([
        getAvatarPath(myUid, profile.avatar_url),
        getAvatarThumbnailPath(myUid, profile.avatar_url),
      ]);
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", myUid);
    setProfile({ ...profile, avatar_url: null });
    dispatch(setUserData({ avatar_url: null }));
    setImageLoading(false);
  };

  const pickImage = async () => {
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      aspect: [1,1],
      base64: true,
    }).catch((error) => {
      console.log(error);
    });

    if (result && !result?.canceled) {
      console.log(result);

      const previousAvatar = profile?.avatar_url ?? null;
      setProfile({ ...profile, avatar_url: "" });
      setImageLoading(true);
      try {
        const res = await uploadImage(result.assets[0]);
        // Revert to the previous avatar if the upload produced no path
        // (e.g. cancelled mid-flight) so we never leave a blank image.
        setProfile({ ...profile, avatar_url: res ?? previousAvatar });
        // Keep redux userData in sync so the BottomNavigation avatar updates.
        if (res) dispatch(setUserData({ avatar_url: res }));
      } catch (error) {
        console.log("image upload failed", error);
        setProfile({ ...profile, avatar_url: previousAvatar });
        dispatch(
          addSnack({ title: "A kép feltöltése nem sikerült. Kérlek próbáld újra." }),
        );
      } finally {
        setImageLoading(false);
      }
    } else console.log("cancelled");
  };
  // Avatars uploaded before thumbnails existed only have the original. The
  // owner is the only one who may write into their folder, so the missing
  // thumbnail is generated here, the next time they open their profile.
  const backfillThumbnail = async (fileName: string) => {
    if (!myUid) return;
    const thumbnailName = getAvatarThumbnailFileName(fileName);
    const { data } = await supabase.storage
      .from(AVATARS_BUCKET)
      .list(myUid, { search: thumbnailName });
    if (data?.some((file) => file.name === thumbnailName)) return;

    const { data: original } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(getAvatarPath(myUid, fileName));
    await uploadThumbnail(original.publicUrl, fileName);
  };

  // Every avatar is shown small (28–100pt) almost everywhere, so a downscaled
  // copy is uploaded next to the original and used for those. A failure here is
  // not fatal: ProfileImage falls back to the original.
  const uploadThumbnail = async (uri: string, fileName: string) => {
    if (!myUid) return;
    try {
      const thumbnail = await createThumbnail(uri);
      const { error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(
          getAvatarThumbnailPath(myUid, fileName),
          await getUploadData(thumbnail),
          { contentType: "image/jpeg", upsert: true },
        );
      if (error) console.log("avatar thumbnail upload error", error);
    } catch (error) {
      console.log("avatar thumbnail error", error);
    }
  };

  const uploadImage = async (image: ExpoImagePicker.ImagePickerAsset) => {
    if (!image || !myUid) return;

    // Android's launchImageLibraryAsync often returns fileName: null, so derive
    // a name from the URI (or a timestamp) instead of keying off image.fileName.
    const fileName =
      image.fileName ||
      image.uri.split("/").pop() ||
      `avatar_${Date.now()}.jpg`;
    const mimeType = image.mimeType || "image/jpeg";

    // fetch(uri).blob() is unreliable on Android content:// URIs (and iOS temp
    // file URIs) — it can throw or hang, which previously left the avatar
    // spinner stuck forever, so the base64 payload is used where available.
    const uploadData = await getUploadData(image);

    const { data, error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(getAvatarPath(myUid, fileName), uploadData, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.log("avatar upload error", error);
      throw error;
    }

    await uploadThumbnail(image.uri, fileName);

    if (data?.path) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ avatar_url: fileName, id: myUid }, { onConflict: "id" });
      if (profileError) console.log("profile upsert error", profileError);
    }

    return fileName;
  };

  const saveDisabled =
    !profile?.full_name ||
    (!!profile?.username && usernameAvailable === false);

  if (myUid)
    return (
      <ThemedView style={{ flex: 1, paddingBottom: Spacing.xxl }}>
        {/* iOS uses the ScrollView's automaticallyAdjustKeyboardInsets; this app
            is edge-to-edge on Android where that prop is a no-op and the window
            does not resize, so Android needs an active KeyboardAvoidingView.
            enabled per-OS so neither platform double-compensates. */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="height"
          enabled={Platform.OS === "android"}
        >


          {/* react-native-paper-tabs' Swiper renders the tab header and the
              pager as flattened siblings (no wrapping View of its own), so
              this needs an explicit bounded box to lay out inside — without
              it, and without style={{flex:1}} on each page's ScrollView, the
              tab bar has nothing to size against and never shows up. */}
          <View style={{ flex: 1 }}>
            <TabsProvider
              defaultIndex={0}
              onChangeIndex={(index) => setActiveTab(TAB_ORDER[index])}
            >
              <Tabs style={{}}>
                <TabScreen label="Adatok">
                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: Spacing.sm }}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View style={{ alignItems: "center", padding: Spacing.sm }}>
                      <View style={{ width: 150 }}>
                        <ProfileImage
                          key={profile?.avatar_url}
                          uid={myUid}
                          avatar_url={profile?.avatar_url}
                          propLoading={imageLoading}
                          style={{
                            width: 150,
                            height: 150,
                            borderRadius: 8
                          }}
                        />
                        <IconButton
                          icon="upload"
                          size={32}
                          onPress={pickImage}
                          mode="contained-tonal"
                          style={{ position: "absolute", right: -8, bottom: -8, margin: 0 }}
                        />
                        {!!profile?.avatar_url && (
                          <IconButton
                            icon="close"
                            size={32}
                            onPress={deleteImage}
                            mode="contained-tonal"
                            style={{ position: "absolute", right: -8, top: -8, margin: 0 }}
                          />
                        )}
                      </View>
                    </View>
                    {!!myUid && (
                      <View style={{ paddingHorizontal: Spacing.sm, paddingBottom: Spacing.md }}>
                        <ProfileStatsCard
                          uid={myUid}
                          fullName={profile.full_name}
                          createdAt={profile.created_at}
                        />
                      </View>
                    )}
                    <AdatokTab
                      profile={profile}
                      setProfile={setProfile}
                      myUid={myUid}
                      email={userData?.email}
                      loading={loading}
                      onAvailabilityChange={setUsernameAvailable}
                      userLocation={userLocation}
                      setUserLocation={setUserLocation}
                      locationMenuVisible={locationMenuVisible}
                      setLocationMenuVisible={setLocationMenuVisible}
                      contactEditRef={contactEditRef}
                    />
                  </ScrollView>
                </TabScreen>

                <TabScreen label="Bizniszeim">
                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.sm }}>
                    <MyBuzinesses
                      buzinesses={buzinesses}
                      loading={buzinessesLoading}
                      myProfile
                      name={profile.full_name ?? undefined}
                    />
                  </ScrollView>
                </TabScreen>
                <TabScreen label="Beállítások">
                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.sm }}>
                    <BeallitasokTab />
                    <VersionFooter />
                  </ScrollView>
                </TabScreen>
              </Tabs>
            </TabsProvider>
          </View>
          {activeTab === "adatok" && (
            <Surface
              elevation={0}
              style={{
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.md,
                flexDirection: "row",
              }}
            >
              <Button
                mode="contained"
                icon="check-bold"
                disabled={saveDisabled || loading}
                onPress={save}
                style={{ flex: 1, borderRadius: BorderRadius.lg }}
                contentStyle={{ height: 56 }}
                labelStyle={{ fontFamily: "RedHatText-Bold" }}
              >
                Mentés
              </Button>
            </Surface>
          )}
        </KeyboardAvoidingView>
      </ThemedView>
    );
}
