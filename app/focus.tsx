import { useEffect, useRef } from "react";
import { View } from "react-native";
import { IconButton } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import CenteredTimer, { useNow, useTimerPalette } from "@/components/focus/CenteredTimer";
import KeepAwake from "@/components/focus/KeepAwake";
import PillButton from "@/components/focus/PillButton";
import RoundDots from "@/components/focus/RoundDots";
import { ThemedText } from "@/components/ThemedText";
import { useBeep } from "@/hooks/useBeep";
import {
  DEFAULT_ROUNDS,
  formatRemaining,
  MAX_ROUNDS,
  MIN_ROUNDS,
  phaseAt,
  WORK_MS,
} from "@/lib/focus/pomodoro";
import { ensureNotificationPermission } from "@/lib/notifications/registerForPushNotifications";
import {
  cancelFocusNotifications,
  scheduleFocusNotifications,
} from "@/lib/notifications/scheduleFocusNotifications";
import { setRounds, startFocus, stopFocus } from "@/redux/reducers/focusReducer";
import { RootState } from "@/redux/store";

const INFO = {
  title: "Hogyan működik a Fókusz?",
  text:
    "A Pomodoro-technikán alapul: 25 perc koncentrált munka, utána 5 perc szünet – ez egy kör. " +
    "Minden negyedik kör után 15 perc hosszabb pihenő jár.\n\n" +
    "Válaszd ki, hány kört szeretnél, és indítsd el. Minden váltáskor pittyanás és értesítés jelez, " +
    "akkor is, ha közben bezárod az appot.",
};

/**
 * Pomodoro: the chosen number of rounds of 25 minutes work and 5 minutes
 * break, with a 15-minute break after every fourth. Leaving the screen
 * doesn't stop it — the notifications carry on and coming back shows the
 * current phase.
 */
export default function FocusScreen() {
  const dispatch = useDispatch();
  const startedAt = useSelector((state: RootState) => state.focus.startedAt);
  const rounds = useSelector((state: RootState) => state.focus.rounds) ?? DEFAULT_ROUNDS;
  const beep = useBeep();
  const now = useNow(startedAt !== null);

  const phase = startedAt === null ? null : phaseAt(startedAt, rounds, now);
  const finished = startedAt !== null && phase === null;

  // Beep on every phase change seen while the screen is open — not on the
  // first render, which is just opening the screen mid-phase.
  const phaseKey = startedAt === null ? null : phase?.index ?? "done";
  const prevPhaseKey = useRef(phaseKey);
  useEffect(() => {
    if (prevPhaseKey.current !== null && phaseKey !== null && prevPhaseKey.current !== phaseKey) beep();
    prevPhaseKey.current = phaseKey;
  }, [phaseKey, beep]);

  const start = async () => {
    const ts = Date.now();
    dispatch(startFocus(ts));
    try {
      if (await ensureNotificationPermission()) await scheduleFocusNotifications(ts, rounds);
    } catch (err) {
      console.warn("Could not schedule the focus notifications:", err);
    }
  };

  const stop = () => {
    dispatch(stopFocus());
    cancelFocusNotifications().catch(() => {});
  };

  const image = require("@/assets/gifs/focus.gif");
  const tone = phase === null ? "neutral" : phase.kind === "work" ? "work" : "rest";
  const palette = useTimerPalette(tone);

  if (startedAt === null) {
    return (
      <CenteredTimer
        time={formatRemaining(WORK_MS)}
        image={image}
        info={INFO}
        picker={
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <IconButton
              icon="minus"
              size={28}
              iconColor={palette.text}
              accessibilityLabel="Kevesebb kör"
              disabled={rounds <= MIN_ROUNDS}
              onPress={() => dispatch(setRounds(rounds - 1))}
            />
            <ThemedText style={{ minWidth: 88, textAlign: "center", fontSize: 20, lineHeight: 26, fontFamily: "RedHatText-Medium", color: palette.text }}>
              {`${rounds} kör`}
            </ThemedText>
            <IconButton
              icon="plus"
              size={28}
              iconColor={palette.text}
              accessibilityLabel="Több kör"
              disabled={rounds >= MAX_ROUNDS}
              onPress={() => dispatch(setRounds(rounds + 1))}
            />
          </View>
        }
      >
        <PillButton label="Indítás" variant="filled" palette={palette} onPress={start} />
      </CenteredTimer>
    );
  }

  if (finished || !phase) {
    return (
      <CenteredTimer time={formatRemaining(0)} image={image} info={INFO} message="Ügyes voltál!">
        <PillButton label="Kész" variant="filled" palette={palette} onPress={stop} />
      </CenteredTimer>
    );
  }

  const working = phase.kind === "work";

  return (
    <CenteredTimer
      time={formatRemaining(phase.endsAt - now)}
      image={image}
      info={INFO}
      tone={tone}
      stage={working ? "warm" : "breathing"}
      caption={working ? `${phase.round}/${rounds}. kör` : `Szünet · ${phase.round}/${rounds}`}
      picker={working && <RoundDots round={phase.round} rounds={rounds} fill={palette.timer} outline={palette.outline} />}
    >
      <KeepAwake />
      <PillButton label="Leállítás" palette={palette} onPress={stop} />
    </CenteredTimer>
  );
}
