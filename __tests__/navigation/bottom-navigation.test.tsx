import { fireEvent, screen, waitFor } from "@testing-library/react-native";
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
    expect(screen.getByText("Környék")).toBeTruthy();
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

  it("shows the Mi tabs on a community route", async () => {
    await renderWithProviders(<BottomNavigation />, { store: signedInStore() });

    expect(screen.getByText("Környék")).toBeTruthy();
    expect(screen.getByText("Keresés")).toBeTruthy();
    expect(screen.getByText("Profilod")).toBeTruthy();
    expect(screen.queryByText("Otthon")).toBeNull();
    expect(screen.queryByText("Segítség")).toBeNull();
  });

  it("shows the Én tabs on a private route", async () => {
    __setPathname("/me");
    await renderWithProviders(<BottomNavigation />, { store: signedInStore() });

    expect(screen.getByText("Otthon")).toBeTruthy();
    expect(screen.getByText("Segítség")).toBeTruthy();
    expect(screen.queryByText("Környék")).toBeNull();
    expect(screen.queryByText("Profilod")).toBeNull();
  });

  it("keeps the messages tab out of the Én side", async () => {
    __setPathname("/me");
    const store = signedInStore();
    store.dispatch(setMessagingEnabled(true));
    await renderWithProviders(<BottomNavigation />, { store });

    expect(screen.queryByText("Üzenetek")).toBeNull();
  });

  it("switches from Én to the first Mi tab", async () => {
    __setPathname("/me");
    await renderWithProviders(<BottomNavigation />, { store: signedInStore() });

    fireEvent.press(screen.getByLabelText("Váltás Mi módra (közösség)"));

    // The navigation starts a frame after the switch has painted.
    await waitFor(() => expect(router.navigate).toHaveBeenCalledWith("/home"));
  });

  it("flips the switch and tabs at once, before the route has changed", async () => {
    __setPathname("/me");
    await renderWithProviders(<BottomNavigation />, { store: signedInStore() });

    await fireEvent.press(screen.getByLabelText("Váltás Mi módra (közösség)"));

    // Same route still, yet the control already shows the Mi side.
    expect(router.navigate).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Mi mód (aktív)")).toBeTruthy();
    expect(screen.getByText("Környék")).toBeTruthy();
    expect(screen.queryByText("Otthon")).toBeNull();
    await waitFor(() => expect(router.navigate).toHaveBeenCalledWith("/home"));
  });

  it("does not drop the switch when a tab was tapped just before", async () => {
    __setPathname("/me");
    await renderWithProviders(<BottomNavigation />, { store: signedInStore() });

    // Within the 300 ms tap throttle of the tabs.
    await fireEvent.press(screen.getByText("Beállítások"));
    await fireEvent.press(screen.getByLabelText("Váltás Mi módra (közösség)"));

    await waitFor(() => expect(router.navigate).toHaveBeenCalledWith("/home"));
  });

  it("goes back to the route's side when the route moves elsewhere", async () => {
    __setPathname("/me");
    const { rerender } = await renderWithProviders(<BottomNavigation />, { store: signedInStore() });

    await fireEvent.press(screen.getByLabelText("Váltás Mi módra (közösség)"));
    expect(screen.getByLabelText("Mi mód (aktív)")).toBeTruthy();

    // The route ends up on another Én page (back gesture, deep link, ...)
    // instead of the Mi side: the switch must not stay on Mi.
    __setPathname("/user/get-help");
    await rerender(<BottomNavigation />);

    expect(screen.getByLabelText("Én mód (aktív)")).toBeTruthy();
    expect(screen.queryByText("Környék")).toBeNull();
  });

  it("switches from Mi to the first Én tab", async () => {
    __setPathname("/chats");
    await renderWithProviders(<BottomNavigation />, { store: signedInStore() });

    fireEvent.press(screen.getByLabelText("Váltás Én módra (privát)"));

    await waitFor(() => expect(router.navigate).toHaveBeenCalledWith("/me"));
  });

  it("treats the help page as Én, not as the profile tab", async () => {
    __setPathname("/user/get-help");
    await renderWithProviders(<BottomNavigation />, { store: signedInStore() });

    const selected = screen
      .getAllByRole("tab")
      .filter((t) => t.props.accessibilityState?.selected);
    expect(selected).toHaveLength(1);
    expect(screen.getByText("Segítség")).toBeTruthy();
    expect(screen.queryByText("Profilod")).toBeNull();
  });

  it("shows the journal and a settings tab on the Én side", async () => {
    __setPathname("/me");
    await renderWithProviders(<BottomNavigation />, { store: signedInStore() });

    expect(screen.getByText("Napló")).toBeTruthy();
    fireEvent.press(screen.getByText("Beállítások"));

    expect(router.navigate).toHaveBeenCalledWith("/beallitasok");
  });

  it("keeps the Én side on its own settings page", async () => {
    __setPathname("/beallitasok");
    await renderWithProviders(<BottomNavigation />, { store: signedInStore() });

    expect(screen.getByText("Otthon")).toBeTruthy();
    expect(screen.queryByText("Profilod")).toBeNull();
    const selected = screen
      .getAllByRole("tab")
      .filter((t) => t.props.accessibilityState?.selected);
    expect(selected).toHaveLength(1);
  });
});
