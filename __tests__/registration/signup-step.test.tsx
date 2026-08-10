/**
 * Registration flow — step 4 of 6: "E-mail regisztráció".
 *
 * This is the step that actually creates the account. Everything the earlier
 * steps collected (location, notification preferences, whether the pledge was
 * typed) is folded into the Supabase sign-up metadata here, so the metadata
 * assertions below are really assertions about the whole flow.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { openBrowserAsync } from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));

import EmailRegistration from "@/app/csatlakozom/email-regisztracio";
import { acceptPolicies } from "@/redux/reducers/infoReducer";
import { login, setLocation, setNotificationPrefs } from "@/redux/reducers/userReducer";
import { __resetRouter, router } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, __setTableRows, auth } from "@/test-utils/mocks/supabase";
import { inputByLabel } from "@/test-utils/paper";
import {
  createTestStore,
  renderWithProviders,
  type TestStore,
} from "@/test-utils/renderWithProviders";

const VALID = {
  name: "Kovács Anna",
  email: "anna@example.com",
  password: "Titok123",
};

const submitButton = () => screen.getByRole("button", { name: "Regisztrálok" });

/** Fills in everything the "Regisztrálok" button needs before it unlocks. */
const fillSignUpForm = async (overrides: Partial<typeof VALID> & { username?: string } = {}) => {
  const values = { ...VALID, ...overrides };

  await fireEvent.changeText(inputByLabel("Neved*"), values.name);
  await fireEvent.changeText(inputByLabel("E-mail*"), values.email);
  await fireEvent.changeText(inputByLabel("Jelszó*"), values.password);
  await fireEvent.changeText(inputByLabel("Jelszó még egyszer*"), values.password);
  if (overrides.username !== undefined) {
    await fireEvent.changeText(inputByLabel("Felhasználónév"), overrides.username);
  }
  await fireEvent.press(screen.getByRole("checkbox"));
};

const signUpResolvesTo = (user: unknown, error: unknown = null) => {
  auth.signUp.mockResolvedValue({ data: { user, session: null }, error });
};

const newUser = { id: "new-user", identities: [{ id: "identity-1" }] };
/** Supabase returns a user with no identities when the e-mail already exists. */
const existingUser = { id: "existing-user", identities: [] };

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
  signUpResolvesTo(newUser);
});

