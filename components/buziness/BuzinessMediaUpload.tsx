import { Spacing } from "@/constants/spacing";
import getMediaKind from "@/lib/functions/getMediaKind";
import { supabase } from "@/lib/supabase/supabase";
import { addSnack } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { MediaDataType, MediaKindType, UserState } from "@/redux/store.type";
import * as DocumentPicker from "expo-document-picker";
import { File as FileSystemFile } from "expo-file-system";
import * as ExpoImagePicker from "expo-image-picker";
import { useImperativeHandle, useState } from "react";
import { Platform, ScrollView, useWindowDimensions, View } from "react-native";
import { IconButton, Text, TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import MediaView from "../media/MediaView";
import { ThemedText } from "../ThemedText";

/** Supabase storage rejects bigger uploads, so stop them before they start. */
const MAX_MEDIA_SIZE = 50 * 1024 * 1024;

const DEFAULT_MIME_TYPE: Record<MediaKindType, string> = {
  image: "image/jpeg",
  video: "video/mp4",
  audio: "audio/mpeg",
};
const DEFAULT_EXTENSION: Record<MediaKindType, string> = {
  image: "jpg",
  video: "mp4",
  audio: "mp3",
};
const DESCRIPTION_PLACEHOLDER: Record<MediaKindType, string> = {
  image: "Mesélj erről a képről",
  video: "Mesélj erről a videóról",
  audio: "Mesélj erről a hangfelvételről",
};

// Storage keys travel through URLs, so keep them to plain characters.
const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const getFileName = (media: MediaDataType, kind: MediaKindType) => {
  const name =
    media.fileName ||
    media.uri.split("?")[0].split("/").pop() ||
    `${kind}_${Date.now()}`;
  const sanitized = sanitizeFileName(name);
  return sanitized.includes(".")
    ? sanitized
    : `${sanitized}.${DEFAULT_EXTENSION[kind]}`;
};

export interface BuzinessMediaUploadHandle {
  uploadMedia: (buzinessId: number) => Promise<MediaDataType[]>;
}
interface BuzinessMediaUploadProps {
  media: MediaDataType[];
  setMedia: (media: MediaDataType[]) => void;
  buzinessId?: number;
  ref?: React.Ref<BuzinessMediaUploadHandle>;
}

const BuzinessMediaUpload = ({
  media,
  setMedia,
  buzinessId,
  ref,
}: BuzinessMediaUploadProps) => {
  useImperativeHandle(ref, () => ({
    uploadMedia: async (buzinessId: number) => {
      const uploadPromises = media.map(async (i) => {
        let path = i.path;
        if (i.status === "toDelete") {
          path = "";
          await deleteMedia(i);
        }
        if (i.status === "toUpload") path = await uploadMedia(i, buzinessId);
        return { ...i, path };
      });
      return Promise.all(uploadPromises);
    },
  }));
  const { width: w } = useWindowDimensions();
  const width = w * 0.8;
  const dispatch = useDispatch();
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const [loading, setLoading] = useState(false);

  const addMedia = (newMedia: MediaDataType) => {
    if (newMedia.fileSize && newMedia.fileSize > MAX_MEDIA_SIZE) {
      dispatch(
        addSnack({
          title: `A fájl túl nagy, legfeljebb ${Math.round(
            MAX_MEDIA_SIZE / 1024 / 1024,
          )} MB tölthető fel.`,
        }),
      );
      return;
    }
    setMedia([...media, newMedia]);
  };

  const pickImageOrVideo = async (kind: "image" | "video") => {
    setLoading(true);
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === "image" ? ["images"] : ["videos"],
      allowsEditing: kind === "image",
      quality: 1,
      // Videos are far too big to keep in memory as base64.
      base64: kind === "image",
    }).catch((error) => {
      console.log(error);
    });

    if (result && !result.canceled) {
      const asset = result.assets[0];
      addMedia({
        ...asset,
        mediaType: kind,
        url: asset.uri,
        path: "",
        status: "toUpload",
      });
    } else console.log("cancelled");
    setLoading(false);
  };

  const pickAudio = async () => {
    setLoading(true);
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
      multiple: false,
      base64: false,
    }).catch((error) => {
      console.log(error);
    });

    if (result && !result.canceled) {
      const asset = result.assets[0];
      addMedia({
        uri: asset.uri,
        width: 0,
        height: 0,
        fileName: asset.name,
        fileSize: asset.size,
        mimeType: asset.mimeType,
        mediaType: "audio",
        url: asset.uri,
        path: "",
        status: "toUpload",
      });
    } else console.log("cancelled");
    setLoading(false);
  };

  const getUploadData = async (
    item: MediaDataType,
  ): Promise<Uint8Array | Blob> => {
    if (item.base64) {
      // Use base64 directly — avoids fetch failures on iOS temp file URIs.
      // Pass Uint8Array (ArrayBufferView), not .buffer — ArrayBuffer can be
      // detached crossing the Hermes JSI bridge on iOS.
      const b64 = item.base64.replace(/\s/g, ""); // strip any line breaks
      const binaryString = atob(b64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    if (Platform.OS === "web") {
      const response = await fetch(item.uri);
      return response.blob();
    }
    // Videos and audio carry no base64, and reading the file directly works
    // where fetch() fails on iOS temp file URIs.
    return new FileSystemFile(item.uri).bytes();
  };

  const uploadMedia = async (item: MediaDataType, buzinessId: number) => {
    if (!buzinessId || !item) return "";

    const kind = getMediaKind(item);
    const fileName = getFileName(item, kind);
    const mimeType = item.mimeType || DEFAULT_MIME_TYPE[kind];

    const uploadData = await getUploadData(item).catch((error) => {
      console.error("Read error:", error);
      return null;
    });
    if (!uploadData) {
      dispatch(
        addSnack({ title: `A(z) ${fileName} beolvasása nem sikerült.` }),
      );
      return "";
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

    if (upload?.error)
      dispatch(addSnack({ title: `A(z) ${fileName} feltöltése nem sikerült.` }));

    return upload?.data?.path;
  };
  const deleteMedia = async (item: MediaDataType) => {
    const deleteRes = await supabase.storage
      .from("buzinessImages")
      .remove([decodeURIComponent(item.path)]);
    console.log(deleteRes);
    if (deleteRes.data?.length)
      setMedia(media.filter((i) => i.path !== item.path));
    return;
  };
  const toDeleteMedia = async (ind: number, undo?: boolean) => {
    console.log("delete", buzinessId, media[ind], ind);

    if (buzinessId) {
      setMedia(
        media
          .filter((i, ind2) => i.path || ind2 !== ind)
          .map((i, ind2) =>
            ind2 !== ind ? i : { ...i, status: undo ? "uploaded" : "toDelete" },
          ) as MediaDataType[],
      );
    }
  };
  return (
    <View>
      <ThemedText style={{ padding: 8 }}>
        Képek, videók és hangok feltöltése
      </ThemedText>
      <ScrollView
        horizontal
        contentContainerStyle={{ alignItems: "center", gap: 4 }}
      >
        {media.map((item, ind) => {
          const kind = getMediaKind(item);
          return (
            <View
              key={"media-" + ind}
              style={{
                width: width,
                backgroundColor:
                  item.status === "toDelete" ? "red" : "transparent",
              }}
            >
              {item.status === "toDelete" && (
                <>
                  <ThemedText
                    style={{
                      position: "absolute",
                      top: 100,
                      width,
                      zIndex: 10,
                      textAlign: "center",
                      color: "white",
                    }}
                  >
                    Törlésre kijelölve
                  </ThemedText>
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width,
                      height: 200,
                      zIndex: 1,
                      backgroundColor: "#ff000066",
                    }}
                  />
                </>
              )}
              <MediaView media={item} width={width} height={200} />
              <TextInput
                style={{ width: width }}
                value={media[ind]?.description || ""}
                multiline
                placeholder={DESCRIPTION_PLACEHOLDER[kind]}
                onChangeText={(text) => {
                  setMedia(
                    media.map((i, ind2) => {
                      return ind2 === ind ? { ...i, description: text } : i;
                    }),
                  );
                }}
              />
              <IconButton
                mode="contained-tonal"
                icon={item.status === "toDelete" ? "delete-off" : "delete"}
                onPress={() => {
                  toDeleteMedia(ind, item.status === "toDelete");
                }}
                style={{ position: "absolute", zIndex: 2, top: 0, right: 0 }}
              />
            </View>
          );
        })}
        <View style={{ gap: Spacing.xs, paddingHorizontal: Spacing.xs }}>
          {(
            [
              { kind: "image", icon: "image-plus", label: "Kép" },
              { kind: "video", icon: "video-plus", label: "Videó" },
              { kind: "audio", icon: "music-note-plus", label: "Hang" },
            ] as const
          ).map((option) => (
            <View key={option.kind} style={{ alignItems: "center" }}>
              <IconButton
                icon={option.icon}
                mode="contained"
                iconColor="black"
                disabled={loading}
                accessibilityLabel={`${option.label} hozzáadása`}
                onPress={() =>
                  option.kind === "audio"
                    ? pickAudio()
                    : pickImageOrVideo(option.kind)
                }
              />
              <Text variant="labelSmall">{option.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
export default BuzinessMediaUpload;
