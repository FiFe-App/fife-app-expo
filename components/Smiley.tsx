import { Image } from "expo-image";
import { useRef } from "react";
import { Animated, Pressable, View, ViewStyle } from "react-native";

const Smiley = ({ style }: { style?: ViewStyle }) => {
  const size = useRef(new Animated.Value(1)).current;

  const handleGrow = () => {
    size.stopAnimation((currentValue: number) => {
      if (currentValue > 40)
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
    <View style={[{ position: "relative", width: 40, height: 40, borderRadius: 4 }, style]}>
      <Animated.View // Special animatable View
        style={[
          {
            position: "fixed",
            transform: [{ scale: size }],
            transformOrigin: "50% 30%",
            zIndex: 10000,
          },
          style,
        ]}
      >
        <Pressable onPress={handleGrow}>
          <Image
            source={require("../assets/smiley.gif")}
            style={[{ width: 40, height: 40, zIndex: 20, borderRadius: 6, }, style]}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default Smiley;
