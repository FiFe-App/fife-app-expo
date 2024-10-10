import SupabaseImage from "@/components/SupabaseImage";
import { ThemedView } from "@/components/ThemedView";
import ProfileImage from "@/components/user/ProfileImage";
import { Tables } from "@/database.types";
import { RootState } from "@/lib/redux/store";
import { BuzinessSearchItemInterface, UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { Image } from "expo-image";
import * as ExpoImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { View } from "react-native";
import { Button, IconButton, TextInput } from "react-native-paper";
import { useSelector } from "react-redux";

type UserInfo = Tables<"profiles">;
type UserDraft = Partial<UserInfo>;

export default function Index() {
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [profile, setProfile] = useState<UserInfo>({});
  const imageRef = useRef();

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
      load();
      return () => {};
    }, [myUid]),
  );
  const save = () => {
    setLoading(true);
    if (!myUid) return;

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
        console.log(res);
        router.navigate("/user");
      });
  };
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

  console.log("profile", profile.avatar_url);
  if (myUid)
    return (
      <ThemedView style={{ flex: 1 }}>
        <View style={{ alignItems: "center" }}>
          <SupabaseImage
            key={profile.avatar_url}
            bucket="avatars"
            path={myUid + "/" + profile.avatar_url}
            propLoading={imageLoading}
            style={{
              width: 100,
              height: 100,
              borderRadius: 12,
            }}
          />
          <IconButton icon="upload" onPress={pickImage} />
        </View>
        <TextInput
          placeholder="Teljes név"
          value={profile.full_name}
          disabled={loading}
          onChangeText={(t) => setProfile({ ...profile, full_name: t })}
        />
        <Button onPress={save} loading={loading}>
          Profilod mentése
        </Button>
      </ThemedView>
    );
}
