import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { ImageDataType, UserState } from "@/redux/store.type";
import * as ExpoImagePicker from "expo-image-picker";
import { forwardRef, useImperativeHandle, useState } from "react";
import { ScrollView, View } from "react-native";
import ImageModal from "react-native-image-modal";
import { IconButton, TextInput } from "react-native-paper";
import { useSelector } from "react-redux";
import { ThemedText } from "../ThemedText";

export interface BuzinessImageUploadHandle {
  uploadImages: (buziessId: number) => Promise<ImageDataType[]>;
}
interface BuzinessImageUploadProps {
  images: ImageDataType[];
  setImages: (images: ImageDataType[]) => void;
  buzinessId?: number;
}

const BuzinessImageUpload = forwardRef<
  BuzinessImageUploadHandle,
  BuzinessImageUploadProps
>(({ images, setImages, buzinessId }, ref) => {
  useImperativeHandle(ref, () => ({
    uploadImages: async (buzinessId: number) => {
      const uploadPromises = images.map(async (i) => {
        let path = i.path;
        if (i.status === "toDelete") {
          path = "";
          await deleteImage(i, buzinessId);
        }
        if (i.status === "toUpload") path = await uploadImage(i, buzinessId);
        return { ...i, path };
      });
      return Promise.all(uploadPromises);
    },
  }));
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    setLoading(true);
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
      setImages([
        ...images,
        {
          ...result.assets[0],
          url: result.assets[0].uri,
          path: "",
          status: "toUpload",
        },
      ]);
    } else console.log("cancelled");
    setLoading(false);
  };
  const uploadImage = async (
    image: ExpoImagePicker.ImagePickerAsset,
    buzinessId: number,
  ) => {
    if (!buzinessId || !image || !image.fileName) return;

    const response = await fetch(image.uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    const upload = await supabase.storage
      .from("buzinessImages")
      .upload(myUid + "/" + buzinessId + "/" + image.fileName, arrayBuffer, {
        contentType: image.mimeType,
      })
      .then(async (res) => {
        console.log(res);
        return res;
      })
      .catch((error) => {
        return error;
      });

    return upload?.data?.path;
  };
  const deleteImage = async (image: ImageDataType, buzinessId: number) => {
    const deleteRes = await supabase.storage
      .from("buzinessImages")
      .remove([decodeURIComponent(image.path)]);
    console.log(deleteRes);
    if (deleteRes.data?.length)
      setImages(images.filter((i) => i.path !== image.path));
    return;
  };
  const toDeleteImage = async (ind: number) => {
    console.log("delete", buzinessId, images[ind], ind);

    if (buzinessId) {
      setImages(
        images
          .filter((i, ind2) => i.path || ind2 !== ind)
          .map((i, ind2) =>
            ind2 !== ind ? i : { ...i, status: "toDelete" },
          ) as ImageDataType[],
      );
    }
  };
  return (
    <View>
      <ThemedText type="label">Képek feltöltése</ThemedText>
      <ScrollView horizontal contentContainerStyle={{ alignItems: "center" }}>
        {images.map((image, ind) => {
          return (
            <View
              key={"image-" + ind}
              style={{
                backgroundColor:
                  image.status === "toDelete" ? "red" : "transparent",
              }}
            >
              <ImageModal
                source={{ uri: image.url }}
                style={{ width: 100, height: 100 }}
              />
              <TextInput
                value={images[ind]?.description || ""}
                onChangeText={(text) => {
                  setImages(
                    images.map((i, ind2) => {
                      return ind2 === ind ? { ...i, description: text } : i;
                    }),
                  );
                }}
              />
              <IconButton
                mode="contained-tonal"
                icon="close"
                onPress={() => {
                  toDeleteImage(ind);
                }}
                style={{ position: "absolute", top: 0, right: 0 }}
              />
            </View>
          );
        })}
        <IconButton icon="plus" onPress={pickImage} mode="contained-tonal" />
      </ScrollView>
    </View>
  );
});
BuzinessImageUpload.displayName = "BuzinessImageUpload";
export default BuzinessImageUpload;
