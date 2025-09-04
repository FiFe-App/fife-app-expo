import { Image } from "expo-image";
import { useRef } from "react";
import { Animated, Pressable, View, ViewStyle } from "react-native";

const Smiley = ({ style }: { style?: ViewStyle }) => {
  const size = useRef(new Animated.Value(1)).current;

  const handleGrow = () => {
    if (size._value > 40)
      Animated.timing(size, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    else
      Animated.timing(size, {
        toValue: size._value * 2,
        duration: 1000,
        useNativeDriver: false,
      }).start();
  };
  return (
    <View style={[{ position: "relative" }, style]}>
      <Animated.View // Special animatable View
        style={[
          {
            position: "absolute",
            transform: [{ scale: size }],
            transformOrigin: "50% 30%",
            zIndex: 100,
          },
          style,
        ]}
      >
        <Pressable onPress={handleGrow}>
          <Image
            source={require("../assets/smiley.gif")}
            style={[{ width: 50, height: 50, zIndex: 20 }, style]}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default Smiley;
