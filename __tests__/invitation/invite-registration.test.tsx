/**
 * The inviter's uid on its way through the registration flow.
 *
 * It is picked up on the invite landing page and has to survive until the new
 * profile exists — the flow leaves the app for the confirmation e-mail in
 * between, so it travels two ways at once: in the sign-up metadata (where
 * `handle_new_user` turns it into the invitation row) and in the store, which
 * is what the last step writes from.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("expo-linking", () => require("@/test-utils/mocks/expo-linking"));

import FirstSteps from "@/app/csatlakozom/elso-lepesek";
import EmailRegistration from "@/app/csatlakozom/email-regisztracio";
import { setInvitedBy } from "@/redux/reducers/appReducer";
import { login } from "@/redux/reducers/userReducer";
import { __resetLinking } from "@/test-utils/mocks/expo-linking";
import { __resetRouter } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, __setTableRow, auth, supabase } from "@/test-utils/mocks/supabase";
import { inputByLabel } from "@/test-utils/paper";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

const INVITER = "inviter-1";
const NEW_USER = "user-1";

const VALID = {
  name: "Kovács Anna",
  email: "anna@example.com",
  password: "Titok123",
};

const submitButton = () => screen.getByRole("button", { name: "Regisztrálok" });

const fillSignUpForm = async () => {
  await fireEvent.changeText(inputByLabel("Neved*"), VALID.name);
  await fireEvent.changeText(inputByLabel("E-mail*"), VALID.email);
  await fireEvent.changeText(inputByLabel("Jelszó*"), VALID.password);
  await fireEvent.changeText(inputByLabel("Jelszó még egyszer*"), VALID.password);
  await fireEvent.press(screen.getByRole("checkbox"));
};

/**
 * The mock hands out a fresh query builder per `from()` call, so the write has
 * to be found through the call that produced it.
 */
const invitationUpsert = (): jest.Mock | null => {
  const index = supabase.from.mock.calls.findIndex(([table]) => table === "invitations");
  if (index < 0) return null;
  return supabase.from.mock.results[index].value.upsert as jest.Mock;
};

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
  __resetLinking();
  auth.signUp.mockResolvedValue({
    data: { user: { id: NEW_USER, identities: [{ id: "identity-1" }] }, session: null },
    error: null,
  });
});

describe("invitation / sign-up metadata", () => {
  it("carries the inviter into the sign-up so the trigger can record it", async () => {
    const store = createTestStore();
    store.dispatch(setInvitedBy(INVITER));

    await renderWithProviders(<EmailRegistration />, { store });
    await fillSignUpForm();
    await fireEvent.press(submitButton());

    await waitFor(() => expect(auth.signUp).toHaveBeenCalledTimes(1));
    expect(auth.signUp.mock.calls[0][0].options.data).toMatchObject({
      invited_by: INVITER,
    });
  });

  it("leaves it out entirely when nobody invited the user", async () => {
    await renderWithProviders(<EmailRegistration />);
    await fillSignUpForm();
    await fireEvent.press(submitButton());

    await waitFor(() => expect(auth.signUp).toHaveBeenCalledTimes(1));
    expect(auth.signUp.mock.calls[0][0].options.data).not.toHaveProperty("invited_by");
  });
});

describe("invitation / recording it at the end of registration", () => {
  it("writes the invitation once the profile exists", async () => {
    const store = createTestStore();
    store.dispatch(setInvitedBy(INVITER));
    // What the earlier steps leave behind: the session is established and the
    // profile has been loaded, so the row can finally reference it.
    store.dispatch(login(NEW_USER));

    await renderWithProviders(<FirstSteps />, { store });

    await waitFor(() => expect(invitationUpsert()).not.toBeNull());
    expect(invitationUpsert()).toHaveBeenCalledWith(
      { author: INVITER, guest: NEW_USER },
      // The sign-up trigger has usually written this row already — the second
      // write has to be ignored, not rejected.
      expect.objectContaining({ onConflict: "guest", ignoreDuplicates: true }),
    );
  });

  it("forgets the inviter afterwards, so the next sign-up is not credited too", async () => {
    const store = createTestStore();
    store.dispatch(setInvitedBy(INVITER));
    store.dispatch(login(NEW_USER));

    await renderWithProviders(<FirstSteps />, { store });

    await waitFor(() => expect(store.getState().app.invitedBy).toBeNull());
  });

  it("keeps the invite while the account is still unconfirmed", async () => {
    const store = createTestStore();
    store.dispatch(setInvitedBy(INVITER));
    __setTableRow("profiles", { data: null, error: null });

    await renderWithProviders(<FirstSteps />, { store });
    await screen.findByText("A regisztráció nem sikerült.");

    expect(invitationUpsert()).toBeNull();
    expect(store.getState().app.invitedBy).toBe(INVITER);
  });

  it("refuses to record a self-invite", async () => {
    const store = createTestStore();
    store.dispatch(setInvitedBy(NEW_USER));
    store.dispatch(login(NEW_USER));

    await renderWithProviders(<FirstSteps />, { store });

    await waitFor(() => expect(store.getState().app.invitedBy).toBeNull());
    expect(invitationUpsert()).toBeNull();
  });
});
