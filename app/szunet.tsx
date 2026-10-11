import { useEffect, useState } from "react";
import { AppState, BackHandler } from "react-native";
import { usePreventRemove } from "@react-navigation/native";
import { router, Stack } from "expo-router";
import { Button } from "@/components/Button";
import CenteredTimer, { useNow } from "@/components/focus/CenteredTimer";
import { formatRemaining } from "@/lib/focus/pomodoro";

const DURATIONS_MIN = [15, 30, 60];

const leave = () => (router.canGoBack() ? router.back() : router.replace("/me"));

/**
 * A break the user is locked into: once started there is no header, no bottom
 * navigation, and back does nothing until the time is up. Switching to another
 * app ends it.
 */
export default function BreakScreen() {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const now = useNow(endsAt !== null);
  const remaining = endsAt === null ? 0 : endsAt - now;
  const running = endsAt !== null && remaining > 0;
  const finished = endsAt !== null && remaining <= 0;

  // Back gesture, header back and router calls from elsewhere.
  usePreventRemove(running, () => {});

  // Android hardware back.
  useEffect(() => {
    if (!running) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [running]);

  // Leaving the app ends the break. "inactive" (iOS control centre, incoming
  // call banner) is not leaving.
  useEffect(() => {
    if (!running) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") setEndsAt(null);
    });
    return () => sub.remove();
  }, [running]);

  // The header (and its back button) is only there while no break is running.
  const header = <Stack.Screen options={{ headerShown: !running, gestureEnabled: !running }} />;

  if (endsAt === null) {
    return (
      <CenteredTimer time="00:00">
        {header}
        {DURATIONS_MIN.map((min) => (
          <Button key={min} mode="text" onPress={() => setEndsAt(Date.now() + min * 60 * 1000)}>
            {`${min} perc`}
          </Button>
        ))}
      </CenteredTimer>
    );
  }

  return (
    <CenteredTimer time={formatRemaining(remaining)}>
      {header}
      {finished && <Button mode="text" onPress={leave}>Kész</Button>}
    </CenteredTimer>
  );
}
