import React from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Icon, useTheme } from "react-native-paper";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

/** How far the message follows the finger. */
const MAX_DRAG = 72;
/** Let go past this and it is a reply. */
const TRIGGER = 56;

interface SwipeToReplyProps {
  /** Off where replying is not possible, e.g. a group the user has not joined. */
  enabled: boolean;
  onReply: () => void;
  children: React.ReactNode;
}

/**
 * Drag a message to the right to reply to it, the way most chat apps do. The
 * message springs back when let go; a reply arrow fades in behind it as the
 * drag nears the trigger point.
 *
 * Only a clearly horizontal drag starts it — anything vertical is left to the
 * list, so scrolling is not affected.
 */
export function SwipeToReply({ enabled, onReply, children }: SwipeToReplyProps) {
  const theme = useTheme();
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX(16)
    .failOffsetX(-16)
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      translateX.value = Math.min(Math.max(e.translationX, 0), MAX_DRAG);
    })
    .onEnd(() => {
      if (translateX.value >= TRIGGER) runOnJS(onReply)();
    })
    .onFinalize(() => {
      translateX.value = withSpring(0, { damping: 20, stiffness: 250 });
    });

  const messageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [16, TRIGGER], [0, 1], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(translateX.value, [16, TRIGGER], [0.6, 1], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View>
        <Animated.View style={[styles.icon, iconStyle]} pointerEvents="none">
          <Icon source="reply" size={22} color={theme.colors.primary} />
        </Animated.View>
        <Animated.View style={messageStyle}>{children}</Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  icon: {
    position: "absolute",
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
});
