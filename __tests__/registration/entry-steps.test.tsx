/**
 * Registration flow — the entry screen (step 1) and the "how do you want to
 * join" chooser that sits between the wizard and the sign-up form.
 */
import { screen, userEvent } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));

import RegistrationIntro from "@/app/csatlakozom/index";
import ProviderChooser from "@/app/csatlakozom/regisztracio";
import { login } from "@/redux/reducers/userReducer";
import { __resetRouter, router } from "@/test-utils/mocks/expo-router";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

beforeEach(() => {
  __resetRouter();
});

describe("registration / entry screen", () => {
  it("opens with the pitch for joining", async () => {
    await renderWithProviders(<RegistrationIntro />);

    expect(screen.getByText("Az utca túloldalán lehet a segítség")).toBeOnTheScreen();
  });
});

describe("registration / provider chooser", () => {
  it("only offers e-mail sign-up for now", async () => {
    await renderWithProviders(<ProviderChooser />);

    // Matched loosely: the icon glyph counts towards these buttons' names.
    expect(screen.getByRole("button", { name: /Csatlakozom Facebook-al/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Csatlakozom Google-lel/ })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "E-mail és Jelszó regisztráció" }),
    ).toBeEnabled();
  });

  it("sends the user to the sign-up form", async () => {
    const user = userEvent.setup();
    await renderWithProviders(<ProviderChooser />);

    await user.press(screen.getByRole("button", { name: "E-mail és Jelszó regisztráció" }));

    expect(router.navigate).toHaveBeenCalledWith("/csatlakozom/email-regisztracio");
  });

  it("keeps a signed-in user out", async () => {
    const store = createTestStore();
    store.dispatch(login("user-1"));

    await renderWithProviders(<ProviderChooser />, { store });

    expect(screen.getByTestId("redirect")).toHaveTextContent("/");
  });
});
