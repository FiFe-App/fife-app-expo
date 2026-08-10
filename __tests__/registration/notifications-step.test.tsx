/**
 * Registration flow — step 3 of 6: "Értesítések".
 *
 * The switches on this screen only write to Redux; the preferences are read
 * back later by the sign-up step and sent to Supabase as user metadata.
 */
import { fireEvent, screen } from "@testing-library/react-native";

import Ertesitesek from "@/app/csatlakozom/ertesitesek";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("registration / notification preferences", () => {
  it("starts with every notification opted out", async () => {
    const { store } = await renderWithProviders(<Ertesitesek />);

    expect(screen.getByText("Értesítések")).toBeOnTheScreen();
    screen.getAllByRole("switch").forEach((toggle) => expect(toggle).not.toBeChecked());
    expect(store.getState().user.notificationPrefs).toBeUndefined();
  });

  it("stores each preference the user turns on", async () => {
    const { store } = await renderWithProviders(<Ertesitesek />);

    const [push, email, newsletter] = screen.getAllByRole("switch");

    await fireEvent(push, "valueChange", true);
    expect(store.getState().user.notificationPrefs).toMatchObject({
      notifyPush: true,
      notifyEmail: false,
      newsletter: false,
    });

    await fireEvent(email, "valueChange", true);
    await fireEvent(newsletter, "valueChange", true);
    expect(store.getState().user.notificationPrefs).toMatchObject({
      notifyPush: true,
      notifyEmail: true,
      newsletter: true,
    });
  });

  it("reflects the stored preference back in the switch", async () => {
    const { store } = await renderWithProviders(<Ertesitesek />);

    const [, email] = screen.getAllByRole("switch");
    await fireEvent(email, "valueChange", true);
    expect(screen.getAllByRole("switch")[1]).toBeChecked();

    await fireEvent(screen.getAllByRole("switch")[1], "valueChange", false);
    expect(store.getState().user.notificationPrefs).toMatchObject({ notifyEmail: false });
    expect(screen.getAllByRole("switch")[1]).not.toBeChecked();
  });
});
