import { act, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";

import {
  DEFAULT_NOTIFICATION_PREFS,
  useNotificationPrefs,
} from "@/hooks/useNotificationPrefs";
import {
  ensureNotificationPermission,
  registerForPushNotificationsAsync,
} from "@/lib/notifications/registerForPushNotifications";
import {
  cancelDailyEmotionReminder,
  scheduleDailyEmotionReminder,
} from "@/lib/notifications/scheduleDailyEmotionReminder";
import { login, setNotificationPrefs } from "@/redux/reducers/userReducer";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import {
  createTestStore,
  renderHookWithProviders,
} from "@/test-utils/renderWithProviders";

jest.mock("@/lib/notifications/registerForPushNotifications", () => ({
  ensureNotificationPermission: jest.fn(),
  registerForPushNotificationsAsync: jest.fn(),
}));

jest.mock("@/lib/notifications/scheduleDailyEmotionReminder", () => ({
  scheduleDailyEmotionReminder: jest.fn(),
  cancelDailyEmotionReminder: jest.fn(),
}));

const mockedPermission = ensureNotificationPermission as jest.Mock;
const mockedRegisterToken = registerForPushNotificationsAsync as jest.Mock;
const mockedSchedule = scheduleDailyEmotionReminder as jest.Mock;
const mockedCancel = cancelDailyEmotionReminder as jest.Mock;

const setPlatform = (os: "ios" | "web") =>
  Object.defineProperty(Platform, "OS", { value: os, configurable: true });
const originalOS = Platform.OS;

/** A store already logged in, and optionally already hydrated with prefs. */
const storeWith = (prefs?: Partial<typeof DEFAULT_NOTIFICATION_PREFS>) => {
  const store = createTestStore();
  store.dispatch(login("me"));
  if (prefs)
    store.dispatch(
      setNotificationPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...prefs }),
    );
  return store;
};

/**
 * The columns written by the last `.update()`, after asserting it went to
 * `user_settings`. Notification preferences live on the user's settings row,
 * not on `profiles` — a write to the wrong table would still carry the right
 * columns, so the table name is checked here rather than left implicit.
 */
const lastPrefsUpdate = () => {
  const written = supabase.from.mock.results
    .map((r, i) => ({ table: supabase.from.mock.calls[i][0], builder: r.value }))
    .filter(({ builder }) => (builder.update as jest.Mock).mock.calls.length > 0);
  const last = written[written.length - 1];
  expect(last.table).toBe("user_settings");
  const updateCalls = (last.builder.update as jest.Mock).mock.calls;
  return updateCalls[updateCalls.length - 1][0];
};

beforeEach(() => {
  __resetSupabase();
  mockedPermission.mockResolvedValue(true);
  mockedRegisterToken.mockResolvedValue("ExpoToken[abc]");
  mockedSchedule.mockResolvedValue(undefined);
  mockedCancel.mockResolvedValue(undefined);
  setPlatform("ios");
});

afterEach(() => setPlatform(originalOS as "ios"));

describe("useNotificationPrefs / hydration", () => {
  it("reports not hydrated and serves defaults before the server answers", async () => {
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store: storeWith(),
    });

    expect(result.current.hydrated).toBe(false);
    expect(result.current.prefs).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });

  it("is hydrated once prefs are in the store", async () => {
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store: storeWith({ newsletter: true }),
    });

    expect(result.current.hydrated).toBe(true);
    expect(result.current.prefs.newsletter).toBe(true);
  });
});

describe("useNotificationPrefs / reload", () => {
  it("maps the rpc row into prefs and hydrates the store", async () => {
    supabase.rpc.mockResolvedValue({
      data: [
        {
          notify_push: true,
          notify_email: false,
          newsletter: true,
          emotion_daily_prompt: true,
          push_asked_at: "2026-01-01T00:00:00.000Z",
          emotion_prompt_asked_at: null,
          newsletter_asked_at: null,
        },
      ],
      error: null,
    });
    const store = storeWith();
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store,
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(store.getState().user.notificationPrefs).toEqual({
      notifyPush: true,
      notifyEmail: false,
      newsletter: true,
      emotionDailyPrompt: true,
      pushAskedAt: "2026-01-01T00:00:00.000Z",
      emotionPromptAskedAt: null,
      newsletterAskedAt: null,
    });
  });

  it("falls back per column when the row has nulls", async () => {
    supabase.rpc.mockResolvedValue({ data: [{}], error: null });
    const store = storeWith();
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store,
    });

    await act(async () => {
      await result.current.reload();
    });

    // notify_email defaults to true, everything else to false/null.
    expect(store.getState().user.notificationPrefs).toEqual(
      DEFAULT_NOTIFICATION_PREFS,
    );
  });

  it("leaves the store untouched when the rpc fails", async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const store = storeWith();
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store,
    });

    let returned: unknown;
    await act(async () => {
      returned = await result.current.reload();
    });

    expect(returned).toBeNull();
    expect(store.getState().user.notificationPrefs).toBeUndefined();
  });

  it("does nothing when nobody is logged in", async () => {
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store: createTestStore(),
    });

    await act(async () => {
      expect(await result.current.reload()).toBeNull();
    });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});

