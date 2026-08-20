import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";
import { router } from "expo-router";

import NotificationPrompts from "@/components/notifications/NotificationPrompts";
import { DEFAULT_NOTIFICATION_PREFS } from "@/hooks/useNotificationPrefs";
import { dismissHomeAddBuzinessCard } from "@/redux/reducers/appReducer";
import { login, setNotificationPrefs } from "@/redux/reducers/userReducer";
import { __resetSupabase, __setTableRows } from "@/test-utils/mocks/supabase";
import {
  createTestStore,
  renderWithProviders,
  type TestStore,
} from "@/test-utils/renderWithProviders";

jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));
jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/notifications/registerForPushNotifications", () => ({
  ensureNotificationPermission: jest.fn().mockResolvedValue(true),
  registerForPushNotificationsAsync: jest.fn().mockResolvedValue(null),
}));
jest.mock("@/lib/notifications/scheduleDailyEmotionReminder", () => ({
  scheduleDailyEmotionReminder: jest.fn().mockResolvedValue(undefined),
  cancelDailyEmotionReminder: jest.fn().mockResolvedValue(undefined),
}));

const setPlatform = (os: "ios" | "web") =>
  Object.defineProperty(Platform, "OS", { value: os, configurable: true });
const originalOS = Platform.OS;

/** Every notification question already answered, so the queue reaches the end. */
const allNotificationsAnswered = {
  pushAskedAt: "2026-08-01T10:00:00.000Z",
  emotionPromptAskedAt: "2026-08-01T10:00:00.000Z",
  newsletterAskedAt: "2026-08-01T10:00:00.000Z",
};

const storeWith = (prefs: Partial<typeof DEFAULT_NOTIFICATION_PREFS>): TestStore => {
  const store = createTestStore();
  store.dispatch(login("me"));
  store.dispatch(setNotificationPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...prefs }));
  return store;
};

/** How many bizniszek the `useHasBuziness` head-count query reports. */
const withBuzinessCount = (count: number) =>
  __setTableRows("buziness", { data: null, error: null, count });

beforeEach(() => {
  __resetSupabase();
  setPlatform("ios");
  withBuzinessCount(0);
  (router.push as jest.Mock).mockClear?.();
});

afterAll(() => setPlatform(originalOS as "ios" | "web"));

describe("the biznisz upload prompt", () => {
  it("appears once every notification question has been answered", async () => {
    await renderWithProviders(<NotificationPrompts />, {
      store: storeWith(allNotificationsAnswered),
    });
    expect(await screen.findByText("Töltsd fel a bizniszed")).toBeTruthy();
  });

  it("waits its turn behind an unanswered notification ask", async () => {
    await renderWithProviders(<NotificationPrompts />, {
      store: storeWith({ ...allNotificationsAnswered, newsletterAskedAt: null }),
    });
    expect(await screen.findByText("Kérsz hírlevelet?")).toBeTruthy();
    expect(screen.queryByText("Töltsd fel a bizniszed")).toBeNull();
  });

  it("stays hidden for someone who already has a biznisz", async () => {
    withBuzinessCount(3);
    await renderWithProviders(<NotificationPrompts />, {
      store: storeWith(allNotificationsAnswered),
    });
    await waitFor(() =>
      expect(screen.queryByText("Töltsd fel a bizniszed")).toBeNull(),
    );
  });

  it("stays hidden when the count query fails, rather than guessing", async () => {
    __setTableRows("buziness", { data: null, error: { message: "boom" }, count: null });
    await renderWithProviders(<NotificationPrompts />, {
      store: storeWith(allNotificationsAnswered),
    });
    await waitFor(() =>
      expect(screen.queryByText("Töltsd fel a bizniszed")).toBeNull(),
    );
  });

  it("stays hidden once dismissed", async () => {
    const store = storeWith(allNotificationsAnswered);
    store.dispatch(dismissHomeAddBuzinessCard());
    await renderWithProviders(<NotificationPrompts />, { store });
    await waitFor(() =>
      expect(screen.queryByText("Töltsd fel a bizniszed")).toBeNull(),
    );
  });

  it("records the dismissal so it does not come back", async () => {
    const { store } = await renderWithProviders(<NotificationPrompts />, {
      store: storeWith(allNotificationsAnswered),
    });
    fireEvent.press(await screen.findByText("Most nem"));
    await waitFor(() =>
      expect(store.getState().app.homeAddBuzinessCardDismissed).toBe(true),
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it("opens the upload form and dismisses itself when accepted", async () => {
    const { store } = await renderWithProviders(<NotificationPrompts />, {
      store: storeWith(allNotificationsAnswered),
    });
    fireEvent.press(await screen.findByText("Feltöltöm"));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/biznisz/new"));
    // Tapping through is an answer: abandoning the form must not re-ask.
    expect(store.getState().app.homeAddBuzinessCardDismissed).toBe(true);
  });

  it("is offered on web, unlike the push-backed asks", async () => {
    setPlatform("web");
    await renderWithProviders(<NotificationPrompts />, {
      store: storeWith({ ...allNotificationsAnswered, pushAskedAt: null }),
    });
    // pushAskedAt is null but push prompts are native-only, so the queue
    // should fall through to the biznisz card rather than showing nothing.
    expect(await screen.findByText("Töltsd fel a bizniszed")).toBeTruthy();
  });
});
