/**
 * The permanent invite link in Profil → Beállítások.
 *
 * The home screen's InviteCard can be dismissed for good, which used to take
 * the member's link with it. This section is the copy that is always there, and
 * it has to hand out exactly the same link.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
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

import BeallitasokTab from "@/components/user/edit/BeallitasokTab";
import { login } from "@/redux/reducers/userReducer";
import { __resetSupabase, auth } from "@/test-utils/mocks/supabase";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

const MY_UID = "member-1";
const MY_LINK = `https://fifeapp.hu/meghivo/${MY_UID}`;

const signedIn = () => {
  const store = createTestStore();
  store.dispatch(login(MY_UID));
  return store;
};

beforeEach(() => {
  __resetSupabase();
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
});

describe("invitation / the settings section", () => {
  it("is there whether or not the home card was dismissed", async () => {
    await renderWithProviders(<BeallitasokTab />, { store: signedIn() });

    expect(await screen.findByText("Hívd meg a barátaidat")).toBeOnTheScreen();
    expect(screen.getByText("Link másolása")).toBeOnTheScreen();
  });

  it("copies the member's own invite link", async () => {
    await renderWithProviders(<BeallitasokTab />, { store: signedIn() });

    fireEvent.press(await screen.findByText("Link másolása"));

    await waitFor(() =>
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(MY_LINK),
    );
  });

  it("confirms the copy, so the tap is not silent", async () => {
    const { store } = await renderWithProviders(<BeallitasokTab />, {
      store: signedIn(),
    });

    fireEvent.press(await screen.findByText("Link másolása"));

    await waitFor(() =>
      expect(store.getState().info.snacks).toContainEqual(
        expect.objectContaining({ title: "Meghívó vágólapon" }),
      ),
    );
  });
});
