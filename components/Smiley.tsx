import { Image } from "expo-image";
import { useRef } from "react";
import { Animated, Platform, Pressable, View, ViewStyle } from "react-native";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppMode } from "@/lib/mode/appMode";

const enModSmiley = require("@/assets/smiley.gif");
const miModSmiley = require("@/assets/gifs/community_logo.gif");

const Smiley = ({ style }: { style?: ViewStyle }) => {
  const size = useRef(new Animated.Value(1)).current;
  const mode = useAppMode();

  const handleGrow = () => {
    size.stopAnimation((currentValue: number) => {
      if (currentValue > 2)
        Animated.timing(size, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      else
        Animated.timing(size, {
          toValue: currentValue * 2,
          duration: 1000,
          useNativeDriver: false,
        }).start();
    });
  };
  return (
    <View style={[{ position: "relative", width: 40, height: 40, borderRadius: BorderRadius.xs }, style]}>
      <Animated.View // Special animatable View
        style={[
          {
            ...Platform.select({
              web: { position: "fixed" as const },
              default: { position: "absolute" as const },
            }),
            transform: [{ scale: size }],
            transformOrigin: "50% 30%",
            zIndex: 10000,
          },
          style,
        ]}
      >
        <Pressable onPress={handleGrow}>
          <Image
            source={mode == "en" ? enModSmiley : miModSmiley}
            style={[{ width: 40, height: 40, zIndex: 20, borderRadius: mode == "en" ? BorderRadius.sm : 0 }, style]}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default Smiley;
