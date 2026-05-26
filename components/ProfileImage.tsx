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
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const getImage = async () => {
      if (!uid || !avatar_url) {
        setError("No path");
        return { error: "No path" };
      }
      if (avatar_url.startsWith("http")) return { data: avatar_url };
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(uid + "/" + avatar_url);
      if (!data) return { error: "No image" };
      return { data: data.publicUrl, error: null };
    };

    getImage()
      .then(({ data, error }) => {
        if (!error && data) setSource(data);
        if (error) setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [uid, avatar_url]);

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
                onError={() => { setLoading(false); setSource(""); setError("Load failed"); }}
              />
            </TouchableOpacity>
            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
              <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)}>
                <Image source={source} style={styles.modalImage} contentFit="contain" />
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
            onError={() => { setLoading(false); setSource(""); setError("Load failed"); }}
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
