import ContactEditScreen from "@/components/buziness/ContactEditScreen";
import MapSelector from "@/components/MapSelector/MapSelector";
import ProfileImage from "@/components/ProfileImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import UsernameInput from "@/components/UsernameInput";
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
import { clearBuziness, clearBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { clearDrafts } from "@/redux/reducers/chatReducer";
import { clearEmotionLogs } from "@/redux/reducers/emotionLogsReducer";
import { clearTutorialState } from "@/redux/reducers/tutorialReducer";
import { useNotificationPrefs } from "@/hooks/useNotificationPrefs";
import { setOptions, clearOptions, addSnack, showLoading, hideLoading } from "@/redux/reducers/infoReducer";
import { setName, setThemePreference, logout, setUserData, setLocation } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { UserState, CircleType } from "@/redux/store.type";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import * as ExpoImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, ScrollView, View, TouchableWithoutFeedback, Platform, Text } from "react-native";
import {
  Button,
  Divider,
  HelperText,
  Icon,
  IconButton,
  Dialog,
  Menu,
  Modal,
  Portal,
  Switch,
  TextInput,
   
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";
import { emotionAvailable } from "@/constants/emotionTiming";

type UserInfo = Partial<Tables<"profiles">>;

export default function Index() {
  const theme = useAppTheme();
  const { uid: myUid, userData, themePreference }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [profile, setProfile] = useState<UserInfo>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | undefined>(undefined);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);
  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<CircleType | undefined>();
  // Notification toggles persist immediately rather than on save: enabling
  // one can trigger an OS permission dialog, and a toggle that silently
  // bounces back later (permission denied) would be baffling.
  const { prefs, setPref } = useNotificationPrefs();
  const dispatch = useDispatch();
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
      const save = async () => {
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
            router.navigate("/user");
          });
      };
      dispatch(
        setOptions([
          {
            title: "Mentés",
            icon: "check",
            onPress: save,
            disabled:
              !profile?.full_name ||
              (!!profile?.username && usernameAvailable === false),
          },
        ]),
      );
      return () => {
        dispatch(clearOptions());
      };
    }, [dispatch, myUid, profile, userLocation, usernameAvailable]),
  );
  useFocusEffect(
    useCallback(() => {
      load();
      return () => { };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myUid]),
  );
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
  
  const handleDeleteProfile = () => {
    setConfirmEmail("");
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);

      const expected = (userData?.email || "").trim().toLowerCase();
      const entered = confirmEmail.trim().toLowerCase();
      if (!expected || entered !== expected) {
        setDeleteLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error("No active session");
        setDeleteLoading(false);
        dispatch(
          addSnack({ title: "Nincs aktív bejelentkezés. Kérlek jelentkezz be újra." })
        );
        return;
      }

      const { data, error } = await supabase.functions.invoke("delete-user", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error deleting user:", error);
        setDeleteLoading(false);
        dispatch(
          addSnack({ title: "Hiba történt a profil törlése során. Kérlek próbáld újra később." })
        );
        return;
      }

      console.log("User deleted successfully", data);
      setShowDeleteDialog(false);

      await supabase.auth.signOut();
      dispatch(logout());
      dispatch(clearBuziness());
      dispatch(clearTutorialState());
      dispatch(clearBuzinessSearchParams());
      dispatch(clearEmotionLogs());
      dispatch(clearDrafts());
      router.navigate("/user/deleted-account");
    } catch (error) {
      console.error("Unexpected error:", error);
      dispatch(addSnack({ title: "Váratlan hiba történt. Kérlek próbáld újra később." }));
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const containerStyle = {
    flex: 1,
    height: "100%",
    borderRadius: BorderRadius.md,
  };

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
        <ScrollView
          style={{ flex: 1, padding: Spacing.sm }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View style={{ alignItems: "center", marginBottom: Spacing.lg }}>
            <View style={{ width: 200 }}>
              <ProfileImage
                key={profile?.avatar_url}
                uid={myUid}
                avatar_url={profile?.avatar_url}
                propLoading={imageLoading}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 8
                }}
              />
              <IconButton
                icon="upload"
                onPress={pickImage}
                mode="contained-tonal"
                style={{ position: "absolute", right: 0, bottom: 0 }}
              />
              {!!profile?.avatar_url && (
                <IconButton
                  icon="close"
                  onPress={deleteImage}
                  mode="contained-tonal"
                  style={{ position: "absolute", right: 0, top: 0 }}
                />
              )}
            </View>
          </View>

          <ThemedText variant="bodyLarge" type="bold" style={{ marginBottom: 8 }}>
            Általános infóid
          </ThemedText>
          <TextInput
            label="Név* (kötelező)"
            value={profile?.full_name || ""}
            disabled={loading}
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={(t) => setProfile({ ...profile, full_name: t })}
          />
          <UsernameInput
            label="Felhasználónév"
            value={profile?.username || ""}
            disabled={loading}
            excludeUid={myUid}
            onAvailabilityChange={setUsernameAvailable}
            onChangeText={(t) => setProfile({ ...profile, username: t })}
            style={{ marginTop: Spacing.sm }}
          />
          <View style={{ padding: Spacing.sm }}>
            <ThemedText type="label">Email, amivel regisztráltál:</ThemedText>
            <ThemedText>{userData?.email}</ThemedText>
          </View>
          <Divider />
          <View style={{ padding: Spacing.sm }}>
            <Menu
              visible={themeMenuVisible}
              onDismiss={() => setThemeMenuVisible(false)}
              anchor={
                <TouchableWithoutFeedback
                  onPress={() => setThemeMenuVisible(true)}
                  accessible={true}
                  accessibilityLabel="Téma kiválasztása"
                >
                  <View>
                    <TextInput
                      mode="outlined"
                      label="Téma"
                      value={
                        themePreference === "auto"
                          ? "Automatikus"
                          : themePreference === "dark"
                            ? "Sötét"
                            : "Világos"
                      }
                      right={<TextInput.Icon icon="chevron-down" />}
                      editable={false}
                      pointerEvents="none"
                    />
                  </View>
                </TouchableWithoutFeedback>
              }
            >
              <Menu.Item
                onPress={() => {
                  dispatch(setThemePreference("auto"));
                  setThemeMenuVisible(false);
                }}
                title="Automatikus"
                leadingIcon={themePreference === "auto" ? "check" : undefined}
              />
              <Menu.Item
                onPress={() => {
                  dispatch(setThemePreference("light"));
                  setThemeMenuVisible(false);
                }}
                title="Világos"
                leadingIcon={themePreference === "light" ? "check" : undefined}
              />
              <Menu.Item
                onPress={() => {
                  dispatch(setThemePreference("dark"));
                  setThemeMenuVisible(false);
                }}
                title="Sötét"
                leadingIcon={themePreference === "dark" ? "check" : undefined}
              />
            </Menu>
          </View>
          <Divider />
          <View style={{ paddingVertical: Spacing.lg }}>
            <ThemedText variant="bodyLarge" type="bold" style={{ marginBottom: Spacing.sm }}>
              Lakhelyed környéke
            </ThemedText>
            <ThemedText type="label" style={{ marginBottom: Spacing.sm }}>
              Add meg a lakhelyedet, hogy lásd a fiféket a környékeden.
            </ThemedText>
            <View style={{ flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" }}>
              <Button
                mode="outlined"
                onPress={() => setLocationMenuVisible(true)}
                icon="map-marker"
                style={{ marginBottom: Spacing.sm }}
              >
                {userLocation ? "Környék módosítása" : "Megadom a környékemet"}
              </Button>
            {!userLocation && (
              <ThemedText type="label" style={{ marginBottom: Spacing.md }}>
                Nincs lakhely beállítva
              </ThemedText>
            )}
              {userLocation && (
                <Button
                  mode="text"
                  onPress={() => setUserLocation(undefined)}
                  icon="delete"
                  textColor={theme.colors.error}
                >
                  Helyzet törlése
                </Button>
              )}
            </View>
          </View>
          <Divider />
          <View style={{ paddingVertical: Spacing.lg, gap: Spacing.md }}>
            <ThemedText variant="bodyLarge" type="bold">Értesítések</ThemedText>
            {Platform.OS !== "web" && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <ThemedText>Push értesítések</ThemedText>
                  <ThemedText type="label">Ajánlások, kommentek és üzenetek a telefonodon</ThemedText>
                </View>
                <Switch
                  value={prefs.notifyPush}
                  onValueChange={(v) => { setPref("notifyPush", v); }}
                />
              </View>
            )}
            {emotionAvailable && Platform.OS !== "web" && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <ThemedText>Napi emlékeztető</ThemedText>
                  <ThemedText type="label">Este 8-kor szólunk, hogy vezesd a hangulatnaplódat</ThemedText>
                </View>
                <Switch
                  value={prefs.emotionDailyPrompt}
                  onValueChange={(v) => { setPref("emotionDailyPrompt", v); }}
                />
              </View>
            )}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <ThemedText>Email értesítések</ThemedText>
                <ThemedText type="label">Értesítések a(z) {userData?.email} címedre</ThemedText>
              </View>
              <Switch
                value={prefs.notifyEmail}
                onValueChange={(v) => { setPref("notifyEmail", v); }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <ThemedText>Kérek hírlevelet</ThemedText>
                <ThemedText type="label">Újdonságok és tippek emailben</ThemedText>
              </View>
              <Switch
                value={prefs.newsletter}
                onValueChange={(v) => { setPref("newsletter", v); }}
              />
            </View>
          </View>
          <Divider />
          <View style={{ gap: Spacing.sm, paddingTop: Spacing.sm, paddingBottom: 48 }}>
            <ThemedText variant="bodyLarge" type="bold">Elérhetőségeid</ThemedText>
            <View style={{ alignItems: "center" }}>
              <Icon source="alert" size={24} color={theme.colors.error} />
              <HelperText type="error" style={{ textAlign: "center" }}>
                Figyelem! Az alább megadott adatok láthatóak minden
                felhasználónak.
              </HelperText>
            </View>
            <ContactEditScreen ref={contactEditRef} />
          </View>
          <Divider style={{ marginTop: 16, marginBottom: 16 }} />
          <View style={{ gap: 8, paddingBottom: 32 }}>

            <ThemedText variant="bodyLarge" type="bold">Veszélyes szekció</ThemedText>
            <HelperText type="error">
              A profil törlése végleges és nem visszavonható.
            </HelperText>
            <Button
              mode="outlined"
              icon="delete"
              textColor={theme.colors.error}
              style={{ borderColor: theme.colors.error }}
              onPress={handleDeleteProfile}
            >
              Profil végleges törlése
            </Button>
          </View>
          <Divider />
          <VersionFooter />
          <Portal>
            <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
              <Dialog.Title>Profil végleges törlése</Dialog.Title>
              <Dialog.Content>
                <ThemedText>
                  Biztosan törölni szeretnéd a profilodat? Ez a művelet nem visszavonható.
                </ThemedText>
                <View style={{ height: 8 }} />
                <ThemedText>
                  A megerősítéshez írd be az alábbi email címet: <Text style={{fontWeight:"bold"}}>{userData?.email}</Text>
                </ThemedText>
                <View style={{ height: 8 }} />
                <TextInput
                  label="Email"
                  value={confirmEmail}
                  onChangeText={setConfirmEmail}
                  autoCapitalize="none"
                  mode="outlined"
                  autoCorrect={false}
                  keyboardType="email-address"
                  disabled={deleteLoading}
                />
                {confirmEmail.length > 0 &&
                  confirmEmail.trim().toLowerCase() !== (userData?.email || "").trim().toLowerCase() && (
                  <HelperText type="error">Nem egyezik az email címmel.</HelperText>
                )}
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setShowDeleteDialog(false)} disabled={deleteLoading}>
                  Mégse
                </Button>
                <Button
                  mode="contained"
                  style={{paddingHorizontal: Spacing.sm}}
                  buttonColor={theme.colors.error}
                  textColor={theme.colors.onError}
                  onPress={confirmDelete}
                  disabled={
                    deleteLoading ||
                    !userData?.email ||
                    confirmEmail.trim().toLowerCase() !== (userData?.email || "").trim().toLowerCase()
                  }
                  icon="delete"
                  loading={deleteLoading}
                >
                  Törlés
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </ScrollView>
        </KeyboardAvoidingView>
        <Portal>
          <Modal
            visible={locationMenuVisible}
            onDismiss={() => setLocationMenuVisible(false)}
            style={{alignItems:"center"}}
              contentContainerStyle={[
                {
                  width: "90%",
                  height: "90%",
                },
              ]}
          >
            <ThemedView style={containerStyle}>
              <MapSelector
                data={userLocation}
                setData={(location) => {
                  console.log("Selected location:", location);
                  setUserLocation(location);
                }}
                searchEnabled
                markerOnly
                setOpen={setLocationMenuVisible}
              />
            </ThemedView>
          </Modal>
        </Portal>
      </ThemedView>
    );
}
