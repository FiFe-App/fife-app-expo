import {
  AVATARS_BUCKET,
  getAvatarPath,
  getAvatarThumbnailPath,
} from "@/lib/functions/avatarPaths";
import { supabase } from "@/lib/supabase/supabase";
import { Image, ImageContentFit } from "expo-image";
import { useEffect, useState } from "react";
import { ImageStyle, Modal, StyleProp, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";

interface ProfileImageProps {
  uid: string;
  avatar_url?: string | null;
  style?: StyleProp<ImageStyle>;
  size?: number;
  resizeMode?: ImageContentFit | undefined;
  propLoading?: boolean;
  modal?: boolean;
}

// Avatars uploaded before thumbnails existed have no small version. Remember
// which ones 404'd so the rest of the session goes straight to the original.
const avatarsWithoutThumbnail = new Set<string>();

const ProfileImage = ({
  uid,
  avatar_url,
  style,
  size,
  resizeMode,
  propLoading = false,
  modal = false,
}: ProfileImageProps) => {
  const [source, setSource] = useState("");
  const [fullSource, setFullSource] = useState("");
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!uid || !avatar_url) {
      setError("No path");
      setLoading(false);
      return;
    }

    if (avatar_url.startsWith("http")) {
      setSource(avatar_url);
      setFullSource(avatar_url);
      setError(null);
      setLoading(false);
      return;
    }

    const publicUrl = (path: string) =>
      supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path).data.publicUrl;

    const full = publicUrl(getAvatarPath(uid, avatar_url));
    const hasThumbnail = !avatarsWithoutThumbnail.has(
      getAvatarPath(uid, avatar_url),
    );

    setFullSource(full);
    // The thumbnail is enough for every inline avatar; the modal below always
    // shows the original.
    setSource(
      hasThumbnail ? publicUrl(getAvatarThumbnailPath(uid, avatar_url)) : full,
    );
    setError(null);
    setLoading(false);
  }, [uid, avatar_url]);

  const handleError = () => {
    if (source && fullSource && source !== fullSource) {
      if (uid && avatar_url)
        avatarsWithoutThumbnail.add(getAvatarPath(uid, avatar_url));
      setSource(fullSource);
      return;
    }
    setLoading(false);
    setSource("");
    setError("Load failed");
  };

  return (
    <View
      style={style}>
      {!!source &&
        (modal ? (
          <>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setModalVisible(true)}>
              <Image
                source={source}
                style={style}
                cachePolicy="memory-disk"
                contentFit={resizeMode ?? "cover"}
                onLoadEnd={() => setLoading(false)}
                onError={handleError}
              />
            </TouchableOpacity>
            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
              <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)}>
                <Image
                  source={fullSource || source}
                  style={styles.modalImage}
                  contentFit="contain"
                />
              </TouchableOpacity>
            </Modal>
          </>
        ) : (
          <Image
            source={source}
            style={style}
            cachePolicy="memory-disk"
            contentFit={resizeMode}
            onLoadEnd={() => setLoading(false)}
            onError={handleError}
          />
        ))}
      {(loading || propLoading) && (
        <ActivityIndicator
          style={[styles.activityIndicator, { width: "100%", height: "100%" }]}
          animating={loading || propLoading}
        />
      )}
      {error && !source && (
        <Image source={require("@/assets/images/Slimey.png")} style={style} />
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  activityIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
});

export default ProfileImage;
