import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { createRef } from "react";
import { Platform } from "react-native";

import ContactEditScreen from "@/components/buziness/ContactEditScreen";
import { MessagingDisabledCard } from "@/components/chat/MessagingDisabledCard";
import NotificationPrompts from "@/components/notifications/NotificationPrompts";
import { useMessagingReachability } from "@/hooks/useMessagingReachability";
import { DEFAULT_NOTIFICATION_PREFS } from "@/hooks/useNotificationPrefs";
import {
  canReceiveMessageNotifications,
  isUnreachableForMessaging,
} from "@/lib/notifications/messagingReachability";
import { ensureNotificationPermission } from "@/lib/notifications/registerForPushNotifications";
import {
  login,
  setMessagingEnabled,
  setNotificationPrefs,
} from "@/redux/reducers/userReducer";
import { __resetSupabase, __setTableRows, supabase } from "@/test-utils/mocks/supabase";
import {
  createTestStore,
  renderHookWithProviders,
  renderWithProviders,
  type TestStore,
} from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/notifications/registerForPushNotifications", () => ({
  ensureNotificationPermission: jest.fn(),
  registerForPushNotificationsAsync: jest.fn(),
}));
jest.mock("@/lib/notifications/scheduleDailyEmotionReminder", () => ({
  scheduleDailyEmotionReminder: jest.fn(),
  cancelDailyEmotionReminder: jest.fn(),
}));

const mockedPermission = ensureNotificationPermission as jest.Mock;

const setPlatform = (os: "ios" | "web") =>
  Object.defineProperty(Platform, "OS", { value: os, configurable: true });
const originalOS = Platform.OS;

/** Accepts messages, but neither channel can deliver one. */
const SILENT = { notifyPush: false, notifyEmail: false };

const storeWith = ({
  messagingEnabled = true,
  prefs = SILENT,
}: {
  messagingEnabled?: boolean;
  prefs?: Partial<typeof DEFAULT_NOTIFICATION_PREFS>;
} = {}): TestStore => {
  const store = createTestStore();
  store.dispatch(login("me"));
  store.dispatch(setMessagingEnabled(messagingEnabled));
  store.dispatch(setNotificationPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...prefs }));
  return store;
};

const prefsIn = (store: TestStore) => store.getState().user.notificationPrefs!;

beforeEach(() => {
  __resetSupabase();
  mockedPermission.mockResolvedValue(true);
  setPlatform("ios");
});

afterEach(() => setPlatform(originalOS as "ios"));

describe("canReceiveMessageNotifications", () => {
  it("counts either channel as delivery", () => {
    expect(
      canReceiveMessageNotifications({ ...DEFAULT_NOTIFICATION_PREFS, ...SILENT, notifyPush: true }),
    ).toBe(true);
    expect(
      canReceiveMessageNotifications({ ...DEFAULT_NOTIFICATION_PREFS, ...SILENT, notifyEmail: true }),
    ).toBe(true);
  });

  it("is false with both switched off", () => {
    expect(
      canReceiveMessageNotifications({ ...DEFAULT_NOTIFICATION_PREFS, ...SILENT }),
    ).toBe(false);
  });
});

describe("isUnreachableForMessaging", () => {
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...SILENT };

  it("flags an account that accepts messages it cannot hear about", () => {
    expect(isUnreachableForMessaging({ messagingEnabled: true, prefs, hydrated: true })).toBe(true);
  });

  it("says nothing before the prefs are hydrated", () => {
    // The defaults claim both channels are off, so trusting them here would
    // flash the warning at every user on every cold start.
    expect(isUnreachableForMessaging({ messagingEnabled: true, prefs, hydrated: false })).toBe(false);
  });

  it("ignores someone who does not accept messages at all", () => {
    expect(isUnreachableForMessaging({ messagingEnabled: false, prefs, hydrated: true })).toBe(false);
  });
});

