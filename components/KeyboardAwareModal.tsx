import React from "react";
import { useKeyboardState } from "react-native-keyboard-controller";
import { Modal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Height the keyboard covers, or 0 while it is hidden. */
export function useKeyboardHeight() {
  return useKeyboardState((state) => (state.isVisible ? state.height : 0));
}

/**
 * Paper's Modal centres its content in the whole screen, so the keyboard
 * covers whatever sits in the lower half. This lifts the centring area above
 * the keyboard. Use it for every modal that contains a text input.
 */
export function KeyboardAwareModal({
  style,
  ...props
}: React.ComponentProps<typeof Modal>) {
  const { bottom } = useSafeAreaInsets();
  // The modal's wrapper already leaves the bottom safe-area inset free, and
  // the keyboard height includes it.
  const lift = Math.max(0, useKeyboardHeight() - bottom);

  return <Modal {...props} style={[{ paddingBottom: lift }, style]} />;
}
