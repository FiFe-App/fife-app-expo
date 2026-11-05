/**
 * The Én side's "Beállítások" menu item opens Profil on its Beállítások tab
 * through `?tab=beallitasok`.
 */
import { screen, waitFor } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/notifications/registerForPushNotifications", () => ({
  ensureNotificationPermission: jest.fn().mockResolvedValue(true),
  registerForPushNotificationsAsync: jest.fn().mockResolvedValue(null),
}));
jest.mock("@/lib/notifications/scheduleDailyEmotionReminder", () => ({
  scheduleDailyEmotionReminder: jest.fn().mockResolvedValue(undefined),
  cancelDailyEmotionReminder: jest.fn().mockResolvedValue(undefined),
}));

// The map and contact editors need native modules; the tabs are what is tested.
jest.mock("@/components/MapSelector/MapSelector", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View, Marker: View };
});
jest.mock("@/components/mapView/FiFeMap", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View, Marker: View };
});
jest.mock("@/components/mapView/mapView", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View, Marker: View };
});
jest.mock("@/components/buziness/ContactEditScreen", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View, Marker: View };
});

import ProfileEditScreen from "@/app/user/edit";
import { login } from "@/redux/reducers/userReducer";
import { __resetRouter, __setLocalSearchParams, __setPathname } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, __setTableRows, auth } from "@/test-utils/mocks/supabase";
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
  __setPathname("/user/edit");
  __setTableRows("profiles", {
    data: [{ id: "member-1", full_name: "Teszt Elek", username: "teszt", created_at: "2025-01-01T00:00:00Z" }],
    error: null,
  });
});

/** The tab header button whose label is `label`, and whether it is selected. */
const tabSelected = (label: string) => {
  const header = screen
    .getAllByRole("button")
    .find((b) => b.props.accessibilityState?.selected !== undefined && screen.queryAllByText(label).some((t) => {
      let n = t.parent;
      while (n) { if (n === b) return true; n = n.parent; }
      return false;
    }));
  if (!header) throw new Error(`No tab header for ${label}`);
  return header.props.accessibilityState.selected;
};

describe("Profil tabs from the URL", () => {
  it("opens on Beállítások with ?tab=beallitasok", async () => {
    __setLocalSearchParams({ tab: "beallitasok" });
    await renderWithProviders(<ProfileEditScreen />, { store: signedIn() });

    await waitFor(() => expect(tabSelected("Beállítások")).toBe(true));
    expect(tabSelected("Adatok")).toBe(false);
  });

  it("opens on Adatok without a tab parameter", async () => {
    await renderWithProviders(<ProfileEditScreen />, { store: signedIn() });

    await waitFor(() => expect(tabSelected("Adatok")).toBe(true));
    expect(tabSelected("Beállítások")).toBe(false);
  });

  it("ignores an unknown tab", async () => {
    __setLocalSearchParams({ tab: "valami" });
    await renderWithProviders(<ProfileEditScreen />, { store: signedIn() });

    await waitFor(() => expect(tabSelected("Adatok")).toBe(true));
  });
});
