import { useEffect, useRef } from "react";
import { View } from "react-native";
import { IconButton } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/Button";
import CenteredTimer, { useNow } from "@/components/focus/CenteredTimer";
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
              accessibilityLabel="Kevesebb kör"
              disabled={rounds <= MIN_ROUNDS}
              onPress={() => dispatch(setRounds(rounds - 1))}
            />
            <ThemedText type="defaultSemiBold" style={{ minWidth: 64, textAlign: "center" }}>
              {`${rounds} kör`}
            </ThemedText>
            <IconButton
              icon="plus"
              accessibilityLabel="Több kör"
              disabled={rounds >= MAX_ROUNDS}
              onPress={() => dispatch(setRounds(rounds + 1))}
            />
          </View>
        }
      >
        <Button mode="text" onPress={start}>Indítás</Button>
      </CenteredTimer>
    );
  }

  if (finished || !phase) {
    return (
      <CenteredTimer time={formatRemaining(0)} image={image} info={INFO} caption="Ügyes voltál!">
        <Button mode="text" onPress={stop}>Kész</Button>
      </CenteredTimer>
    );
  }

  const caption =
    phase.kind === "work" ? `${phase.round}/${rounds}. kör` : `Szünet · ${phase.round}/${rounds}`;

  return (
    <CenteredTimer time={formatRemaining(phase.endsAt - now)} image={image} info={INFO} caption={caption}>
      <Button mode="text" onPress={stop}>Leállítás</Button>
    </CenteredTimer>
  );
}
