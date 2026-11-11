/**
 * The legal documents in Én › Beállítások ("Ezen a telefonon").
 *
 * They used to be reachable only from the registration flow, so somebody who
 * already had an account could not read them again — and Google Play expects
 * the child-safety policy to stay reachable, not to be shown once at signup.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { openBrowserAsync } from "expo-web-browser";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/appLock", () => ({
  authenticateOwner: jest.fn(),
  deviceLockAvailable: jest.fn(),
}));
// Leaf native modules pulled in through useNotificationPrefs; nothing here
// touches them.
jest.mock("@/lib/notifications/registerForPushNotifications", () => ({
  ensureNotificationPermission: jest.fn().mockResolvedValue(true),
  registerForPushNotificationsAsync: jest.fn().mockResolvedValue(null),
}));
jest.mock("@/lib/notifications/scheduleDailyEmotionReminder", () => ({
  scheduleDailyEmotionReminder: jest.fn().mockResolvedValue(undefined),
  cancelDailyEmotionReminder: jest.fn().mockResolvedValue(undefined),
}));

import EnSettings from "@/components/settings/EnSettings";
import BeallitasokTab from "@/components/user/edit/BeallitasokTab";
import { CSAE_URL, LEGAL_DOCUMENTS, PRIVACY_URL, TERMS_URL } from "@/constants/legal";
import { login } from "@/redux/reducers/userReducer";
import { __resetSupabase, auth } from "@/test-utils/mocks/supabase";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

const signedIn = () => {
  const store = createTestStore();
  store.dispatch(login("member-1"));
  return store;
};

beforeEach(() => {
  __resetSupabase();
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
});

describe("the legal documents in the Én settings", () => {
  it("lists every document the app has", async () => {
    await renderWithProviders(<EnSettings />, { store: signedIn() });

    expect(await screen.findByText("Jogi dokumentumok")).toBeOnTheScreen();
    for (const document of LEGAL_DOCUMENTS) {
      expect(screen.getByText(document.label)).toBeOnTheScreen();
    }
  });

  it.each([
    ["Felhasználási feltételek", TERMS_URL],
    ["Adatkezelési tájékoztató", PRIVACY_URL],
    ["Gyermekvédelmi irányelvek (CSAE)", CSAE_URL],
  ])("opens %s", async (label, url) => {
    await renderWithProviders(<EnSettings />, { store: signedIn() });

    fireEvent.press(await screen.findByText(label));

    await waitFor(() => expect(openBrowserAsync).toHaveBeenCalledWith(url));
  });

  it("are not on the account's settings, which link to the Én side instead", async () => {
    await renderWithProviders(<BeallitasokTab />, { store: signedIn() });

    expect(await screen.findByText("Én oldal beállításai")).toBeOnTheScreen();
    expect(screen.queryByText("Jogi dokumentumok")).toBeNull();
  });
});
