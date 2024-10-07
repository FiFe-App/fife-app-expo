import { ImageProps, StyleProp } from "react-native";
import SupabaseImage from "../SupabaseImage";
import { forwardRef, useEffect, useImperativeHandle, useReducer } from "react";

interface ProfileImageProps {
  uid?: string;
  style?: StyleProp<ImageProps>;
  loading?: boolean;
}

const ProfileImage = forwardRef(
  ({ uid, style, loading }: ProfileImageProps, ref) => {
    const [, forceUpdate] = useReducer((x) => x + 1, 0);

    const publicRef = {
      forceUpdate,
    };
    useImperativeHandle(ref, () => publicRef);
    return (
      <SupabaseImage
        loading={loading}
        bucket="avatars"
        path={uid + "/profile.jpg"}
        style={style}
      />
    );
  },
);
ProfileImage.displayName = "ProfileImage";

export default ProfileImage;
