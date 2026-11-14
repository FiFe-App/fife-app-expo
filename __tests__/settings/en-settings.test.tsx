/**
 * Én › Beállítások ("Ezen a telefonon") against Profil › Beállítások: what
 * belongs to the phone is on the first, what belongs to the account on the
 * second, and each links to the other.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/notifications/registerForPushNotifications", () => ({
  ensureNotificationPermission: jest.fn().mockResolvedValue(true),
  registerForPushNotificationsAsync: jest.fn().mockResolvedValue(null),
}));
jest.mock("@/lib/notifications/scheduleDailyEmotionReminder", () => ({
  scheduleDailyEmotionReminder: jest.fn().mockResolvedValue(undefined),
  cancelDailyEmotionReminder: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/appLock", () => ({
  authenticateOwner: jest.fn(),
  deviceLockAvailable: jest.fn(),
}));

import EnSettings from "@/components/settings/EnSettings";
import BeallitasokTab from "@/components/user/edit/BeallitasokTab";
import { login } from "@/redux/reducers/userReducer";
import { __resetRouter, router } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, auth } from "@/test-utils/mocks/supabase";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

const signedIn = () => {
  const store = createTestStore();
  store.dispatch(login("member-1"));
  return store;
};

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
});

describe("Én settings", () => {
  it("holds the phone's own switches", async () => {
    await renderWithProviders(<EnSettings />, { store: signedIn() });

    expect(screen.getByLabelText("Push értesítések")).toBeTruthy();
    expect(screen.getByLabelText("Hangulatnapló esti kérdés")).toBeTruthy();
    expect(screen.getByLabelText("App-zár")).toBeTruthy();
    expect(screen.getByLabelText("Téma kiválasztása")).toBeTruthy();
  });

  it("signs out from here too", async () => {
    const store = signedIn();
    await renderWithProviders(<EnSettings />, { store });

    fireEvent.press(screen.getByText("Kijelentkezés"));

    await waitFor(() => expect(router.navigate).toHaveBeenCalledWith("/"));
    expect(auth.signOut).toHaveBeenCalled();
    expect(store.getState().user.uid).toBeFalsy();
  });

  it("links to the account's settings on the Mi side", async () => {
    await renderWithProviders(<EnSettings />, { store: signedIn() });

    fireEvent.press(screen.getByText("Profilod, e-mail és közösségi beállítások"));

    expect(router.navigate).toHaveBeenCalledWith("/user/edit?tab=beallitasok");
  });
});

describe("Profil › Beállítások", () => {
  it("keeps only the account's settings", async () => {
    await renderWithProviders(<BeallitasokTab />, { store: signedIn() });

    expect(await screen.findByText("Email értesítések")).toBeTruthy();
    expect(screen.queryByText("Push értesítések")).toBeNull();
    expect(screen.queryByText("App-zár")).toBeNull();
    expect(screen.queryByLabelText("Téma kiválasztása")).toBeNull();
  });

  it("links back to the Én settings", async () => {
    await renderWithProviders(<BeallitasokTab />, { store: signedIn() });

    fireEvent.press(await screen.findByText("Én oldal beállításai"));

    expect(router.navigate).toHaveBeenCalledWith("/beallitasok");
  });
});
