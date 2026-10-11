import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/Button";
import CenteredTimer, { useNow } from "@/components/focus/CenteredTimer";
import { formatRemaining, phaseAt, WORK_MS } from "@/lib/focus/pomodoro";
import { ensureNotificationPermission } from "@/lib/notifications/registerForPushNotifications";
import {
  cancelFocusNotifications,
  scheduleFocusNotifications,
} from "@/lib/notifications/scheduleFocusNotifications";
import { startFocus, stopFocus } from "@/redux/reducers/focusReducer";
import { RootState } from "@/redux/store";

/**
 * Pomodoro: 25 minutes of work, 5 of break, a 15-minute break after every
 * fourth work block, repeating until stopped. Leaving the screen doesn't stop
 * it — the notifications carry on and coming back shows the current phase.
 */
export default function FocusScreen() {
  const dispatch = useDispatch();
  const startedAt = useSelector((state: RootState) => state.focus.startedAt);
  const now = useNow(startedAt !== null);
  const remaining = startedAt === null ? WORK_MS : phaseAt(startedAt, now).endsAt - now;

  const start = async () => {
    const ts = Date.now();
    dispatch(startFocus(ts));
    try {
      if (await ensureNotificationPermission()) await scheduleFocusNotifications(ts);
    } catch (err) {
      console.warn("Could not schedule the focus notifications:", err);
    }
  };

  const stop = () => {
    dispatch(stopFocus());
    cancelFocusNotifications().catch(() => {});
  };

  return (
    <CenteredTimer time={formatRemaining(remaining)}>
      {startedAt === null ? (
        <Button mode="text" onPress={start}>Indítás</Button>
      ) : (
        <Button mode="text" onPress={stop}>Leállítás</Button>
      )}
    </CenteredTimer>
  );
}
