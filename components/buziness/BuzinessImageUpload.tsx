import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { ImageDataType, UserState } from "@/redux/store.type";
import * as ExpoImagePicker from "expo-image-picker";
import { useImperativeHandle, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import {
  Button,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";

const TILE_SIZE = 110;

export interface BuzinessImageUploadHandle {
  uploadImages: (buziessId: number) => Promise<ImageDataType[]>;
}
interface BuzinessImageUploadProps {
  images: ImageDataType[];
  setImages: (images: ImageDataType[]) => void;
  buzinessId?: number;
  ref?: React.Ref<BuzinessImageUploadHandle>;
}

const BuzinessImageUpload = ({
  images,
  setImages,
  buzinessId,
  ref,
}: BuzinessImageUploadProps) => {
  const theme = useAppTheme();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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
      setImages([
        ...images,
        {
          ...result.assets[0],
          url: result.assets[0].uri,
          path: "",
          status: "toUpload",
        },
      ]);
    }
  };

  const uploadImage = async (
    image: ExpoImagePicker.ImagePickerAsset,
    buzinessId: number,
  ) => {
    if (!buzinessId || !image) return;

    const fileName =
      image.fileName ||
      image.uri.split("/").pop() ||
      `image_${Date.now()}.jpg`;
    const mimeType = image.mimeType || "image/jpeg";

    let uploadData: Uint8Array | Blob;
    if (image.base64) {
      const b64 = image.base64.replace(/\s/g, "");
      const binaryString = atob(b64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      uploadData = bytes;
    } else {
      const response = await fetch(image.uri);
      uploadData = await response.blob();
    }

    const upload = await supabase.storage
      .from("buzinessImages")
      .upload(myUid + "/" + buzinessId + "/" + fileName, uploadData, {
        contentType: mimeType,
        upsert: true,
      })
      .then(async (res) => {
        console.log("storage upload result:", res);
        return res;
      })
      .catch((error) => {
        console.error("Upload error:", error);
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

  const toggleDelete = (ind: number) => {
    if (!buzinessId) {
      setImages(images.filter((_, ind2) => ind2 !== ind));
      return;
    }
    const target = images[ind];
    if (!target) return;
    if (target.status === "toUpload") {
      setImages(images.filter((_, ind2) => ind2 !== ind));
      return;
    }
    setImages(
      images.map((i, ind2) =>
        ind2 !== ind
          ? i
          : {
              ...i,
              status: i.status === "toDelete" ? "uploaded" : "toDelete",
            },
      ) as ImageDataType[],
    );
  };

  const setDescription = (ind: number, text: string) => {
    setImages(
      images.map((i, ind2) =>
        ind2 === ind ? { ...i, description: text } : i,
      ),
    );
  };

  const editingImage = editingIndex !== null ? images[editingIndex] : null;

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: Spacing.sm, paddingVertical: Spacing.xs }}
      >
        {images.map((image, ind) => {
          const isMarkedForDeletion = image.status === "toDelete";
          return (
            <View key={"image-" + ind} style={{ width: TILE_SIZE, gap: Spacing.xs }}>
              <Pressable
                onPress={() => setEditingIndex(ind)}
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  borderRadius: BorderRadius.lg,
                  overflow: "hidden",
                  backgroundColor: theme.colors.surfaceVariant,
                }}
              >
                <Image
                  source={{ uri: image.url }}
                  style={{
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    opacity: isMarkedForDeletion ? 0.35 : 1,
                  }}
                  resizeMode="cover"
                />
                {isMarkedForDeletion && (
                  <View
                    style={{
                      position: "absolute",
                      inset: 0,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      variant="labelSmall"
                      style={{
                        color: theme.colors.onError,
                        backgroundColor: theme.colors.error,
                        paddingHorizontal: Spacing.sm,
                        paddingVertical: Spacing.xs,
                        borderRadius: BorderRadius.xs,
                        overflow: "hidden",
                      }}
                    >
                      Törlésre kijelölve
                    </Text>
                  </View>
                )}
                <View
                  style={{
                    position: "absolute",
                    top: Spacing.xs,
                    right: Spacing.xs,
                    borderRadius: BorderRadius.full,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <IconButton
                    icon={isMarkedForDeletion ? "delete-off" : "close"}
                    size={14}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      toggleDelete(ind);
                    }}
                    style={{ margin: 0 }}
                    accessibilityLabel={
                      isMarkedForDeletion
                        ? "Törlés visszavonása"
                        : "Kép eltávolítása"
                    }
                  />
                </View>
              </Pressable>
              {!!image.description && (
                <Text
                  variant="labelSmall"
                  numberOfLines={2}
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {image.description}
                </Text>
              )}
            </View>
          );
        })}

        <Pressable
          onPress={pickImage}
          style={{
            width: TILE_SIZE,
            height: TILE_SIZE,
            borderRadius: BorderRadius.lg,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: theme.colors.outline,
            alignItems: "center",
            justifyContent: "center",
            gap: Spacing.xs,
            backgroundColor: theme.colors.surfaceVariant,
          }}
          accessibilityLabel="Kép hozzáadása"
        >
          <IconButton
            icon="plus"
            size={28}
            iconColor={theme.colors.onSurfaceVariant}
            style={{ margin: 0 }}
            disabled
          />
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Hozzáadás
          </Text>
        </Pressable>
      </ScrollView>

      <Portal>
        <Modal
          visible={editingIndex !== null}
          onDismiss={() => setEditingIndex(null)}
          contentContainerStyle={{
            backgroundColor: theme.colors.surface,
            marginHorizontal: Spacing.lg,
            borderRadius: BorderRadius.lg,
            padding: Spacing.lg,
            gap: Spacing.md,
          }}
        >
          {editingImage && editingIndex !== null && (
            <>
              <Image
                source={{ uri: editingImage.url }}
                style={{
                  width: "100%",
                  height: 240,
                  borderRadius: BorderRadius.md,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
                resizeMode="contain"
              />
              <TextInput
                mode="outlined"
                label="Leírás"
                placeholder="Mesélj erről a képről"
                value={editingImage.description || ""}
                onChangeText={(t) =>
                  setDescription(editingIndex, t.replace(/\r?\n/g, " "))
                }
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: Spacing.sm,
                }}
              >
                <Button
                  mode="outlined"
                  textColor={theme.colors.error}
                  icon={
                    editingImage.status === "toDelete"
                      ? "delete-off"
                      : "delete"
                  }
                  onPress={() => {
                    toggleDelete(editingIndex);
                    setEditingIndex(null);
                  }}
                >
                  {editingImage.status === "toDelete"
                    ? "Visszaállítás"
                    : "Törlés"}
                </Button>
                <Button
                  mode="contained"
                  onPress={() => setEditingIndex(null)}
                >
                  Kész
                </Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

export default BuzinessImageUpload;
