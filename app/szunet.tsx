import { useEffect, useRef, useState } from "react";
import { AppState, BackHandler } from "react-native";
import { router, Stack, usePreventRemove } from "expo-router";
import { Button } from "@/components/Button";
import CenteredTimer, { useNow } from "@/components/focus/CenteredTimer";
import { useBeep } from "@/hooks/useBeep";
import { formatRemaining } from "@/lib/focus/pomodoro";
import { ensureNotificationPermission } from "@/lib/notifications/registerForPushNotifications";
import {
  cancelBreakEndNotification,
  scheduleBreakEndNotification,
} from "@/lib/notifications/scheduleFocusNotifications";

const DURATIONS_MIN = [15, 30, 60];

const INFO = {
  title: "Hogyan működik a Szünet?",
  text:
    "Válaszd ki, mennyi ideig pihensz: 15, 30 vagy 60 perc.\n\n" +
    "A szünet alatt az app bezár: nem tudsz más oldalra lépni. " +
    "Ha átváltasz egy másik alkalmazásra, a szünet véget ér.\n\n" +
    "Amikor letelik, pittyanás és értesítés jelez.",
};

const leave = () => (router.canGoBack() ? router.back() : router.replace("/me"));

/**
 * A break the user is locked into: once started there is no header, no bottom
 * navigation, and back does nothing until the time is up. Switching to another
 * app ends it.
 */
export default function BreakScreen() {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const beep = useBeep();
  const now = useNow(endsAt !== null);
  const remaining = endsAt === null ? 0 : endsAt - now;
  const running = endsAt !== null && remaining > 0;
  const finished = endsAt !== null && remaining <= 0;

  const start = async (minutes: number) => {
    const ts = Date.now() + minutes * 60 * 1000;
    setEndsAt(ts);
    try {
      if (await ensureNotificationPermission()) await scheduleBreakEndNotification(ts);
    } catch (err) {
      console.warn("Could not schedule the break notification:", err);
    }
  };

  // Back gesture, header back and router calls from elsewhere.
  //usePreventRemove(running, () => {});

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
      if (state === "background") {
        setEndsAt(null);
        cancelBreakEndNotification().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [running]);

  // Beep the moment the time is up.
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && finished) beep();
    wasRunning.current = running;
  }, [running, finished, beep]);

  // A break left behind by unmounting must not ring later.
  useEffect(() => () => {
    cancelBreakEndNotification().catch(() => {});
  }, []);

  // The header (and its back button) is only there while no break is running.
  const header = <Stack.Screen options={{ headerShown: !running, gestureEnabled: !running }} />;
  const image = require("@/assets/gifs/black.gif");

  if (endsAt === null) {
    return (
      <CenteredTimer time="00:00" image={image} info={INFO}>
        {header}
        {DURATIONS_MIN.map((min) => (
          <Button key={min} mode="text" onPress={() => start(min)}>
            {`${min} perc`}
          </Button>
        ))}
      </CenteredTimer>
    );
  }

  return (
    <CenteredTimer time={formatRemaining(remaining)} image={image} info={INFO}>
      {header}
      {finished && <Button mode="text" onPress={leave}>Kész</Button>}
    </CenteredTimer>
  );
}
