import { act, renderHook } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";

jest.mock("@/lib/appLock", () => ({
  authenticateOwner: jest.fn(),
  deviceLockAvailable: jest.fn(),
}));

import { LOCK_AFTER_MS, useAppLock } from "@/hooks/useAppLock";
import { authenticateOwner } from "@/lib/appLock";

const authenticate = authenticateOwner as jest.Mock;

let listeners: ((state: AppStateStatus) => void)[] = [];
const emit = (state: AppStateStatus) => act(() => listeners.forEach((l) => l(state)));

beforeEach(() => {
  listeners = [];
  jest.spyOn(AppState, "addEventListener").mockImplementation((_type, handler) => {
    listeners.push(handler as (state: AppStateStatus) => void);
    return { remove: () => { listeners = listeners.filter((l) => l !== handler); } } as ReturnType<typeof AppState.addEventListener>;
  });
  authenticate.mockReset();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useAppLock", () => {
  it("starts locked on a cold start while the lock is on", async () => {
    const { result } = await renderHook(() => useAppLock(true, true));
    expect(result.current.locked).toBe(true);
  });

  it("never locks while the lock is off", async () => {
    const { result } = await renderHook(() => useAppLock(false, true));
    expect(result.current.locked).toBe(false);

    await emit("background");
    jest.advanceTimersByTime(LOCK_AFTER_MS * 2);
    await emit("active");

    expect(result.current.locked).toBe(false);
  });

  it("unlocks once the owner is confirmed, and stays locked if not", async () => {
    const { result } = await renderHook(() => useAppLock(true, true));

    authenticate.mockResolvedValueOnce(false);
    await act(() => result.current.unlock());
    expect(result.current.locked).toBe(true);

    authenticate.mockResolvedValueOnce(true);
    await act(() => result.current.unlock());
    expect(result.current.locked).toBe(false);
  });

  it("does not lock again after a short trip to the background", async () => {
    authenticate.mockResolvedValue(true);
    const { result } = await renderHook(() => useAppLock(true, true));
    await act(() => result.current.unlock());

    await emit("background");
    jest.advanceTimersByTime(LOCK_AFTER_MS - 1000);
    await emit("active");

    expect(result.current.locked).toBe(false);
  });

  it("locks again after a long stay in the background", async () => {
    authenticate.mockResolvedValue(true);
    const { result } = await renderHook(() => useAppLock(true, true));
    await act(() => result.current.unlock());

    await emit("background");
    jest.advanceTimersByTime(LOCK_AFTER_MS + 1000);
    await emit("active");

    expect(result.current.locked).toBe(true);
  });

  it("ignores iOS's inactive state while its own prompt is up", async () => {
    authenticate.mockResolvedValue(true);
    const { result } = await renderHook(() => useAppLock(true, true));
    await act(() => result.current.unlock());

    await emit("inactive");
    jest.advanceTimersByTime(LOCK_AFTER_MS + 1000);
    await emit("active");

    expect(result.current.locked).toBe(false);
  });

  it("unlocks when the lock is switched off", async () => {
    const { result, rerender } = await renderHook(({ on }: { on: boolean }) => useAppLock(on, true), {
      initialProps: { on: true },
    });
    expect(result.current.locked).toBe(true);

    await rerender({ on: false });

    expect(result.current.locked).toBe(false);
  });
  describe("only guards Én mód", () => {
    type Props = { inEn: boolean };
    const setup = (inEn: boolean) =>
      renderHook(({ inEn }: Props) => useAppLock(true, inEn), { initialProps: { inEn } });

    it("never shows the lock on Mi, even on a cold start", async () => {
      const { result } = await setup(false);
      expect(result.current.locked).toBe(false);
    });

    it("shows the cold-start lock as soon as the user steps into Én", async () => {
      const { result, rerender } = await setup(false);

      await rerender({ inEn: true });

      expect(result.current.locked).toBe(true);
    });

    it("does not lock Mi after a long stay in the background", async () => {
      const { result } = await setup(false);

      await emit("background");
      jest.advanceTimersByTime(LOCK_AFTER_MS * 4);
      await emit("active");

      expect(result.current.locked).toBe(false);
    });

    it("locks Én again when the user comes back from a long time on Mi", async () => {
      authenticate.mockResolvedValue(true);
      const { result, rerender } = await setup(true);
      await act(() => result.current.unlock());

      await rerender({ inEn: false });
      jest.advanceTimersByTime(LOCK_AFTER_MS + 1000);
      await rerender({ inEn: true });

      expect(result.current.locked).toBe(true);
    });

    it("keeps Én open after a short look at Mi", async () => {
      authenticate.mockResolvedValue(true);
      const { result, rerender } = await setup(true);
      await act(() => result.current.unlock());

      await rerender({ inEn: false });
      jest.advanceTimersByTime(LOCK_AFTER_MS - 1000);
      await rerender({ inEn: true });

      expect(result.current.locked).toBe(false);
    });

    it("counts a long background stay on Mi as time away from Én", async () => {
      authenticate.mockResolvedValue(true);
      const { result, rerender } = await setup(true);
      await act(() => result.current.unlock());

      await rerender({ inEn: false });
      await emit("background");
      jest.advanceTimersByTime(LOCK_AFTER_MS + 1000);
      await emit("active");
      expect(result.current.locked).toBe(false); // still on Mi

      await rerender({ inEn: true });
      expect(result.current.locked).toBe(true);
    });

    it("locks Én after a long background stay while on Én", async () => {
      authenticate.mockResolvedValue(true);
      const { result } = await setup(true);
      await act(() => result.current.unlock());

      await emit("background");
      jest.advanceTimersByTime(LOCK_AFTER_MS + 1000);
      await emit("active");

      expect(result.current.locked).toBe(true);
    });
  });
});
