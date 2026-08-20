import { fireEvent, screen } from "@testing-library/react-native";

import UpdateRequiredScreen from "@/components/version/UpdateRequiredScreen";
import type { AppVersionStatus } from "@/lib/appVersion/appVersionStatus";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const status: AppVersionStatus = {
  status: "blocked",
  minVersion: "1.1.0",
  latestVersion: "1.2.0",
  updateUrl: "https://play.google.com/store/apps/details?id=com.fife.app",
  message: null,
};

describe("UpdateRequiredScreen", () => {
  it("offers the update and shows which versions are in play", async () => {
    await renderWithProviders(
      <UpdateRequiredScreen status={status} currentVersion="1.0.1" onRetry={jest.fn()} />,
    );

    expect(screen.getByText("Frissítsd az appot!")).toBeTruthy();
    expect(screen.getByText(/Jelenlegi verzió: 1\.0\.1/)).toBeTruthy();
    expect(screen.getByText(/legújabb: 1\.2\.0/)).toBeTruthy();
  });

  it("prefers the message the server sent over the default text", async () => {
    await renderWithProviders(
      <UpdateRequiredScreen
        status={{ ...status, message: "Karbantartás miatt frissíts." }}
        currentVersion="1.0.1"
        onRetry={jest.fn()}
      />,
    );

    expect(screen.getByText("Karbantartás miatt frissíts.")).toBeTruthy();
  });

  it("re-checks when the user says they have updated", async () => {
    const onRetry = jest.fn();
    await renderWithProviders(
      <UpdateRequiredScreen status={status} currentVersion="1.0.1" onRetry={onRetry} />,
    );

    fireEvent.press(screen.getByText("Már frissítettem"));

    expect(onRetry).toHaveBeenCalled();
  });
});
