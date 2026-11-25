import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Platform } from "react-native";

/**
 * The history of a screen that is one screen, whatever it shows: a stack of states of which the
 * last is the current one. `push` adds a state, `back` removes it, and the system's Back (the
 * hardware button, the browser's Back) does the same instead of leaving the screen, until only
 * the first state is left — then Back is the screen's own again.
 *
 * It is how the search screen steps through its searches without ever being routed to: no
 * transition, and whatever the screen holds (its map above all) is never torn down and rebuilt.
 *
 * On the web every pushed state is also an entry of the browser's history (same URL), so the
 * browser's Back has something to pop; `back` goes through that entry, so they never disagree.
 */
export function useSearchHistory<T>(initial: T) {
  const [stack, setStack] = useState<T[]>([initial]);
  const depth = stack.length;
  // The entries this screen pushed to the browser's history and has not seen popped yet.
  const entriesRef = useRef(0);

  const push = useCallback((state: T) => {
    setStack((prev) => [...prev, state]);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.history.pushState({ searchHistory: true }, "");
      entriesRef.current += 1;
    }
  }, []);

  const popState = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  /** Steps back. Returns false when there is nothing to step back to (the caller leaves the screen). */
  const back = useCallback((): boolean => {
    if (depth <= 1) return false;
    if (Platform.OS === "web" && typeof window !== "undefined" && entriesRef.current > 0) {
      // popstate (below) does the popping, so the browser's history and the stack stay in step.
      window.history.back();
    } else {
      popState();
    }
    return true;
  }, [depth, popState]);

  /** Changes the current state in place (a filter refines the search on screen), not the history. */
  const replace = useCallback((state: T) => {
    setStack((prev) => [...prev.slice(0, -1), state]);
  }, []);

  /** Starts over with one state: somebody arrived with a new request (a link, a tab press). */
  const reset = useCallback((state: T) => {
    setStack([state]);
  }, []);

  // The hardware Back button of Android.
  useEffect(() => {
    if (depth <= 1) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      popState();
      return true;
    });
    return () => subscription.remove();
  }, [depth, popState]);

  // The browser's Back button.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onPop = () => {
      if (entriesRef.current > 0) {
        entriesRef.current -= 1;
        popState();
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [popState]);

  return { current: stack[stack.length - 1], depth, push, replace, back, reset };
}
