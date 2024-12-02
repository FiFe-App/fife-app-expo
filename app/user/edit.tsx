import { ContactList } from "@/components/buziness/ContactList";
import ProfileImage from "@/components/ProfileImage";
import { ThemedView } from "@/components/ThemedView";
import { Tables } from "@/database.types";
import { setOptions } from "@/redux/reducers/infoReducer";
import { setName, setUserData } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import * as ExpoImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { IconButton, Text, TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { ThemedText } from "@/components/ThemedText";

type UserInfo = Partial<Tables<"profiles">>;

export default function Index() {
  const {
    uid: myUid,
    name,
    userData,
  }: UserState = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [profile, setProfile] = useState<UserInfo>({});
  const dispatch = useDispatch();

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
      const save = () => {
        setLoading(true);
        if (!myUid) return;

        console.log({
          ...profile,
          id: myUid,
        });

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
            disabled: !profile?.full_name,
          },
        ]),
      );
      return () => {};
    }, [dispatch, myUid, profile]),
  );
  useFocusEffect(
    useCallback(() => {
      load();
      return () => {};
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myUid]),
  );
  const pickImage = async () => {
    let result = await ExpoImagePicker.launchImageLibraryAsync({
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
          label="Teljes név"
          value={profile?.full_name || ""}
          disabled={loading}
          onChangeText={(t) => setProfile({ ...profile, full_name: t })}
        />
        <View style={{ padding: 16 }}>
          <ThemedText type="label">Email</ThemedText>
          <ThemedText>{userData?.email}</ThemedText>
        </View>
      </ThemedView>
    );
}
