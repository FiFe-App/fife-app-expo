import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, View } from "react-native";
import { Spacing } from "@/constants/spacing";

// Edge-to-edge Android does not resize the window for the keyboard, so a
// focused input has no native way to reveal itself above it. This tracks the
// real keyboard height (to pad scroll content) and, once a focused input is
// registered, scrolls it above the keyboard when keyboardDidShow reports the
// keyboard's final position. iOS is left alone — its ScrollView already
// reveals the focused input via automaticallyAdjustKeyboardInsets.
export function useKeyboardScrollIntoView() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetY = useRef(0);
  const focusedInputRef = useRef<React.RefObject<View | null> | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      const ref = focusedInputRef.current;
      if (!ref?.current) return;
      ref.current.measureInWindow((x, y, width, height) => {
        const visibleBottom = e.endCoordinates.screenY - Spacing.md;
        const overflow = y + height - visibleBottom;
        if (overflow > 0) {
          scrollRef.current?.scrollTo({ y: scrollOffsetY.current + overflow, animated: true });
        }
      });
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetY.current = e.nativeEvent.contentOffset.y;
  }, []);

  // Pass to a TextInput's onFocus (wrapped so it receives the ref of the
  // View surrounding that input) to have it scrolled into view once the
  // keyboard finishes opening.
  const registerFocusedInput = useCallback((containerRef: React.RefObject<View | null>) => {
    focusedInputRef.current = containerRef;
  }, []);

  return { scrollRef, keyboardHeight, handleScroll, registerFocusedInput };
}
