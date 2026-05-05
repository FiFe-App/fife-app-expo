import React, { useEffect } from "react";
import { View, StyleSheet, useWindowDimensions, Pressable, useColorScheme, Platform } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  withDelay,
  useAnimatedStyle,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Image, ImageSource } from "expo-image";


const FADE_DURATION = 300;

/**
 * Delays sourced from Splash.json, mapped onto a 5×5 grid.
 */
const DELAYS: number[][] = [
  [0,       5000, 6000],
  [4000,    0,       0],
  [3000,    2000, 7000],
];

const FILES: (ImageSource|null)[][] = [
  [null,                               require("@/assets/gifs/black.gif"),  require("@/assets/gifs/brown.gif")],
  [require("@/assets/gifs/green.gif"), require("@/assets/smiley.gif"),                                null],
  [require("@/assets/gifs/red.gif"),   require("@/assets/gifs/yellow.gif"), require("@/assets/gifs/purple.gif")],
];

const COLS = DELAYS.length;

// Total time until the whole splash fades out
const LAST_START = 8000;
const DISMISS_AFTER = LAST_START + FADE_DURATION + 500; // ≈ 3360 ms

interface SplashCellProps {
  delay: number;
  size: number;
  file: ImageSource | null;
}

function SplashCell({ delay, size, file }: SplashCellProps) {
  // Web: use CSS transition via React state to avoid Reanimated SSR/hydration issues
  const [webVisible, setWebVisible] = React.useState(delay === 0);
  const opacity = useSharedValue(delay === 0 ? 1 : 0);

  useEffect(() => {
    if (delay === 0) return;
    if (Platform.OS === "web") {
      const t = setTimeout(() => setWebVisible(true), delay);
      return () => clearTimeout(t);
    }
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: FADE_DURATION,
        easing: Easing.inOut(Easing.ease),
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (Platform.OS === "web") {
    return (
      <View style={[
        { width: size, height: size, opacity: webVisible ? 1 : 0 },
        // @ts-expect-error – web-only CSS property
        { transition: `opacity ${FADE_DURATION}ms ease-in-out` },
      ]}>
        {file != null && (
          <Image source={file} style={{ width: size, height: size }} contentFit="contain" autoplay />
        )}
      </View>
    );
  }

  return (
    <Animated.View style={[{ width: size, height: size }, animStyle]}>
      {file != null && <Image
        source={file}
        style={{ width: size, height: size }}
        contentFit="contain"
        autoplay
      />}
    </Animated.View>
  );
}

interface SplashAnimationProps {
  onFinished: () => void;
}

export function SplashAnimation({ onFinished }: SplashAnimationProps) {
  const { width, height } = useWindowDimensions();
  const colorScheme = useColorScheme(); 
  
  // Cell fills the larger dimension so the grid always covers the screen
  const cellSize = Math.min(Math.max(width, height) / COLS, 100);

  const containerOpacity = useSharedValue(1);
  const [webContainerVisible, setWebContainerVisible] = React.useState(true);
  const dismissed = React.useRef(false);

  const dismiss = React.useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    if (Platform.OS === "web") {
      setWebContainerVisible(false);
      setTimeout(onFinished, 400);
      return;
    }
    containerOpacity.value = withTiming(
      0,
      { duration: 400 },
      (finished) => {
        if (finished) runOnJS(onFinished)();
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(dismiss, DISMISS_AFTER);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const bgColor = colorScheme === "dark" ? "#232323" : "#fff5e0";

  if (Platform.OS === "web") {
    return (
      <View style={[
        styles.container,
        { backgroundColor: bgColor, opacity: webContainerVisible ? 1 : 0 },
        // @ts-expect-error – web-only CSS property
        { transition: "opacity 400ms ease-in-out" },
      ]}>
        <Pressable style={[StyleSheet.absoluteFill, { zIndex: 100 }]} onPress={dismiss} />
        {DELAYS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((delay, colIndex) => (
              <SplashCell key={colIndex} delay={delay} file={FILES[rowIndex][colIndex]} size={cellSize} />
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, containerStyle, { backgroundColor: bgColor }]}>
      <Pressable style={[StyleSheet.absoluteFill,{zIndex:100}]} onPress={dismiss} />
      {DELAYS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((delay, colIndex) => (
            <SplashCell key={colIndex} delay={delay} file={FILES[rowIndex][colIndex]} size={cellSize} />
          ))}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    zIndex: 999,
    gap: 8
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
});
