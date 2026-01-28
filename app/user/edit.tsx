import ContactEditScreen from "@/components/buziness/ContactEditScreen";
import ProfileImage from "@/components/ProfileImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import UsernameInput from "@/components/UsernameInput";
import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { setOptions } from "@/redux/reducers/infoReducer";
import { setName, setUserData, setThemePreference } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import * as ExpoImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ScrollView, View, Pressable } from "react-native";
import {
  Divider,
  HelperText,
  Icon,
  IconButton,
  Menu,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

type UserInfo = Partial<Tables<"profiles">>;

export default function Index() {
  const theme = useTheme();
  const { uid: myUid, userData, themePreference }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [profile, setProfile] = useState<UserInfo>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | undefined>(undefined);
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);
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
          <View style={{ padding: 16 }}>
            <Menu
              visible={themeMenuVisible}
              onDismiss={() => setThemeMenuVisible(false)}
              anchor={
                <Pressable onPress={() => setThemeMenuVisible(true)}>
                  <View pointerEvents="none">
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
                    />
                  </View>
                </Pressable>
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
        </ScrollView>
      </ThemedView>
    );
}