describe("useNotificationPrefs / setPref", () => {
  it("writes the preference and stamps its asked column together", async () => {
    const store = storeWith();
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store,
    });

    await act(async () => {
      expect(await result.current.setPref("newsletter", true)).toBe(true);
    });

    // Answering in settings must also silence the prompt card on /me.
    const written = lastPrefsUpdate();
    expect(written.newsletter).toBe(true);
    expect(written.newsletter_asked_at).toEqual(expect.any(String));
  });

  it("does not stamp an asked column for notifyEmail", async () => {
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store: storeWith(),
    });

    await act(async () => {
      await result.current.setPref("notifyEmail", false);
    });

    expect(lastPrefsUpdate()).toEqual({ notify_email: false });
  });

  it("stores false and warns when the OS denies the permission", async () => {
    mockedPermission.mockResolvedValue(false);
    const store = storeWith();
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store,
    });

    await act(async () => {
      // The caller asked for true but must be told what was actually stored.
      expect(await result.current.setPref("notifyPush", true)).toBe(false);
    });

    expect(lastPrefsUpdate().notify_push).toBe(false);
    expect(store.getState().info.dialogs).toHaveLength(1);
    expect(mockedRegisterToken).not.toHaveBeenCalled();
  });

  it("registers a push token only when push actually ended up on", async () => {
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store: storeWith(),
    });

    await act(async () => {
      await result.current.setPref("notifyPush", true);
    });

    expect(mockedRegisterToken).toHaveBeenCalled();
    await waitFor(() =>
      expect(supabase.rpc).toHaveBeenCalledWith("update_my_push_token", {
        token: "ExpoToken[abc]",
      }),
    );
  });

  it("does not ask for permission when switching push off", async () => {
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store: storeWith({ notifyPush: true }),
    });

    await act(async () => {
      expect(await result.current.setPref("notifyPush", false)).toBe(false);
    });

    expect(mockedPermission).not.toHaveBeenCalled();
    expect(mockedRegisterToken).not.toHaveBeenCalled();
  });

  it("skips the permission prompt on web", async () => {
    setPlatform("web");
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store: storeWith(),
    });

    await act(async () => {
      expect(await result.current.setPref("notifyPush", true)).toBe(true);
    });

    expect(mockedPermission).not.toHaveBeenCalled();
  });

  it("schedules the daily reminder when the emotion prompt goes on", async () => {
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store: storeWith(),
    });

    await act(async () => {
      await result.current.setPref("emotionDailyPrompt", true);
    });

    expect(mockedSchedule).toHaveBeenCalled();
    expect(mockedCancel).not.toHaveBeenCalled();
  });

  it("cancels the daily reminder when it goes off", async () => {
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store: storeWith({ emotionDailyPrompt: true }),
    });

    await act(async () => {
      await result.current.setPref("emotionDailyPrompt", false);
    });

    expect(mockedCancel).toHaveBeenCalled();
    expect(mockedSchedule).not.toHaveBeenCalled();
  });

  it("cancels the reminder when the permission was denied", async () => {
    mockedPermission.mockResolvedValue(false);
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store: storeWith(),
    });

    await act(async () => {
      await result.current.setPref("emotionDailyPrompt", true);
    });

    // Stored as false, so the reminder must not be left scheduled.
    expect(mockedCancel).toHaveBeenCalled();
    expect(mockedSchedule).not.toHaveBeenCalled();
  });

  it("writes nothing when nobody is logged in", async () => {
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store: createTestStore(),
    });

    await act(async () => {
      await result.current.setPref("newsletter", true);
    });

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("updates Redux optimistically once hydrated", async () => {
    const store = storeWith({ newsletter: false });
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store,
    });

    await act(async () => {
      await result.current.setPref("newsletter", true);
    });

    expect(store.getState().user.notificationPrefs?.newsletter).toBe(true);
    expect(store.getState().user.notificationPrefs?.newsletterAskedAt).toEqual(
      expect.any(String),
    );
  });
});

describe("useNotificationPrefs / markAsked", () => {
  it("stamps the asked column without touching the preference", async () => {
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store: storeWith(),
    });

    await act(async () => {
      await result.current.markAsked("emotionDailyPrompt");
    });

    expect(lastPrefsUpdate()).toEqual({
      emotion_prompt_asked_at: expect.any(String),
    });
  });

  it("records the dismissal in Redux so the card stays away", async () => {
    const store = storeWith({});
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store,
    });

    await act(async () => {
      await result.current.markAsked("notifyPush");
    });

    expect(store.getState().user.notificationPrefs?.pushAskedAt).toEqual(
      expect.any(String),
    );
    expect(store.getState().user.notificationPrefs?.notifyPush).toBe(false);
  });

  it("writes nothing when nobody is logged in", async () => {
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store: createTestStore(),
    });

    await act(async () => {
      await result.current.markAsked("newsletter");
    });

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("drops the Redux patch before hydration, but still writes the column", async () => {
    // patchNotificationPrefs bails out when nothing is hydrated yet, so the
    // optimistic update is lost while the server write goes through. Callers
    // are expected to gate on `hydrated` before asking anything, which is why
    // this is a sharp edge rather than a live bug — pinned here so a change in
    // either direction is deliberate.
    const store = storeWith();
    const { result } = await renderHookWithProviders(() => useNotificationPrefs(), {
      store,
    });

    await act(async () => {
      await result.current.markAsked("notifyPush");
    });

    expect(store.getState().user.notificationPrefs).toBeUndefined();
    expect(lastPrefsUpdate()).toEqual({ push_asked_at: expect.any(String) });
  });
});
