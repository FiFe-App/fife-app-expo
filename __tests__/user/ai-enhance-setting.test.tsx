/**
 * The "AI-s megtalálhatóság" switch on the settings tab.
 *
 * The same switch is repeated on the biznisz editor and in the search refine
 * modal, and all three write one global row column — so what matters here is
 * that flipping it reaches `user_settings` straight away. The edge functions
 * read that column on the very next save or search, which is why this cannot
 * go through useUserSettings' debounced push.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
// Leaf native modules pulled in by useNotificationPrefs. Nothing here touches
// them — aiEnhance is not push-backed — but importing the real ones warns and
// registers listeners.
jest.mock("@/lib/notifications/registerForPushNotifications", () => ({
  ensureNotificationPermission: jest.fn().mockResolvedValue(true),
  registerForPushNotificationsAsync: jest.fn().mockResolvedValue(null),
}));
jest.mock("@/lib/notifications/scheduleDailyEmotionReminder", () => ({
  scheduleDailyEmotionReminder: jest.fn().mockResolvedValue(undefined),
  cancelDailyEmotionReminder: jest.fn().mockResolvedValue(undefined),
}));

import BeallitasokTab from "@/components/user/edit/BeallitasokTab";
import { AI_ENHANCE_LABEL } from "@/constants/aiEnhance";
import { DEFAULT_NOTIFICATION_PREFS } from "@/hooks/useNotificationPrefs";
import { login, setNotificationPrefs } from "@/redux/reducers/userReducer";
import { __resetSupabase, auth, supabase } from "@/test-utils/mocks/supabase";
import {
  createTestStore,
  renderWithProviders,
  type TestStore,
} from "@/test-utils/renderWithProviders";

const storeWith = (aiEnhance: boolean): TestStore => {
  const store = createTestStore();
  store.dispatch(login("me"));
  store.dispatch(setNotificationPrefs({ ...DEFAULT_NOTIFICATION_PREFS, aiEnhance }));
  return store;
};

/** Columns of the last `user_settings` update. */
const lastPrefsUpdate = () => {
  const written = supabase.from.mock.results
    .map((r, i) => ({ table: supabase.from.mock.calls[i][0], builder: r.value }))
    .filter(({ builder }) => (builder.update as jest.Mock).mock.calls.length > 0);
  const last = written[written.length - 1];
  expect(last.table).toBe("user_settings");
  const updateCalls = (last.builder.update as jest.Mock).mock.calls;
  return updateCalls[updateCalls.length - 1][0];
};

/** The switch sitting in the row labelled with the setting's name. */
const aiSwitch = () => {
  const label = screen.getByText(AI_ENHANCE_LABEL);
  const row = label.parent?.parent;
  if (!row) throw new Error("The AI setting row has no switch beside it");
  return screen.getAllByRole("switch").find((node) => {
    let current = node.parent;
    while (current) {
      if (current === row) return true;
      current = current.parent;
    }
    return false;
  });
};

beforeEach(() => {
  __resetSupabase();
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
});

describe("the AI setting on the settings tab", () => {
  it("shows the switch on, reflecting the stored preference", async () => {
    await renderWithProviders(<BeallitasokTab />, { store: storeWith(true) });

    expect(await screen.findByText(AI_ENHANCE_LABEL)).toBeOnTheScreen();
    expect(aiSwitch()?.props.value).toBe(true);
  });

  it("writes the column immediately when switched off", async () => {
    const { store } = await renderWithProviders(<BeallitasokTab />, {
      store: storeWith(true),
    });

    const toggle = aiSwitch();
    fireEvent(toggle!, "valueChange", false);

    await waitFor(() => expect(lastPrefsUpdate().ai_enhance).toBe(false));
    // Answering here also silences the prompt card on /me.
    expect(lastPrefsUpdate().ai_asked_at).toEqual(expect.any(String));
    expect(store.getState().user.notificationPrefs?.aiEnhance).toBe(false);
  });

  it("stays untouchable until the stored value has arrived", async () => {
    // Without prefs in the store the hook serves its defaults, and a tap would
    // write "off" over a setting the user may have had on.
    const store = createTestStore();
    store.dispatch(login("me"));

    await renderWithProviders(<BeallitasokTab />, { store });

    expect(aiSwitch()?.props.disabled).toBe(true);
  });

  it("writes it back on when switched on", async () => {
    await renderWithProviders(<BeallitasokTab />, { store: storeWith(false) });

    fireEvent(aiSwitch()!, "valueChange", true);

    await waitFor(() => expect(lastPrefsUpdate().ai_enhance).toBe(true));
  });
});
