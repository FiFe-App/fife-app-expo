import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";

import SideNavigation from "@/components/navigation/SideNavigation";
import { setUnreadCounts } from "@/redux/reducers/chatReducer";
import { login, setMessagingEnabled } from "@/redux/reducers/userReducer";
import {
  __resetRouter,
  __setPathname,
  router,
} from "@/test-utils/mocks/expo-router";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));

const signedInStore = () => {
  const store = createTestStore();
  store.dispatch(login("me-uid"));
  return store;
};

describe("SideNavigation", () => {
  beforeEach(() => {
    __resetRouter();
    __setPathname("/home");
  });

  it("shows the Mi items on a community route", async () => {
    await renderWithProviders(<SideNavigation />, { store: signedInStore() });

    expect(screen.getByText("Környék")).toBeTruthy();
    expect(screen.getByText("Keresés")).toBeTruthy();
    expect(screen.queryByText("Otthon")).toBeNull();
    expect(screen.queryByText("Üzenetek")).toBeNull();
  });

  it("shows the Én items on a private route", async () => {
    __setPathname("/me");
    await renderWithProviders(<SideNavigation />, { store: signedInStore() });

    expect(screen.getByText("Otthon")).toBeTruthy();
    expect(screen.getByText("Beállítások")).toBeTruthy();
    expect(screen.queryByText("Környék")).toBeNull();
  });

  it("navigates and shows the unread badge once messaging is on", async () => {
    const store = signedInStore();
    store.dispatch(setMessagingEnabled(true));
    store.dispatch(setUnreadCounts({ "other-uid": 2, "third-uid": 3 }));

    await renderWithProviders(<SideNavigation />, { store });

    expect(screen.getByText("5")).toBeTruthy();
    fireEvent.press(screen.getByText("Üzenetek"));
    expect(router.navigate).toHaveBeenCalledWith("/chats");
  });
});
