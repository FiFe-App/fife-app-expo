/**
 * The location line on a biznisz card.
 *
 * A biznisz saved as "Bárhol" has no location and therefore no distance, so the
 * card says so instead of leaving the line out — which would read as missing
 * data rather than as the choice its author made.
 */
import { screen } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));

import BuzinessItem from "@/components/buziness/BuzinessItem";
import { BuzinessItemInterface } from "@/redux/store.type";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const buziness = (
  overrides: Partial<BuzinessItemInterface> = {},
): BuzinessItemInterface => ({
  id: 1,
  author: "someone-else",
  title: "Kertész $ metszés",
  description: "Fák és bokrok metszése",
  recommendations: 3,
  ...overrides,
});

describe("BuzinessItem / the location line", () => {
  it("says a biznisz with no location is available anywhere", async () => {
    await renderWithProviders(<BuzinessItem data={buziness()} />);

    expect(await screen.findByText("Bárhol elérhető")).toBeOnTheScreen();
  });

  it("shows the distance instead when the biznisz has one", async () => {
    await renderWithProviders(
      <BuzinessItem
        data={buziness({ location: "POINT(19.0402 47.4979)", distance: 2500 })}
      />,
    );

    expect(await screen.findByText("2.5 km távolságra")).toBeOnTheScreen();
    expect(screen.queryByText("Bárhol elérhető")).toBeNull();
  });

  it("does not claim a located biznisz is anywhere just because the distance is unknown", async () => {
    // A located row the caller has no position for: no distance to show, but
    // it is not a "Bárhol" biznisz either.
    await renderWithProviders(
      <BuzinessItem data={buziness({ location: "POINT(19.0402 47.4979)" })} />,
    );

    expect(screen.queryByText("Bárhol elérhető")).toBeNull();
  });
});
