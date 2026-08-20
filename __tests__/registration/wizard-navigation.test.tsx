/**
 * Registration flow — the wizard chrome in `app/csatlakozom/_layout.tsx`.
 *
 * The layout owns the five-step order, the progress dots and the Vissza/Tovább
 * buttons. The screens themselves never navigate between steps, so this is the
 * only place the step order is expressed.
 *
 * The `expo-router` double records a `Link` press as `router.navigate(href)`,
 * so "pressing Tovább navigates to X" is the assertion for "the next step is X".
 */
import { screen, userEvent } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));

import RegistrationLayout from "@/app/csatlakozom/_layout";
import { login } from "@/redux/reducers/userReducer";
import {
  __resetRouter,
  __setGlobalSearchParams,
  __setPathname,
  router,
} from "@/test-utils/mocks/expo-router";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

const next = () => screen.getByRole("button", { name: "Tovább" });
const back = () => screen.getByRole("button", { name: "Vissza" });

beforeEach(() => {
  __resetRouter();
});

describe("registration / wizard navigation", () => {
  it("walks the user through the intro steps in order", async () => {
    const user = userEvent.setup();

    // The last two steps are reached by the screens themselves (sign-up pushes
    // to the e-mail check, the confirmation link lands on the first steps), so
    // the wizard's own "Tovább" only covers the way up to the sign-up form.
    const steps = [
      ["/csatlakozom", "/csatlakozom/iranyelvek"],
      ["/csatlakozom/iranyelvek", "/csatlakozom/email-regisztracio"],
    ] as const;

    for (const [current, expected] of steps) {
      __resetRouter();
      __setPathname(current);
      // Step 2 gates "Tovább" behind this param; the others ignore it.
      __setGlobalSearchParams({ canGoNext: "true" });

      const view = await renderWithProviders(<RegistrationLayout />);
      await user.press(next());

      expect(router.navigate).toHaveBeenCalledWith(expected);
      await view.unmount();
    }
  });

  it("sends the user back out of the flow from the first step", async () => {
    const user = userEvent.setup();
    __setPathname("/csatlakozom");

    await renderWithProviders(<RegistrationLayout />);
    await user.press(back());

    expect(router.navigate).toHaveBeenCalledWith("/");
  });

  it("steps back to the previous page from a later step", async () => {
    const user = userEvent.setup();
    __setPathname("/csatlakozom/email-regisztracio");

    await renderWithProviders(<RegistrationLayout />);
    await user.press(back());

    expect(router.navigate).toHaveBeenCalledWith("/csatlakozom/iranyelvek");
  });

  it("keeps the user on the guidelines step until they accept them", async () => {
    const user = userEvent.setup();
    __setPathname("/csatlakozom/iranyelvek");

    await renderWithProviders(<RegistrationLayout />);

    expect(next()).toBeDisabled();
    await user.press(next());
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("hands control to the form on the account steps", async () => {
    // Sign-up and e-mail verification finish by themselves, so the wizard's own
    // "Tovább" must not offer a way past them.
    for (const path of [
      "/csatlakozom/regisztracio",
      "/csatlakozom/email-regisztracio",
      "/csatlakozom/email-ellenorzes",
    ]) {
      __setPathname(path);
      const view = await renderWithProviders(<RegistrationLayout />);

      expect(next()).toBeDisabled();
      await view.unmount();
    }
  });

  it("does not let a finished registration be re-entered backwards", async () => {
    __setPathname("/csatlakozom/elso-lepesek");

    await renderWithProviders(<RegistrationLayout />);

    expect(back()).toBeDisabled();
  });

  it("redirects a signed-in user away from the flow's entry point", async () => {
    const store = createTestStore();
    store.dispatch(login("user-1"));
    __setPathname("/csatlakozom");

    await renderWithProviders(<RegistrationLayout />, { store });

    expect(screen.getByTestId("redirect")).toHaveTextContent("/user");
  });

  it("leaves a signed-in user alone on the final step, which needs the session", async () => {
    const store = createTestStore();
    store.dispatch(login("user-1"));
    __setPathname("/csatlakozom/elso-lepesek");

    await renderWithProviders(<RegistrationLayout />, { store });

    expect(screen.queryByTestId("redirect")).not.toBeOnTheScreen();
  });
});
