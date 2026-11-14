import { useEffect } from "react";
import { AppState } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { clearExpiredTaskReminders } from "@/redux/reducers/userReducer";

// setTimeout overflows and fires at once beyond this.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * Removes a task's reminder from the store once its time has passed.
 *
 * Checked on mount, when the app comes back to the foreground (a timer does not
 * run while it is suspended), and by a timer for the next reminder due while
 * the list is on screen.
 */
export function useExpireTaskReminders() {
  const dispatch = useDispatch();
  const tasks = useSelector((state: RootState) => state.user.tasks);

  useEffect(() => {
    const expire = () => dispatch(clearExpiredTaskReminders(new Date().toISOString()));
    expire();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") expire();
    });
    return () => sub.remove();
  }, [dispatch]);

  useEffect(() => {
    const now = Date.now();
    const upcoming = (tasks ?? [])
      .map((task) => (task.remindAt ? new Date(task.remindAt).getTime() : NaN))
      .filter((at) => at > now);
    if (upcoming.length === 0) return;

    const delay = Math.min(Math.min(...upcoming) - now, MAX_TIMEOUT_MS);
    // A moment late rather than a moment early, so the time has surely passed.
    const timer = setTimeout(
      () => dispatch(clearExpiredTaskReminders(new Date().toISOString())),
      delay + 50,
    );
    return () => clearTimeout(timer);
  }, [tasks, dispatch]);
}
