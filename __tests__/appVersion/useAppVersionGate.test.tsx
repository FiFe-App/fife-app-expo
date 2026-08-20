import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, waitFor } from "@testing-library/react-native";
import { AppState } from "react-native";

import { useAppVersionGate } from "@/hooks/useAppVersionGate";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import { renderHookWithProviders } from "@/test-utils/renderWithProviders";

// The version under test comes from app.config.js in the real app; jest-expo
// leaves `expoConfig` empty, so stand in for it here.
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.1" } },
}));
const mockConstants = jest.requireMock("expo-constants").default as {
  expoConfig: { version?: string } | null;
};

const row = (status: string, latest = "1.2.0", min = "1.1.0") => ({
  data: [
    {
      status,
      min_version: min,
      latest_version: latest,
      update_url: "https://play.google.com/store/apps/details?id=com.fife.app",
      message: null,
    },
  ],
  error: null,
});

beforeEach(async () => {
  __resetSupabase();
  await AsyncStorage.clear();
  mockConstants.expoConfig = { version: "1.0.1" };
});

describe("useAppVersionGate", () => {
  it("asks the server about this build on startup", async () => {
    supabase.rpc.mockResolvedValue(row("ok"));

    const { result } = await renderHookWithProviders(() => useAppVersionGate());

    await waitFor(() => expect(supabase.rpc).toHaveBeenCalled());
    expect(supabase.rpc).toHaveBeenCalledWith("get_app_version_status", {
      p_platform: expect.any(String),
      p_version: "1.0.1",
    });
    expect(result.current.blocked).toBe(false);
    expect(result.current.updateAvailable).toBe(false);
  });

  it("blocks a build below the minimum version", async () => {
    supabase.rpc.mockResolvedValue(row("blocked"));

    const { result } = await renderHookWithProviders(() => useAppVersionGate());

    await waitFor(() => expect(result.current.blocked).toBe(true));
    expect(result.current.status?.latestVersion).toBe("1.2.0");
  });

  it("nudges — and stops nudging once dismissed", async () => {
    supabase.rpc.mockResolvedValue(row("update_available"));

    const { result } = await renderHookWithProviders(() => useAppVersionGate());

    await waitFor(() => expect(result.current.updateAvailable).toBe(true));

    await act(async () => {
      result.current.dismissUpdate();
    });

    expect(result.current.updateAvailable).toBe(false);
    await waitFor(async () =>
      expect(await AsyncStorage.getItem("appVersionGate.dismissedUpdate")).toBe("1.2.0"),
    );
  });

  it("nudges again when a newer release than the dismissed one lands", async () => {
    await AsyncStorage.setItem("appVersionGate.dismissedUpdate", "1.2.0");
    supabase.rpc.mockResolvedValue(row("update_available", "1.3.0"));

    const { result } = await renderHookWithProviders(() => useAppVersionGate());

    await waitFor(() => expect(result.current.updateAvailable).toBe(true));
  });

  it("does nothing when the build cannot say what version it is", async () => {
    mockConstants.expoConfig = null;
    supabase.rpc.mockResolvedValue(row("blocked"));

    const { result } = await renderHookWithProviders(() => useAppVersionGate());

    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(result.current.blocked).toBe(false);
  });

  it("stays open when the check fails", async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { message: "offline" } });

    const { result } = await renderHookWithProviders(() => useAppVersionGate());

    await waitFor(() => expect(supabase.rpc).toHaveBeenCalled());
    expect(result.current.blocked).toBe(false);
    expect(result.current.status).toBeNull();
  });

  it("keeps a block a later failed check could not confirm", async () => {
    supabase.rpc.mockResolvedValue(row("blocked"));

    const { result } = await renderHookWithProviders(() => useAppVersionGate());
    await waitFor(() => expect(result.current.blocked).toBe(true));

    supabase.rpc.mockResolvedValue({ data: null, error: { message: "offline" } });
    await act(async () => {
      await result.current.recheck();
    });

    expect(result.current.blocked).toBe(true);
  });

  it("re-checks when the app comes back to the foreground", async () => {
    supabase.rpc.mockResolvedValue(row("ok"));
    const listeners: ((state: string) => void)[] = [];
    jest.spyOn(AppState, "addEventListener").mockImplementation(((
      _event: string,
      listener: (state: string) => void,
    ) => {
      listeners.push(listener);
      return { remove: jest.fn() };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any);

    await renderHookWithProviders(() => useAppVersionGate());
    await waitFor(() => expect(supabase.rpc).toHaveBeenCalledTimes(1));

    // Throttled: a foreground right after the startup check is a no-op.
    await act(async () => {
      listeners.forEach((listener) => listener("active"));
    });
    expect(supabase.rpc).toHaveBeenCalledTimes(1);

    jest.spyOn(Date, "now").mockReturnValue(Date.now() + 10 * 60 * 1000);
    await act(async () => {
      listeners.forEach((listener) => listener("active"));
    });
    await waitFor(() => expect(supabase.rpc).toHaveBeenCalledTimes(2));
  });
});
