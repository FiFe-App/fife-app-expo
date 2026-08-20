import { useAppTheme } from "@/assets/theme";
import getSignedUrl from "@/lib/functions/getSignedUrl";
import { supabase } from "@/lib/supabase/supabase";
import { Image, ImageContentFit } from "expo-image";
import { useEffect, useState } from "react";
import { ImageStyle, StyleProp, StyleSheet, View } from "react-native";
import ImageModal from "react-native-image-modal";
import { ActivityIndicator } from "react-native-paper";

interface SupabaseImageProps {
  bucket: string;
  path?: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageContentFit | undefined;
  propLoading?: boolean;
  modal?: boolean;
  /** Needed for private buckets, where there is no public URL to read. */
  signed?: boolean;
}

const SupabaseImage = ({
  bucket,
  path,
  style,
  resizeMode,
  propLoading = false,
  modal = false,
  signed = false,
}: SupabaseImageProps) => {
  const theme = useAppTheme();
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("image loaded", path);

    const getImage = async () => {
      if (!path) return null;
      if (signed) return getSignedUrl(bucket, path);
      return supabase.storage.from(bucket).getPublicUrl(path).data?.publicUrl;
    };

    getImage()
      .then((url) => {
        if (url) setSource(url);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [bucket, path, signed]);

  return (
    <View>
      {!modal ? (
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
          overlayBackgroundColor={theme.colors.backdrop}
          style={style}
          source={{ uri: source }}
        />
      )}
      {(loading || propLoading) && (
        <ActivityIndicator
          style={[styles.activityIndicator, { width: "100%", height: "100%" }]}
          animating={loading || propLoading}
        />
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

export default SupabaseImage;
