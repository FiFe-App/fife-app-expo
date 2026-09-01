/**
 * The legal documents in Profil → Beállítások.
 *
 * They used to be reachable only from the registration flow, so somebody who
 * already had an account could not read them again — and Google Play expects
 * the child-safety policy to stay reachable, not to be shown once at signup.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { openBrowserAsync } from "expo-web-browser";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
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

describe("the legal documents in Beállítások", () => {
  it("lists every document the app has", async () => {
    await renderWithProviders(<BeallitasokTab />, { store: signedIn() });

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
    await renderWithProviders(<BeallitasokTab />, { store: signedIn() });

    fireEvent.press(await screen.findByText(label));

    await waitFor(() => expect(openBrowserAsync).toHaveBeenCalledWith(url));
  });

  it("keeps them above the danger zone, not buried under it", async () => {
    // Deleting your account sits at the very bottom on purpose; the documents
    // have to come before it.
    await renderWithProviders(<BeallitasokTab />, { store: signedIn() });

    await screen.findByText("Jogi dokumentumok");
    // Matches come back in tree order, so the first of the two headings is the
    // one rendered first.
    const headings = screen.getAllByText(/^(Jogi dokumentumok|Veszélyes szekció)$/);

    expect(headings).toHaveLength(2);
    expect(headings[0].props.children).toBe("Jogi dokumentumok");
  });
});
