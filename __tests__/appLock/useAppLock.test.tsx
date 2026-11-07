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
    const { result } = await renderHook(() => useAppLock(true));
    expect(result.current.locked).toBe(true);
  });

  it("never locks while the lock is off", async () => {
    const { result } = await renderHook(() => useAppLock(false));
    expect(result.current.locked).toBe(false);

    await emit("background");
    jest.advanceTimersByTime(LOCK_AFTER_MS * 2);
    await emit("active");

    expect(result.current.locked).toBe(false);
  });

  it("unlocks once the owner is confirmed, and stays locked if not", async () => {
    const { result } = await renderHook(() => useAppLock(true));

    authenticate.mockResolvedValueOnce(false);
    await act(() => result.current.unlock());
    expect(result.current.locked).toBe(true);

    authenticate.mockResolvedValueOnce(true);
    await act(() => result.current.unlock());
    expect(result.current.locked).toBe(false);
  });

  it("does not lock again after a short trip to the background", async () => {
    authenticate.mockResolvedValue(true);
    const { result } = await renderHook(() => useAppLock(true));
    await act(() => result.current.unlock());

    await emit("background");
    jest.advanceTimersByTime(LOCK_AFTER_MS - 1000);
    await emit("active");

    expect(result.current.locked).toBe(false);
  });

  it("locks again after a long stay in the background", async () => {
    authenticate.mockResolvedValue(true);
    const { result } = await renderHook(() => useAppLock(true));
    await act(() => result.current.unlock());

    await emit("background");
    jest.advanceTimersByTime(LOCK_AFTER_MS + 1000);
    await emit("active");

    expect(result.current.locked).toBe(true);
  });

  it("ignores iOS's inactive state while its own prompt is up", async () => {
    authenticate.mockResolvedValue(true);
    const { result } = await renderHook(() => useAppLock(true));
    await act(() => result.current.unlock());

    await emit("inactive");
    jest.advanceTimersByTime(LOCK_AFTER_MS + 1000);
    await emit("active");

    expect(result.current.locked).toBe(false);
  });

  it("unlocks when the lock is switched off", async () => {
    const { result, rerender } = await renderHook(({ on }: { on: boolean }) => useAppLock(on), {
      initialProps: { on: true },
    });
    expect(result.current.locked).toBe(true);

    await rerender({ on: false });

    expect(result.current.locked).toBe(false);
  });
});
