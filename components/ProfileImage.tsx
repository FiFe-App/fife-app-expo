import { supabase } from "@/lib/supabase/supabase";
import { Image, ImageContentFit } from "expo-image";
import { useEffect, useState } from "react";
import { ImageStyle, StyleProp, StyleSheet, View } from "react-native";
import ImageModal from "react-native-image-modal";
import { ActivityIndicator, Icon } from "react-native-paper";

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
    <View>
      {!!source &&
        (!modal ? (
          <Image
            source={source}
            style={style}
            cachePolicy="memory-disk"
            contentFit={resizeMode}
            onLoadEnd={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        ) : (
          <ImageModal
            resizeMode="cover"
            modalImageResizeMode="contain"
            overlayBackgroundColor="#00000088"
            style={style}
            source={{ uri: source }}
          />
        ))}
      {(loading || propLoading) && (
        <ActivityIndicator
          style={[styles.activityIndicator, { width: "100%", height: "100%" }]}
          animating={loading || propLoading}
        />
      )}
      {error && !source && (
        <View
          style={[style, { alignItems: "center", justifyContent: "center" }]}
        >
          <Image source={require('@/assets/images/Slimey.png')} style={style} />
        </View>
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
});

export default ProfileImage;
