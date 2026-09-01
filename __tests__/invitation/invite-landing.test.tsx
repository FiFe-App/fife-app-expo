/**
 * The page an invite link opens: https://fifeapp.hu/meghivo/<inviter uid>.
 *
 * Whoever follows the link is a stranger to the app, so the page has to make
 * two things true at once — show them somebody they recognise, and remember
 * that member long enough for the registration to credit them at the end.
 */
import { fireEvent, screen } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));

import Invitation from "@/app/meghivo/[uid]";
import { login } from "@/redux/reducers/userReducer";
import {
  __resetRouter,
  __setLocalSearchParams,
  router,
} from "@/test-utils/mocks/expo-router";
import { __resetSupabase, __setTableRow } from "@/test-utils/mocks/supabase";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

const INVITER = {
  id: "inviter-1",
  full_name: "Kovács Anna",
  username: "anna",
  avatar_url: "avatar.jpg",
};

const inviterExists = () => {
  __setTableRow("profiles", { data: INVITER, error: null });
};

const inviterMissing = () => {
  __setTableRow("profiles", { data: null, error: null });
};

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
  __setLocalSearchParams({ uid: INVITER.id });
});

describe("invitation / landing page", () => {
  it("introduces the member who sent the invite", async () => {
    inviterExists();

    await renderWithProviders(<Invitation />);

    expect(
      await screen.findByText("Kovács Anna meghívott a FiFe Appba!"),
    ).toBeOnTheScreen();
  });

  it("falls back to the username when the profile has no full name", async () => {
    __setTableRow("profiles", {
      data: { ...INVITER, full_name: null },
      error: null,
    });

    await renderWithProviders(<Invitation />);

    expect(await screen.findByText("anna meghívott a FiFe Appba!")).toBeOnTheScreen();
  });

  it("starts the registration flow and remembers who invited the visitor", async () => {
    inviterExists();
    const { store } = await renderWithProviders(<Invitation />);
    await screen.findByText("Kovács Anna meghívott a FiFe Appba!");

    await fireEvent.press(screen.getByRole("button", { name: "Csatlakozom" }));

    expect(store.getState().app.invitedBy).toBe(INVITER.id);
    expect(router.push).toHaveBeenCalledWith("/csatlakozom");
  });

  it("still lets a visitor join when the inviter no longer exists", async () => {
    inviterMissing();
    const { store } = await renderWithProviders(<Invitation />);

    expect(await screen.findByText("Ez a meghívó már nem él.")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Csatlakozom" }));

    // Nobody to credit: the flow starts without an inviter rather than
    // carrying the uid of a profile that isn't there.
    expect(store.getState().app.invitedBy).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith("/csatlakozom");
  });

  it("offers a signed-in visitor the profile instead of a second registration", async () => {
    inviterExists();
    const store = createTestStore();
    store.dispatch(login("someone-else"));

    await renderWithProviders(<Invitation />, { store });
    await screen.findByText("Kovács Anna meghívott a FiFe Appba!");

    expect(screen.queryByRole("button", { name: "Csatlakozom" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Megnézem a profilját" }),
    ).toBeOnTheScreen();
    expect(store.getState().app.invitedBy).toBeNull();
  });

  it("tells a member opening their own link what their guests will see", async () => {
    inviterExists();
    const store = createTestStore();
    store.dispatch(login(INVITER.id));

    await renderWithProviders(<Invitation />, { store });
    await screen.findByText("Kovács Anna meghívott a FiFe Appba!");

    expect(
      screen.getByText("Ezt látja majd az, akinek elküldöd a meghívódat."),
    ).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Csatlakozom" })).toBeNull();
  });
});
