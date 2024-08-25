import { ImageProps, StyleProp } from "react-native";
import SupabaseImage from "../SupabaseImage";

interface ProfileImageProps {
  uid: string;
  style?: StyleProp<ImageProps>;
}

const ProfileImage = ({ uid, style }: ProfileImageProps) => {
  return (
    <SupabaseImage path={"profiles/" + uid + "/profile.jpg"} style={style} />
  );
};

export default ProfileImage;
