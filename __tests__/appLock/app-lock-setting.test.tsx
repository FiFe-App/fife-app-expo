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
import { authenticateOwner, deviceLockAvailable } from "@/lib/appLock";
import { setAppLockEnabled } from "@/redux/reducers/appReducer";
import { login } from "@/redux/reducers/userReducer";
import { __resetSupabase, auth } from "@/test-utils/mocks/supabase";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

const authenticate = authenticateOwner as jest.Mock;
const available = deviceLockAvailable as jest.Mock;

const setup = async (enabled = false) => {
  const store = createTestStore();
  store.dispatch(login("me"));
  store.dispatch(setAppLockEnabled(enabled));
  await renderWithProviders(<EnSettings />, { store });
  return store;
};

beforeEach(() => {
  __resetSupabase();
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  authenticate.mockReset();
  available.mockReset().mockResolvedValue(true);
});

describe("the App-zár switch", () => {
  it("turns on only after the owner is confirmed", async () => {
    authenticate.mockResolvedValue(true);
    const store = await setup();

    fireEvent(screen.getByLabelText("App-zár"), "valueChange", true);

    await waitFor(() => expect(store.getState().app.appLockEnabled).toBe(true));
    expect(authenticate).toHaveBeenCalledWith("App-zár bekapcsolása");
  });

  it("stays off when the confirmation is cancelled", async () => {
    authenticate.mockResolvedValue(false);
    const store = await setup();

    fireEvent(screen.getByLabelText("App-zár"), "valueChange", true);

    await waitFor(() => expect(authenticate).toHaveBeenCalled());
    expect(store.getState().app.appLockEnabled).toBe(false);
  });

  it("explains instead when the phone has no screen lock", async () => {
    available.mockResolvedValue(false);
    const store = await setup();

    fireEvent(screen.getByLabelText("App-zár"), "valueChange", true);

    await waitFor(() =>
      expect(store.getState().info.dialogs?.[0]?.title).toBe("Nincs képernyőzár a telefonodon"),
    );
    expect(authenticate).not.toHaveBeenCalled();
    expect(store.getState().app.appLockEnabled).toBe(false);
  });

  it("needs the owner to switch it off too", async () => {
    authenticate.mockResolvedValue(true);
    const store = await setup(true);

    fireEvent(screen.getByLabelText("App-zár"), "valueChange", false);

    await waitFor(() => expect(store.getState().app.appLockEnabled).toBe(false));
    expect(authenticate).toHaveBeenCalledWith("App-zár kikapcsolása");
  });
});
