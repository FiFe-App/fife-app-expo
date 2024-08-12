import { supabase } from "@/lib/supabase/supabase";
import { Image, ImageContentFit } from "expo-image";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { ImageStyle, StyleProp, StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";

interface SupabaseImageProps {
  path: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageContentFit | undefined;
}

const SupabaseImage = ({ path, style, resizeMode }: SupabaseImageProps) => {
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getImage = async () => {
      const res = await supabase.storage.from("comments").getPublicUrl(path);
      return res;
    };

    getImage()
      .then(({ data }) => {
        setSource(data.publicUrl);
      })
      .catch((err) => {
        setLoading(false);
      });
  }, [path]);

  return (
    <View style={{}}>
      <Image
        source={source}
        style={style}
        contentFit={resizeMode}
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
      <ActivityIndicator style={styles.activityIndicator} animating={loading} />
    </View>
  );
};
const styles = StyleSheet.create({
  activityIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});

export default SupabaseImage;
