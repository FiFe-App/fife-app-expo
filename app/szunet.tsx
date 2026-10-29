import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { router } from "expo-router";
import CenteredTimer, { useNow, useTimerPalette } from "@/components/focus/CenteredTimer";
import KeepAwake from "@/components/focus/KeepAwake";
import PillButton from "@/components/focus/PillButton";
import { useBeep } from "@/hooks/useBeep";
import { minutesLeft } from "@/lib/focus/pomodoro";
import { ensureNotificationPermission } from "@/lib/notifications/registerForPushNotifications";
import {
  cancelBreakEndNotification,
  scheduleBreakEndNotification,
} from "@/lib/notifications/scheduleFocusNotifications";

const DURATIONS_MIN = [15, 30, 60];
/** The breathing cue helps find the rhythm, then gets out of the way. */
const CUE_FOR_MS = 60 * 1000;

const INTRO =
  "Tegyél le mindent egy kicsit. A kör lassan nő és csökken: " +
  "amikor nő, lélegezz be, amikor csökken, fújd ki. " +
  "Ha letelt az idő, egy pittyanás jelez.";

const INFO = {
  title: "Hogyan működik a Szünet?",
  text:
    "Válaszd ki, mennyi ideig pihensz: 15, 30 vagy 60 perc.\n\n" +
    "Ha végeztél, a Kész vagyok gombbal bármikor befejezheted. " +
    "Ha átváltasz egy másik alkalmazásra, a szünet véget ér.\n\n" +
    "Amikor letelik, pittyanás és értesítés jelez.",
};

const leave = () => (router.canGoBack() ? router.back() : router.replace("/me"));

/**
 * A break of 15, 30 or 60 minutes. It can be ended any time with "Kész
 * vagyok"; switching to another app ends it too.
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

  const image = require("@/assets/gifs/black.gif");
  const neutral = useTimerPalette("neutral");
  const rest = useTimerPalette("rest");

  const done = () => {
    cancelBreakEndNotification().catch(() => {});
    leave();
  };

  if (endsAt === null) {
    return (
      <CenteredTimer title="Szünet" image={image} info={INFO} intro={INTRO} message="Mennyi időre állsz meg?">
        {DURATIONS_MIN.map((min) => (
          <PillButton key={min} label={`${min} perc`} palette={neutral} onPress={() => start(min)} />
        ))}
      </CenteredTimer>
    );
  }

  if (finished) {
    return (
      <CenteredTimer
        title="Szünet"
        time="Letelt"
        image={image}
        info={INFO}
        stage="fading"
        message="Jól esett?"
        footer={<PillButton label="Kész" variant="filled" palette={neutral} onPress={leave} />}
      />
    );
  }

  return (
    <CenteredTimer
      title="Szünet"
      time={`${minutesLeft(remaining)} perc`}
      caption="van hátra"
      image={image}
      info={INFO}
      tone="rest"
      stage="breathing"
      cueForMs={CUE_FOR_MS}
      footer={<PillButton label="Kész vagyok" variant="filled" palette={rest} onPress={done} />}
    >
      <KeepAwake />
    </CenteredTimer>
  );
}