describe("useMessagingReachability / ensureReachable", () => {
  it("switches push on when the OS allows it", async () => {
    const store = storeWith();
    const { result } = await renderHookWithProviders(() => useMessagingReachability(), {
      store,
    });

    await act(async () => {
      expect(await result.current.ensureReachable()).toBe(true);
    });

    expect(prefsIn(store).notifyPush).toBe(true);
  });

  it("falls back to email when the push permission is refused", async () => {
    mockedPermission.mockResolvedValue(false);
    const store = storeWith();
    const { result } = await renderHookWithProviders(() => useMessagingReachability(), {
      store,
    });

    await act(async () => {
      expect(await result.current.ensureReachable()).toBe(true);
    });

    expect(prefsIn(store).notifyPush).toBe(false);
    expect(prefsIn(store).notifyEmail).toBe(true);
  });

  it("goes straight to email on web, where push does not exist", async () => {
    setPlatform("web");
    const store = storeWith();
    const { result } = await renderHookWithProviders(() => useMessagingReachability(), {
      store,
    });

    await act(async () => {
      await result.current.ensureReachable();
    });

    expect(mockedPermission).not.toHaveBeenCalled();
    expect(prefsIn(store).notifyEmail).toBe(true);
    expect(prefsIn(store).notifyPush).toBe(false);
  });

  it("leaves a reachable account alone", async () => {
    const store = storeWith({ prefs: { notifyPush: false, notifyEmail: true } });
    const { result } = await renderHookWithProviders(() => useMessagingReachability(), {
      store,
    });

    await act(async () => {
      expect(await result.current.ensureReachable()).toBe(true);
    });

    expect(supabase.from).not.toHaveBeenCalled();
    expect(prefsIn(store).notifyPush).toBe(false);
  });

  it("reads the prefs back rather than trusting the defaults", async () => {
    // Un-hydrated prefs default to notifyEmail: true, which would report an
    // account reachable without ever asking the server.
    supabase.rpc.mockResolvedValue({
      data: [{ notify_push: false, notify_email: false }],
      error: null,
    });
    const store = createTestStore();
    store.dispatch(login("me"));
    store.dispatch(setMessagingEnabled(true));

    const { result } = await renderHookWithProviders(() => useMessagingReachability(), {
      store,
    });

    await act(async () => {
      await result.current.ensureReachable();
    });

    expect(supabase.rpc).toHaveBeenCalledWith("get_my_notification_prefs");
    expect(prefsIn(store).notifyPush).toBe(true);
  });
});

describe("switching messaging on", () => {
  it("switches a notification channel on in the same step", async () => {
    __setTableRows("contacts", { data: [], error: null });
    const store = storeWith({ messagingEnabled: false });

    await renderWithProviders(<MessagingDisabledCard myMessagingEnabled={false} />, {
      store,
    });

    fireEvent.press(screen.getByText("Kattints a bekapcsolásához"));

    await waitFor(() => expect(store.getState().user.messagingEnabled).toBe(true));
    await waitFor(() => expect(prefsIn(store).notifyPush).toBe(true));
  });
});

/** Drives the contacts editor up to (and including) its save. */
const saveContactsWith = async (store: TestStore, messageSwitchedOn: boolean) => {
  __setTableRows("contacts", { data: [], error: null });
  const ref = createRef<{ saveContacts: () => Promise<unknown> }>();

  await renderWithProviders(<ContactEditScreen ref={ref} />, { store });

  // Only the "Közvetlen üzenet" row is revealed for an account with no
  // contacts yet, so this is the messaging switch. Awaited because `save` is
  // read off the ref: without the re-render it would still close over the
  // contacts as they were before the toggle.
  const messageSwitch = await screen.findByRole("switch");
  await fireEvent(messageSwitch, "valueChange", messageSwitchedOn);

  await act(async () => {
    await ref.current!.saveContacts();
  });
};

describe("saving the contacts editor", () => {
  it("switches a channel on when the message contact is added", async () => {
    const store = storeWith({ messagingEnabled: false });

    await saveContactsWith(store, true);

    expect(store.getState().user.messagingEnabled).toBe(true);
    expect(prefsIn(store).notifyPush).toBe(true);
  });

  it("leaves the prefs alone when messaging was already on", async () => {
    // Re-running the fix on every save would undo a channel the user has since
    // switched off on purpose; the warning under the switch argues that case.
    const store = storeWith({ messagingEnabled: true });

    await saveContactsWith(store, true);

    expect(prefsIn(store).notifyPush).toBe(false);
    expect(prefsIn(store).notifyEmail).toBe(false);
  });

  it("leaves the prefs alone when the message contact is not added", async () => {
    const store = storeWith({ messagingEnabled: false });

    await saveContactsWith(store, false);

    expect(prefsIn(store).notifyPush).toBe(false);
    expect(prefsIn(store).notifyEmail).toBe(false);
  });
});

describe("the unreachable warning on /me", () => {
  const withBuzinessCount = (count: number) =>
    __setTableRows("buziness", { data: null, error: null, count });

  it("outranks the opt-in questions still in the queue", async () => {
    withBuzinessCount(0);
    await renderWithProviders(<NotificationPrompts />, { store: storeWith() });

    expect(await screen.findByText("Nem kapsz értesítést az üzenetekről")).toBeTruthy();
    expect(screen.queryByText("Kérsz értesítést a telefonodra?")).toBeNull();
  });

  it("stays away from an account that can be reached", async () => {
    withBuzinessCount(0);
    await renderWithProviders(<NotificationPrompts />, {
      store: storeWith({ prefs: { notifyEmail: true } }),
    });

    await waitFor(() =>
      expect(screen.queryByText("Nem kapsz értesítést az üzenetekről")).toBeNull(),
    );
  });

  it("disappears once a channel is switched back on", async () => {
    withBuzinessCount(0);
    const store = storeWith();
    await renderWithProviders(<NotificationPrompts />, { store });

    fireEvent.press(await screen.findByText("Kérek értesítést"));

    await waitFor(() =>
      expect(screen.queryByText("Nem kapsz értesítést az üzenetekről")).toBeNull(),
    );
  });
});
