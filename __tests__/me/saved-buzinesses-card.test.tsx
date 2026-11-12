import { fireEvent, screen } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/notifications/registerForPushNotifications", () => ({
  ensureNotificationPermission: jest.fn().mockResolvedValue(true),
  registerForPushNotificationsAsync: jest.fn().mockResolvedValue(null),
}));
jest.mock("@/lib/notifications/scheduleDailyEmotionReminder", () => ({
  scheduleDailyEmotionReminder: jest.fn().mockResolvedValue(undefined),
  cancelDailyEmotionReminder: jest.fn().mockResolvedValue(undefined),
}));
// The cards around it have their own tests and their own native needs.
jest.mock("@/components/EmotionCheckCard", () => () => null);
jest.mock("@/components/notifications/NotificationPrompts", () => () => null);
jest.mock("@/components/Mantra", () => () => null);
jest.mock("@/components/ToDoList", () => () => null);

import MeScreen from "@/app/me";
import { addSavedBuziness, login } from "@/redux/reducers/userReducer";
import { __resetRouter, router } from "@/test-utils/mocks/expo-router";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

const storeWithSaved = (ids: number[]) => {
  const store = createTestStore();
  store.dispatch(login("me"));
  ids.forEach((id) => store.dispatch(addSavedBuziness(id)));
  return store;
};

beforeEach(() => __resetRouter());

describe("the saved bizniszek card on Én home", () => {
  it("shows how many are saved", async () => {
    await renderWithProviders(<MeScreen />, { store: storeWithSaved([1, 2, 3]) });

    expect(screen.getByText("Elmentett bizniszek")).toBeTruthy();
    expect(screen.getByText("3 db")).toBeTruthy();
  });

  it("shows zero when nothing is saved", async () => {
    await renderWithProviders(<MeScreen />, { store: storeWithSaved([]) });

    expect(screen.getByText("0 db")).toBeTruthy();
  });

  it("opens the saved list", async () => {
    await renderWithProviders(<MeScreen />, { store: storeWithSaved([7]) });

    fireEvent.press(screen.getByText("Elmentett bizniszek"));

    expect(router.navigate).toHaveBeenCalledWith("/user/saved-buzinesses");
  });
});
