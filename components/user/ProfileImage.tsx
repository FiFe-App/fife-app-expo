import { ImageProps, StyleProp } from "react-native";
import FirebaseImage from "../FirebaseImage";

interface ProfileImageProps {
  uid: string;
  style?: StyleProp<ImageProps>;
}

const ProfileImage = ({ uid, style }: ProfileImageProps) => {
  return (
    <FirebaseImage path={"profiles/" + uid + "/profile.jpg"} style={style} />
  );
};

export default ProfileImage;