describe("registration / sign-up form", () => {
  describe("before the form is complete", () => {
    it("keeps the sign-up button locked on an empty form", async () => {
      await renderWithProviders(<EmailRegistration />);

      expect(submitButton()).toBeDisabled();
    });

    it("unlocks once the required fields and the terms are filled in", async () => {
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm();

      expect(submitButton()).toBeEnabled();
    });

    it("requires a password with a lower case, an upper case and a digit", async () => {
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm({ password: "titkos" });

      // The confirmation field stays locked while the password is too weak, so
      // the two can never match.
      expect(inputByLabel("Jelszó még egyszer*")).toHaveDisplayValue("");
      expect(submitButton()).toBeDisabled();
    });

    it("requires the two passwords to match", async () => {
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm();
      await fireEvent.changeText(inputByLabel("Jelszó még egyszer*"), "Titok1234");

      expect(submitButton()).toBeDisabled();
    });

    it("requires the terms to be accepted", async () => {
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm();
      await fireEvent.press(screen.getByRole("checkbox"));

      expect(submitButton()).toBeDisabled();
    });

    it("requires a name", async () => {
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm({ name: "" });

      expect(submitButton()).toBeDisabled();
    });

    it("refuses a username somebody else already has", async () => {
      __setTableRows("profiles", {
        data: [{ id: "somebody-else", username: "anna" }],
        error: null,
      });
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm({ username: "anna" });

      expect(
        await screen.findByText("A megadott felhasználónév már létezik"),
      ).toBeOnTheScreen();
      await waitFor(() => expect(submitButton()).toBeDisabled());
    });

    it("accepts a free username", async () => {
      __setTableRows("profiles", { data: [], error: null });
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm({ username: "anna" });

      await waitFor(() => expect(submitButton()).toBeEnabled());
    });

    it("opens the terms and the privacy policy without accepting them", async () => {
      await renderWithProviders(<EmailRegistration />);

      await fireEvent.press(screen.getByText("Felhasználási feltételeket"));
      await fireEvent.press(screen.getByText("Adatkezelési tájékoztatót"));

      expect(openBrowserAsync).toHaveBeenCalledWith("https://fifeapp.hu/terms.html");
      expect(openBrowserAsync).toHaveBeenCalledWith("https://fifeapp.hu/privacy.html");
      expect(submitButton()).toBeDisabled();
    });
  });

  describe("creating the account", () => {
    it("sends the credentials and the confirmation redirect to Supabase", async () => {
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm();
      await fireEvent.press(submitButton());

      await waitFor(() => expect(auth.signUp).toHaveBeenCalledTimes(1));
      expect(auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: VALID.email,
          password: VALID.password,
          options: expect.objectContaining({
            emailRedirectTo: "fife://csatlakozom/elso-lepesek",
          }),
        }),
      );
    });

    it("carries everything the earlier steps collected into the user metadata", async () => {
      const store: TestStore = createTestStore();
      store.dispatch(acceptPolicies());
      store.dispatch(setLocation({ latitude: 47.4979, longitude: 19.0402, radius: 1500 }));
      store.dispatch(
        setNotificationPrefs({
          notifyPush: true,
          notifyEmail: false,
          newsletter: true,
          emotionDailyPrompt: true,
        }),
      );
      __setTableRows("profiles", { data: [], error: null });

      await renderWithProviders(<EmailRegistration />, { store });
      await fillSignUpForm({ username: "anna" });
      await waitFor(() => expect(submitButton()).toBeEnabled());
      await fireEvent.press(submitButton());

      await waitFor(() => expect(auth.signUp).toHaveBeenCalledTimes(1));
      expect(auth.signUp.mock.calls[0][0].options.data).toEqual({
        full_name: VALID.name,
        username: "anna",
        location: "POINT(19.0402 47.4979)",
        location_radius_m: 1500,
        notify_push: true,
        notify_email: false,
        newsletter: true,
        bad_boy: false,
      });
    });

    it("flags a user who skipped the pledge as a bad boy", async () => {
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm();
      await fireEvent.press(submitButton());

      await waitFor(() => expect(auth.signUp).toHaveBeenCalledTimes(1));
      expect(auth.signUp.mock.calls[0][0].options.data).toMatchObject({ bad_boy: true });
    });

    it("leaves location out of the metadata when the user never shared one", async () => {
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm();
      await fireEvent.press(submitButton());

      await waitFor(() => expect(auth.signUp).toHaveBeenCalledTimes(1));
      const metadata = auth.signUp.mock.calls[0][0].options.data;
      expect(metadata).not.toHaveProperty("location");
      expect(metadata).not.toHaveProperty("location_radius_m");
    });

    it("moves on to the e-mail check and remembers the address", async () => {
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm();
      await fireEvent.press(submitButton());

      await waitFor(() =>
        expect(router.navigate).toHaveBeenCalledWith("/csatlakozom/email-ellenorzes"),
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("email", VALID.email);
    });

    it("refuses to submit without an e-mail address", async () => {
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm({ email: "" });
      await fireEvent.press(submitButton());

      expect(
        await screen.findByText("Email és név megadása kötelező"),
      ).toBeOnTheScreen();
      expect(auth.signUp).not.toHaveBeenCalled();
    });
  });

  describe("when Supabase rejects the sign-up", () => {
    it("explains the e-mail rate limit in plain Hungarian", async () => {
      signUpResolvesTo(null, { code: "over_email_send_rate_limit", message: "rate limited" });
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm();
      await fireEvent.press(submitButton());

      expect(
        await screen.findByText(
          "Túl sok próbálkozás. Kérlek várj egy kicsit, majd próbáld újra.",
        ),
      ).toBeOnTheScreen();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it("surfaces the error even when a user object comes back with it", async () => {
      signUpResolvesTo(newUser, { code: "unexpected_failure", message: "Email nem küldhető" });
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm();
      await fireEvent.press(submitButton());

      expect(await screen.findByText("Email nem küldhető")).toBeOnTheScreen();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it("reports a network failure instead of hanging on the spinner", async () => {
      auth.signUp.mockRejectedValue(new Error("Network request failed"));
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm();
      await fireEvent.press(submitButton());

      expect(
        await screen.findByText(
          "Váratlan hiba történt. Ellenőrizd az internetkapcsolatod, és próbáld újra.",
        ),
      ).toBeOnTheScreen();
      // The button is usable again — `loading` was cleared in the `finally`.
      expect(submitButton()).toBeEnabled();
    });
  });

  describe("when the e-mail address is already registered", () => {
    it("tells the user the address is taken if the password does not match", async () => {
      signUpResolvesTo(existingUser);
      auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "invalid_credentials", message: "Invalid login credentials" },
      });
      await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm();
      await fireEvent.press(submitButton());

      expect(await screen.findByText("Ez az email már foglalt")).toBeOnTheScreen();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it("signs the returning user in instead of creating a second account", async () => {
      signUpResolvesTo(existingUser);
      auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "existing-user", email: VALID.email }, session: {} },
        error: null,
      });
      const { store } = await renderWithProviders(<EmailRegistration />);

      await fillSignUpForm();
      await fireEvent.press(submitButton());

      await waitFor(() => expect(router.navigate).toHaveBeenCalledWith("/me"));
      expect(auth.signInWithPassword).toHaveBeenCalledWith({
        email: VALID.email,
        password: VALID.password,
      });
      expect(store.getState().user.uid).toBe("existing-user");
      expect(store.getState().info.snacks).toContainEqual({ title: "Bejelentkeztél!" });
    });
  });

  it("keeps a signed-in user out of the sign-up form", async () => {
    const store = createTestStore();
    store.dispatch(login("user-1"));

    await renderWithProviders(<EmailRegistration />, { store });

    expect(screen.getByTestId("redirect")).toHaveTextContent("/");
  });
});
