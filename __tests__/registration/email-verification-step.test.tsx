/**
 * Registration flow — step 5 of 6: "E-mail ellenőrzés".
 *
 * A parking screen: the account exists but is unconfirmed. It watches for the
 * session to become confirmed, and lets the user re-send the confirmation
 * e-mail or correct the address they typed.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));

import EmailVerification from "@/app/csatlakozom/email-ellenorzes";
import { __resetRouter, router } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, auth } from "@/test-utils/mocks/supabase";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const SIGNED_UP_EMAIL = "anna@example.com";

const resendButton = () => screen.getByRole("button", { name: "Email újraküldése" });

const noSession = () => {
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
};

const confirmedSession = (user: Record<string, unknown>) => {
  auth.getSession.mockResolvedValue({ data: { session: { user } }, error: null });
};

beforeEach(async () => {
  __resetRouter();
  __resetSupabase();
  noSession();
  auth.resend.mockResolvedValue({ data: {}, error: null });
  auth.updateUser.mockResolvedValue({ data: {}, error: null });
  await AsyncStorage.clear();
  await AsyncStorage.setItem("email", SIGNED_UP_EMAIL);
});

describe("registration / e-mail verification", () => {
  it("shows the address the confirmation was sent to", async () => {
    await renderWithProviders(<EmailVerification />);

    expect(
      screen.getByText("Kérlek igazold vissza az email-címedet"),
    ).toBeOnTheScreen();
    expect(await screen.findByText(SIGNED_UP_EMAIL)).toBeOnTheScreen();
  });

  it("waits on this screen while the account is unconfirmed", async () => {
    await renderWithProviders(<EmailVerification />);

    await waitFor(() => expect(auth.getSession).toHaveBeenCalled());
    expect(router.push).not.toHaveBeenCalled();
  });

  it("moves on to the first steps once the account is confirmed", async () => {
    confirmedSession({
      id: "user-1",
      email: SIGNED_UP_EMAIL,
      confirmed_at: "2026-01-01T00:00:00Z",
    });

    const { store } = await renderWithProviders(<EmailVerification />);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/csatlakozom/elso-lepesek"),
    );
    expect(store.getState().user.uid).toBe("user-1");
  });

  it("re-sends the confirmation e-mail on request", async () => {
    await renderWithProviders(<EmailVerification />);
    await screen.findByText(SIGNED_UP_EMAIL);

    await fireEvent.press(resendButton());

    await waitFor(() =>
      expect(auth.resend).toHaveBeenCalledWith(
        expect.objectContaining({ type: "signup", email: SIGNED_UP_EMAIL }),
      ),
    );
    expect(
      await screen.findByText("Email elküldve! Nézd meg a spam mappában is!"),
    ).toBeOnTheScreen();
  });

  it("asks the user to wait when they re-send too often", async () => {
    auth.resend.mockResolvedValue({
      data: null,
      error: { code: "over_email_send_rate_limit", message: "rate limited" },
    });
    await renderWithProviders(<EmailVerification />);
    await screen.findByText(SIGNED_UP_EMAIL);

    await fireEvent.press(resendButton());

    expect(
      await screen.findByText("Kérlek várj még egy kicsit mielőtt újabb email-t kérsz."),
    ).toBeOnTheScreen();
  });

  it("reports an address the server will not accept", async () => {
    auth.resend.mockResolvedValue({
      data: null,
      error: { code: "validation_failed", message: "invalid" },
    });
    await renderWithProviders(<EmailVerification />);
    await screen.findByText(SIGNED_UP_EMAIL);

    await fireEvent.press(resendButton());

    expect(await screen.findByText("Nem megfelelő email-cím")).toBeOnTheScreen();
  });

  it("recovers from a failed re-send instead of going quiet", async () => {
    auth.resend.mockRejectedValue(new Error("Network request failed"));
    await renderWithProviders(<EmailVerification />);
    await screen.findByText(SIGNED_UP_EMAIL);

    await fireEvent.press(resendButton());

    expect(
      await screen.findByText("A túróba. Valami hiba történt, próbáld meg újra!"),
    ).toBeOnTheScreen();
  });

  describe("correcting a mistyped address", () => {
    it("updates the account e-mail before re-sending", async () => {
      await renderWithProviders(<EmailVerification />);
      await screen.findByText(SIGNED_UP_EMAIL);

      await fireEvent.press(screen.getByRole("button", { name: "Elírtad az email-címed?" }));
      await fireEvent.changeText(
        screen.getByPlaceholderText("Az új email-címed"),
        "anna.kovacs@example.com",
      );
      await fireEvent.press(resendButton());

      await waitFor(() =>
        expect(auth.updateUser).toHaveBeenCalledWith({ email: "anna.kovacs@example.com" }),
      );
      expect(auth.resend).toHaveBeenCalledWith(
        expect.objectContaining({ email: "anna.kovacs@example.com" }),
      );
    });

    it("does not re-send when the account cannot be updated", async () => {
      auth.updateUser.mockResolvedValue({
        data: null,
        error: { code: "user_not_found", message: "User not found" },
      });
      await renderWithProviders(<EmailVerification />);
      await screen.findByText(SIGNED_UP_EMAIL);

      await fireEvent.press(screen.getByRole("button", { name: "Elírtad az email-címed?" }));
      await fireEvent.changeText(
        screen.getByPlaceholderText("Az új email-címed"),
        "nobody@example.com",
      );
      await fireEvent.press(resendButton());

      expect(await screen.findByText("Nem létezik ez a felhasználó")).toBeOnTheScreen();
      expect(auth.resend).not.toHaveBeenCalled();
    });

    it("goes back to the read-only address on Mégsem", async () => {
      await renderWithProviders(<EmailVerification />);
      await screen.findByText(SIGNED_UP_EMAIL);

      await fireEvent.press(screen.getByRole("button", { name: "Elírtad az email-címed?" }));
      expect(screen.getByPlaceholderText("Az új email-címed")).toBeOnTheScreen();

      await fireEvent.press(screen.getByRole("button", { name: "Mégsem" }));

      expect(screen.queryByPlaceholderText("Az új email-címed")).not.toBeOnTheScreen();
      expect(screen.getByText(SIGNED_UP_EMAIL)).toBeOnTheScreen();
    });
  });
});
