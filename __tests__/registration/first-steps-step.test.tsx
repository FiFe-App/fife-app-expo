/**
 * Registration flow — step 6 of 6: "Első lépések".
 *
 * The confirmation e-mail links here with the Supabase tokens in the URL
 * fragment. The screen exchanges them for a session, loads the profile and
 * arms the in-app tutorial.
 */
import { screen, waitFor } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));

import FirstSteps from "@/app/csatlakozom/elso-lepesek";
import {
  __resetRouter,
  __setLocalSearchParams,
  router,
} from "@/test-utils/mocks/expo-router";
import { __resetSupabase, __setTableRow, auth } from "@/test-utils/mocks/supabase";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import { userEvent } from "@testing-library/react-native";

const CONFIRMATION_HASH = "access_token=access-123&refresh_token=refresh-456&type=signup";

const confirmedUser = { id: "user-1", email: "anna@example.com" };

const profileExists = () => {
  __setTableRow("profiles", {
    data: {
      id: confirmedUser.id,
      full_name: "Kovács Anna",
      username: "anna",
      viewed_functions: ["profilPage"],
    },
    error: null,
  });
};

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
  __setLocalSearchParams({});
  auth.setSession.mockResolvedValue({ data: { user: confirmedUser }, error: null });
});

describe("registration / first steps", () => {
  it("exchanges the tokens from the confirmation link for a session", async () => {
    profileExists();
    __setLocalSearchParams({ "#": CONFIRMATION_HASH });

    await renderWithProviders(<FirstSteps />);

    await waitFor(() =>
      expect(auth.setSession).toHaveBeenCalledWith({
        access_token: "access-123",
        refresh_token: "refresh-456",
      }),
    );
  });

  it("exchanges them exactly once, however often the screen re-renders", async () => {
    // Regression guard: the token object used to be rebuilt on every render, so
    // the effect re-ran after each of the dispatches it caused and hammered
    // `setSession`/`fetchUserProfile` in a loop.
    profileExists();
    __setLocalSearchParams({ "#": CONFIRMATION_HASH });

    await renderWithProviders(<FirstSteps />);
    await screen.findByText("Gratulálok!");

    expect(auth.setSession).toHaveBeenCalledTimes(1);
  });

  it("welcomes the user once the profile is loaded", async () => {
    profileExists();
    __setLocalSearchParams({ "#": CONFIRMATION_HASH });

    const { store } = await renderWithProviders(<FirstSteps />);

    expect(await screen.findByText("Gratulálok!")).toBeOnTheScreen();
    expect(screen.getByText("Most már te is FiFe vagy!")).toBeOnTheScreen();
    expect(store.getState().user.uid).toBe(confirmedUser.id);
    expect(store.getState().user.name).toBe("Kovács Anna");
  });

  it("arms the tutorial for the brand new account", async () => {
    profileExists();
    __setLocalSearchParams({ "#": CONFIRMATION_HASH });

    const { store } = await renderWithProviders(<FirstSteps />);

    await waitFor(() => expect(store.getState().tutorial.isTutorialStarted).toBe(true));
    expect(store.getState().tutorial.isTutorialActive).toBe(true);
  });

  describe("when Supabase rejects the confirmation link", () => {
    // A failed `/auth/v1/verify` does not send tokens back — it redirects here
    // with the reason in the fragment. Feeding that to `setSession` only
    // produces "Auth session missing!", which tells the user nothing.
    const EXPIRED_LINK_HASH =
      "error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";

    it("explains an expired link and points at a new one", async () => {
      __setLocalSearchParams({ "#": EXPIRED_LINK_HASH });

      await renderWithProviders(<FirstSteps />);

      expect(
        await screen.findByText(
          "Ez a megerősítő link lejárt, vagy már felhasználtad. Kérj egy újat!",
        ),
      ).toBeOnTheScreen();
      expect(auth.setSession).not.toHaveBeenCalled();
    });

    it("sends the user back to request a fresh confirmation e-mail", async () => {
      const user = userEvent.setup();
      __setLocalSearchParams({ "#": EXPIRED_LINK_HASH });

      await renderWithProviders(<FirstSteps />);
      await user.press(screen.getByRole("button", { name: "Megpróbálom újra" }));

      expect(router.navigate).toHaveBeenCalledWith("/csatlakozom/email-ellenorzes");
    });

    it("shows the reason Supabase gave for anything else", async () => {
      __setLocalSearchParams({
        "#": "error=server_error&error_description=Database+error+saving+new+user",
      });

      await renderWithProviders(<FirstSteps />);

      expect(
        await screen.findByText("Database error saving new user"),
      ).toBeOnTheScreen();
      expect(auth.setSession).not.toHaveBeenCalled();
    });
  });

  it("recovers when the route params only arrive after the first render", async () => {
    profileExists();

    const view = await renderWithProviders(<FirstSteps />);
    expect(screen.getByText("A regisztráció nem sikerült.")).toBeOnTheScreen();

    __setLocalSearchParams({ "#": CONFIRMATION_HASH });
    await view.rerender(<FirstSteps />);

    expect(await screen.findByText("Gratulálok!")).toBeOnTheScreen();
  });

  it("says so when the profile cannot be loaded, rather than spinning forever", async () => {
    __setTableRow("profiles", { data: null, error: null });
    __setLocalSearchParams({ "#": CONFIRMATION_HASH });

    await renderWithProviders(<FirstSteps />);

    expect(await screen.findByText("Valami hiba történt!")).toBeOnTheScreen();
  });

  it("reports a rejected confirmation link", async () => {
    auth.setSession.mockResolvedValue({
      data: { user: null },
      error: { message: "Token has expired or is invalid" },
    });
    __setLocalSearchParams({ "#": CONFIRMATION_HASH });

    await renderWithProviders(<FirstSteps />);

    expect(await screen.findByText("Valami hiba történt!")).toBeOnTheScreen();
    expect(screen.getByText("Token has expired or is invalid")).toBeOnTheScreen();
  });

  it("offers a retry when the screen is opened without tokens or a session", async () => {
    const user = userEvent.setup();

    await renderWithProviders(<FirstSteps />);

    expect(screen.getByText("A regisztráció nem sikerült.")).toBeOnTheScreen();
    expect(auth.setSession).not.toHaveBeenCalled();

    await user.press(screen.getByRole("button", { name: "Megpróbálom újra" }));
    expect(router.navigate).toHaveBeenCalledWith("/csatlakozom/regisztracio");
  });
});
