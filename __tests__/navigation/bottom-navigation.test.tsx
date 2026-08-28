import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";

import BottomNavigation from "@/components/navigation/BottomNavigation";
import { setUnreadCounts } from "@/redux/reducers/chatReducer";
import { login, setMessagingEnabled } from "@/redux/reducers/userReducer";
import {
  __resetRouter,
  __setPathname,
  router,
} from "@/test-utils/mocks/expo-router";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));

// `Measure` only renders its child (the tutorial overlay it belongs to is
// dormant), but importing it drags in Reanimated, which needs a native
// Worklets runtime a unit test doesn't have.
jest.mock("@/components/tutorial/Measure", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const signedInStore = () => {
  const store = createTestStore();
  store.dispatch(login("me-uid"));
  return store;
};

describe("BottomNavigation", () => {
  beforeEach(() => {
    __resetRouter();
    __setPathname("/home");
  });

  it("hides the messages tab while messaging is off", async () => {
    await renderWithProviders(<BottomNavigation />, { store: signedInStore() });

    expect(screen.queryByText("Üzenetek")).toBeNull();
    expect(screen.getByText("Közösség")).toBeTruthy();
  });

  it("opens the chat list from the messages tab once messaging is on", async () => {
    const store = signedInStore();
    store.dispatch(setMessagingEnabled(true));

    await renderWithProviders(<BottomNavigation />, { store });

    fireEvent.press(screen.getByText("Üzenetek"));

    expect(router.navigate).toHaveBeenCalledWith("/chats");
  });

  it("shows the unread messages badge", async () => {
    const store = signedInStore();
    store.dispatch(setMessagingEnabled(true));
    store.dispatch(setUnreadCounts({ "other-uid": 2, "third-uid": 3 }));

    await renderWithProviders(<BottomNavigation />, { store });

    expect(screen.getByText("5")).toBeTruthy();
  });
});
