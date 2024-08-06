import { Image, ImageContentFit } from "expo-image";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { ImageStyle, StyleProp, StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";

interface FirebaseImageProps {
  path: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageContentFit | undefined;
}

const FirebaseImage = ({ path, style, resizeMode }: FirebaseImageProps) => {
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storage = getStorage();
    const imageRef = ref(storage, path);
    getDownloadURL(imageRef)
      .then((res) => {
        setSource(res);
      })
      .catch((err) => {
        setLoading(false);
      });
  }, [path]);

  return (
    <View style={{}}>
      <Image
        source={{ uri: source }}
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

export default FirebaseImage;
