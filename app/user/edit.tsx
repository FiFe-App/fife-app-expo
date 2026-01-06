import ContactEditScreen from "@/components/buziness/ContactEditScreen";
import ProfileImage from "@/components/ProfileImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import UsernameInput from "@/components/UsernameInput";
import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { setOptions } from "@/redux/reducers/infoReducer";
import { setName, setUserData } from "@/redux/reducers/userReducer";
import { setLanguage } from "@/redux/reducers/languageReducer";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import * as ExpoImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState, useEffect } from "react";
import { ScrollView, View } from "react-native";
import {
  Divider,
  HelperText,
  Icon,
  IconButton,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type UserInfo = Partial<Tables<"profiles">>;

export default function Index() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { uid: myUid, userData }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [profile, setProfile] = useState<UserInfo>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | undefined>(undefined);
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
        if (data && data[0]) {
          setProfile(data[0]);
          console.log(data);
          
          // Load language preference from profile if available
          const profileData = data[0] as any;
          const profileLanguage = profileData.language;
          if (profileLanguage === "en" || profileLanguage === "hu") {
            dispatch(setLanguage(profileLanguage));
            i18n.changeLanguage(profileLanguage);
          }
          
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
            title: t("profile.edit.save"),
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
            label={t("profile.edit.fullName")}
            value={profile?.full_name || ""}
            disabled={loading}
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={(t) => setProfile({ ...profile, full_name: t })}
          />
          <UsernameInput
            label={t("profile.edit.username")}
            value={profile?.username || ""}
            disabled={loading}
            excludeUid={myUid}
            onAvailabilityChange={setUsernameAvailable}
            onChangeText={(t) => setProfile({ ...profile, username: t })}
            style={{ marginTop: 8 }}
          />
          <View style={{ padding: 16 }}>
            <ThemedText type="label">{t("profile.edit.emailLabel")}</ThemedText>
            <ThemedText>{userData?.email}</ThemedText>
          </View>
          <Divider />
          <View style={{ gap: 8, paddingTop: 8, paddingBottom: 8 }}>
            <ThemedText type="subtitle">{t("settings.language")}</ThemedText>
            <View style={{ paddingHorizontal: 16 }}>
              <LanguageSwitcher />
            </View>
          </View>
          <Divider />
          <View style={{ gap: 8, paddingTop: 8 }}>
            <ThemedText type="subtitle">{t("profile.edit.contactsTitle")}</ThemedText>
            <View style={{ alignItems: "center" }}>
              <Icon source="alert" size={24} color={theme.colors.error} />
              <HelperText type="error" style={{ textAlign: "center" }}>
                {t("profile.edit.contactsWarning")}
              </HelperText>
            </View>
            <ContactEditScreen ref={contactEditRef} />
          </View>
        </ScrollView>
      </ThemedView>
    );
}
