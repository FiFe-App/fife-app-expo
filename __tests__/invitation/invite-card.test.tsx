/**
 * The card on the home screen that hands a member their invite link.
 */
import { fireEvent, screen } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
}));

import InviteCard from "@/components/InviteCard";
import { dismissInviteCard, login } from "@/redux/reducers/userReducer";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

const MY_UID = "member-1";
const MY_LINK = `https://fifeapp.hu/meghivo/${MY_UID}`;

const signedIn = () => {
  const store = createTestStore();
  store.dispatch(login(MY_UID));
  return store;
};

describe("invitation / invite card", () => {
  it("offers the member's own link, so the invite can be credited to them", async () => {
    const store = signedIn();

    await renderWithProviders(<InviteCard />, { store });
    await fireEvent.press(screen.getByText("Hívd meg a barátaidat!"));

    expect(store.getState().info.dialogs[0].text).toContain(MY_LINK);
  });

  it("copies that link, not the bare site address", async () => {
    const store = signedIn();

    await renderWithProviders(<InviteCard />, { store });
    await fireEvent.press(screen.getByText("Hívd meg a barátaidat!"));
    await store.getState().info.dialogs[0].onSubmit();

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(MY_LINK);
  });

  it("stays dismissed", async () => {
    const store = signedIn();
    store.dispatch(dismissInviteCard());

    await renderWithProviders(<InviteCard />, { store });

    expect(screen.queryByText("Hívd meg a barátaidat!")).toBeNull();
  });
});
