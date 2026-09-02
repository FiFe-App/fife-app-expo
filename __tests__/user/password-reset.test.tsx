/**
 * Password recovery — same deep-link shape as the registration confirmation.
 * Supabase sends a `type=recovery` link whose fragment carries the session that
 * authorises the password change.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("expo-linking", () => require("@/test-utils/mocks/expo-linking"));

import PasswordReset from "@/app/user/password-reset";
import { __resetLinking, __setLinkingURL } from "@/test-utils/mocks/expo-linking";
import { __resetRouter } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, auth } from "@/test-utils/mocks/supabase";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const RECOVERY_HASH =
  "access_token=access-123&refresh_token=refresh-456&type=recovery";
const RECOVERY_DEEP_LINK = `com.fife.app://user/password-reset#${RECOVERY_HASH}`;

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
  __resetLinking();
  auth.setSession.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
  auth.updateUser.mockResolvedValue({ data: {}, error: null });
});

describe("password reset", () => {
  it("asks for an e-mail address when opened without a link", async () => {
    await renderWithProviders(<PasswordReset />);

    expect(screen.getByText("Elfelejtett jelszó")).toBeOnTheScreen();
    expect(auth.setSession).not.toHaveBeenCalled();
  });

  it("opens the new-password form from a native deep link", async () => {
    // expo-router drops the fragment from native deep links, so the tokens only
    // exist on the raw launch URL — without this the screen never left the
    // "request a link" stage on a phone.
    __setLinkingURL(RECOVERY_DEEP_LINK);

    await renderWithProviders(<PasswordReset />);

    await waitFor(() =>
      expect(auth.setSession).toHaveBeenCalledWith({
        access_token: "access-123",
        refresh_token: "refresh-456",
      }),
    );
    expect(await screen.findByText("Új jelszó beállítása")).toBeOnTheScreen();
  });

  it("exchanges the recovery tokens only once", async () => {
    __setLinkingURL(RECOVERY_DEEP_LINK);

    await renderWithProviders(<PasswordReset />);
    await screen.findByText("Új jelszó beállítása");

    expect(auth.setSession).toHaveBeenCalledTimes(1);
  });

  it("explains an expired recovery link", async () => {
    __setLinkingURL(
      "com.fife.app://user/password-reset#error=access_denied&error_code=otp_expired",
    );

    await renderWithProviders(<PasswordReset />);

    expect(
      await screen.findByText("Ez a link lejárt, vagy már felhasználtad. Kérj egy újat!"),
    ).toBeOnTheScreen();
    expect(auth.setSession).not.toHaveBeenCalled();
  });

  it("sends a recovery e-mail on request", async () => {
    await renderWithProviders(<PasswordReset />);

    await fireEvent.changeText(screen.getByDisplayValue(""), "anna@example.com");
    await fireEvent.press(screen.getByRole("button", { name: "Visszaállító email küldése" }));

    await waitFor(() =>
      expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("anna@example.com", {
        redirectTo: "fife://user/password-reset",
      }),
    );
  });
});
