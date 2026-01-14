import ContactEditScreen from "@/components/buziness/ContactEditScreen";
import ProfileImage from "@/components/ProfileImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import UsernameInput from "@/components/UsernameInput";
import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { addSnack, setOptions } from "@/redux/reducers/infoReducer";
import { logout, setName, setUserData } from "@/redux/reducers/userReducer";
import { clearBuziness, clearBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { clearTutorialState } from "@/redux/reducers/tutorialReducer";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import * as ExpoImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Button,
  Divider,
  HelperText,
  Icon,
  IconButton,
  Dialog,
  Portal,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

type UserInfo = Partial<Tables<"profiles">>;

export default function Index() {
  const theme = useTheme();
  const { uid: myUid, userData }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [profile, setProfile] = useState<UserInfo>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | undefined>(undefined);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
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
    setLoading(true);

    supabase
      .from("profiles")
      .select("*")
      .eq("id", myUid)
      .then(({ data, error }) => {
        if (error) {
          console.log("err", error.message);
          return;
        }
        if (data) {
          setProfile(data[0]);
          console.log(data);
          setLoading(false);
        }
      });
  };
  useFocusEffect(
    useCallback(() => {
      const save = async () => {
        setLoading(true);
        if (!myUid) return;

        const response = await contactEditRef.current?.saveContacts();
        console.log(response);

        if (response?.error) {
          console.log(response.error);
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
          .then((res) => {
            setLoading(false);
            if (res.error) {
              console.log(res.error);
              return;
            }
            setProfile(profile);
            dispatch(setName(profile?.full_name));
            dispatch(setUserData(profile));
            console.log(res);
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
      return () => { };
    }, [dispatch, myUid, profile, usernameAvailable]),
  );
  useFocusEffect(
    useCallback(() => {
      load();
      return () => { };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myUid]),
  );
  const pickImage = async () => {
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      base64: true,
    }).catch((error) => {
      console.log(error);
    });

    if (result && !result?.canceled) {
      console.log(result);

      setProfile({ ...profile, avatar_url: "" });
      setImageLoading(true);
      uploadImage(result.assets[0]).then((res) => {
        setProfile({ ...profile, avatar_url: res });
        setImageLoading(false);
      });
    } else console.log("cancelled");
  };
  const uploadImage = async (image: ExpoImagePicker.ImagePickerAsset) => {
    if (!image || !image.fileName) return;

    const response = await fetch(image.uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    const upload = await supabase.storage
      .from("avatars")
      .upload(myUid + "/" + image.fileName, arrayBuffer, {
        contentType: image.mimeType,
        upsert: true,
      })
      .then(async ({ data, error }) => {
        console.log("upload", data);
        if (error)
          console.log(error);

        if (data?.path && myUid)
          supabase
            .from("profiles")
            .upsert(
              {
                avatar_url: image.fileName,
                id: myUid,
              },
              { onConflict: "id" },
            )
            .then((res) => {
              console.log("profile upsert", res);
            });

        return image.fileName;
      })
      .catch((error) => {
        return error;
      });

    return upload;
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

      dispatch(logout());
      dispatch(clearBuziness());
      dispatch(clearTutorialState());
      dispatch(clearBuzinessSearchParams());
      router.navigate("/user/deleted-account");
    } catch (error) {
      console.error("Unexpected error:", error);
      dispatch(addSnack({ title: "Váratlan hiba történt. Kérlek próbáld újra később." }));
    } finally {
      setDeleteLoading(false);
    }
  };
  
  if (myUid)
    return (
      <ThemedView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 8 }}>
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View style={{ width: 100 }}>
              <ProfileImage
                key={profile?.avatar_url}
                uid={myUid}
                avatar_url={profile?.avatar_url}
                propLoading={imageLoading}
                style={{
                  width: 100,
                  height: 100,
                }}
              />
              <IconButton
                icon="upload"
                onPress={pickImage}
                mode="contained-tonal"
                style={{ position: "absolute", right: 0, bottom: 0 }}
              />
            </View>
          </View>
          <TextInput
            label="Teljes név* (kötelező)"
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
            style={{ marginTop: 8 }}
          />
          <View style={{ padding: 16 }}>
            <ThemedText type="label">Email, amivel regisztráltál:</ThemedText>
            <ThemedText>{userData?.email}</ThemedText>
          </View>
          <Divider />
          <View style={{ gap: 8, paddingTop: 8 }}>
            <ThemedText type="subtitle">Elérhetőségeid</ThemedText>
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
            <ThemedText type="subtitle">Veszélyzóna</ThemedText>
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
          <Portal>
            <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
              <Dialog.Title>Profil végleges törlése</Dialog.Title>
              <Dialog.Content>
                <ThemedText>
                  Biztosan törölni szeretnéd a profilodat? Ez a művelet nem visszavonható.
                </ThemedText>
                <View style={{ height: 8 }} />
                <ThemedText>
                  A megerősítéshez írd be az alábbi email címet: {userData?.email}
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
      </ThemedView>
    );
}
