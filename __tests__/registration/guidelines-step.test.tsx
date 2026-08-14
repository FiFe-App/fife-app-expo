/**
 * Registration flow — step 2 of 6: "Irányelvek".
 *
 * Two separate things happen here:
 *  - `canGoNext` is pushed onto the route params, which is what unlocks the
 *    wizard's "Tovább" button (see wizard-navigation.test.tsx);
 *  - `policiesAccepted` is only committed to Redux once the user both confirms
 *    their age *and* types the pledge. The sign-up step later sends the
 *    negation of that flag to Supabase as `bad_boy`.
 */
import { fireEvent, screen } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));

import Iranyelvek from "@/app/csatlakozom/iranyelvek";
import { acceptPolicies } from "@/redux/reducers/infoReducer";
import { __resetRouter, router } from "@/test-utils/mocks/expo-router";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

const PLEDGE = "Nem leszek rosszindulatú";
const AGE_CONFIRMATION = "Nyilatkozom, hogy elmúltam 16 éves.";

const pledgeInput = () => screen.getByDisplayValue("");

beforeEach(() => {
  __resetRouter();
});

describe("registration / community guidelines", () => {
  it("lists the guidelines the user has to agree to", async () => {
    await renderWithProviders(<Iranyelvek />);

    expect(screen.getByText("- Nem leszek rosszindulatú senkivel!")).toBeOnTheScreen();
    expect(
      screen.getByText("- Saját és mások érdekeit is figyelembe veszem!"),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        "- Ha valaki valaki bántóan viselkedik velem vagy mással, jelentem!",
      ),
    ).toBeOnTheScreen();
  });

  it("blocks the wizard until the user confirms their age", async () => {
    await renderWithProviders(<Iranyelvek />);

    expect(router.setParams).toHaveBeenCalledWith({ canGoNext: undefined });

    await fireEvent.press(screen.getByText(AGE_CONFIRMATION));

    expect(router.setParams).toHaveBeenLastCalledWith({ canGoNext: "true" });
  });

  it("only accepts characters that continue the pledge", async () => {
    await renderWithProviders(<Iranyelvek />);
    const input = pledgeInput();

    await fireEvent.changeText(input, "Nem");
    expect(input).toHaveDisplayValue("Nem");

    // A wrong character is dropped: the value stays where it was.
    await fireEvent.changeText(input, "Nemx");
    expect(input).toHaveDisplayValue("Nem");

    await fireEvent.changeText(input, "Nem l");
    expect(input).toHaveDisplayValue("Nem l");
  });

  it("ignores the spacing the user types, since the ghost text supplies it", async () => {
    await renderWithProviders(<Iranyelvek />);
    const input = pledgeInput();

    await fireEvent.changeText(input, "Neml");

    expect(input).toHaveDisplayValue("Nem l");
  });

  it("records the accepted policies once age and pledge are both given", async () => {
    const { store } = await renderWithProviders(<Iranyelvek />);

    await fireEvent.changeText(pledgeInput(), PLEDGE);
    expect(store.getState().info.policiesAccepted).toBe(false);

    await fireEvent.press(screen.getByText(AGE_CONFIRMATION));

    expect(store.getState().info.policiesAccepted).toBe(true);
  });

  it("does not accept the policies from the age confirmation alone", async () => {
    const { store } = await renderWithProviders(<Iranyelvek />);

    await fireEvent.press(screen.getByText(AGE_CONFIRMATION));

    // The wizard lets them through, but they are flagged as `bad_boy` at sign-up.
    expect(router.setParams).toHaveBeenLastCalledWith({ canGoNext: "true" });
    expect(store.getState().info.policiesAccepted).toBe(false);
  });

  it("restores the pledge for a user who already accepted", async () => {
    const store = createTestStore();
    store.dispatch(acceptPolicies());

    await renderWithProviders(<Iranyelvek />, { store });

    expect(screen.getByDisplayValue(PLEDGE)).toBeOnTheScreen();
    expect(router.setParams).toHaveBeenCalledWith({ canGoNext: "true" });
  });
});
