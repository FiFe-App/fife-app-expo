import { Image, ImageStyle } from "expo-image";
import { useAppTheme } from "@/assets/theme";
import { StyleProp } from "react-native";

interface LogoProps {
  style?: StyleProp<ImageStyle>;
}

export function Logo({ style }: LogoProps) {
  const theme = useAppTheme();
  const source =
    theme.dark
      ? require("@/assets/logo-dark.png")
      : require("@/assets/logo-light.png");

  return (
    <Image
      source={source}
      style={style}
      contentFit="contain"
    />
  );
}
