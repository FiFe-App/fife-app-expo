import { useCallback, useEffect, useRef } from "react";
import { BackHandler, Platform } from "react-native";

/**
 * Makes the system Back button close the new-request modal instead of leaving the screen under
 * it: the hardware button on Android, the browser's Back on the web.
 *
 * On the web the modal pushes one history entry of its own while it is open, so that Back has
 * something to pop. Every way of closing it goes through the returned `dismiss`, which pops that
 * entry too (and resolves once it is gone), so the history is left as it was found — which also
 * means a route pushed right after `await dismiss()` lands in the right place.
 */
export function useComposerBack(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });
  // Whether the entry the modal pushed is still on the history stack.
  const entryRef = useRef(false);

  const dismiss = useCallback((): Promise<void> => {
    if (Platform.OS === "web" && entryRef.current && typeof window !== "undefined") {
      return new Promise<void>((resolve) => {
        // popstate also reaches the listener below, which closes the modal.
        window.addEventListener("popstate", () => resolve(), { once: true });
        window.history.back();
      });
    }
    closeRef.current();
    return Promise.resolve();
  }, []);

  useEffect(() => {
    if (!open) return;

    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      window.history.pushState({ requestComposer: true }, "");
      entryRef.current = true;
      const onPop = () => {
        entryRef.current = false;
        closeRef.current();
      };
      window.addEventListener("popstate", onPop);
      return () => {
        window.removeEventListener("popstate", onPop);
        // Closed some way that did not pop the entry: the next Back press would do nothing.
        entryRef.current = false;
      };
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      closeRef.current();
      return true;
    });
    return () => subscription.remove();
  }, [open]);

  return { dismiss };
}
