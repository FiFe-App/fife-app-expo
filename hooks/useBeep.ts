import { useCallback } from "react";
import { useAudioPlayer } from "expo-audio";

/** A short two-tone beep for the Fókusz/Szünet timers. Never throws. */
export function useBeep() {
  const player = useAudioPlayer(require("@/assets/sounds/beep.wav"));
  return useCallback(() => {
    const play = () => {
      try {
        player.play();
      } catch (err) {
        console.warn("Could not play the beep:", err);
      }
    };
    // Rewind first: after the first beep the player sits at the end.
    Promise.resolve()
      .then(() => player.seekTo(0))
      .catch(() => {})
      .then(play);
  }, [player]);
}
