import { fireEvent, screen } from "@testing-library/react-native";

import RequestCard from "@/components/requests/RequestCard";
import { login } from "@/redux/reducers/userReducer";
import { __resetRouter, router } from "@/test-utils/mocks/expo-router";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

import { makeRequest } from "@/test-utils/fixtures/requests";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));

// Paper's Menu positions itself from native layout measurements, which a unit test does not
// have: it opens only some of the time. This stand-in renders the items whenever `visible`.
jest.mock("react-native-paper", () => {
  const actual = jest.requireActual("react-native-paper");
  const Menu = ({ visible, anchor, children }: any) => (
    <>
      {anchor}
      {visible ? children : null}
    </>
  );
  Menu.Item = actual.Menu.Item;
  return { ...actual, Menu };
});

const signedIn = () => {
  const store = createTestStore();
  store.dispatch(login("me-uid"));
  return store;
};

beforeEach(() => __resetRouter());

describe("RequestCard", () => {
  it("shows who asked, what, where and how many commented", async () => {
    await renderWithProviders(
      <RequestCard data={makeRequest({ comment_count: 3, tags: ["kertészet"] })} />,
      { store: signedIn() },
    );

    expect(screen.getByText("Kertészt keresek Újpesten")).toBeTruthy();
    expect(screen.getByText("Kiss Anna")).toBeTruthy();
    expect(screen.getByText("3.2 km", { exact: false })).toBeTruthy();
    expect(screen.getByText("3 hozzászólás")).toBeTruthy();
    expect(screen.getByText("kertészet")).toBeTruthy();
  });

  it("says Bárhol for a request that has no place", async () => {
    await renderWithProviders(
      <RequestCard data={makeRequest({ lat: null, long: null, distance: null })} />,
      { store: signedIn() },
    );

    expect(screen.getByText("Bárhol", { exact: false })).toBeTruthy();
  });

  it("flags a request that fits my bizniszek, but not my own", async () => {
    const { rerender } = await renderWithProviders(
      <RequestCard data={makeRequest({ is_match: true })} />,
      { store: signedIn() },
    );
    expect(screen.getByText("illik a bizniszedhez")).toBeTruthy();

    await rerender(<RequestCard data={makeRequest({ is_match: true, author: "me-uid" })} />);
    expect(screen.queryByText("illik a bizniszedhez")).toBeNull();
    expect(screen.getByText("Te")).toBeTruthy();
  });

  it("marks a solved request and drops the match badge", async () => {
    await renderWithProviders(
      <RequestCard
        data={makeRequest({ status: "solved", solved_at: new Date().toISOString(), is_match: true })}
      />,
      { store: signedIn() },
    );

    expect(screen.getByText("megoldva")).toBeTruthy();
    expect(screen.queryByText("illik a bizniszedhez")).toBeNull();
  });

  it("opens the request page", async () => {
    await renderWithProviders(<RequestCard data={makeRequest({ id: 42 })} />, {
      store: signedIn(),
    });

    await fireEvent.press(screen.getByTestId("request-card-42"));

    expect(router.navigate).toHaveBeenCalledWith("/kerelmek/[id]");
  });

  it("offers solve and delete on my own request", async () => {
    await renderWithProviders(
      <RequestCard data={makeRequest({ id: 5, author: "me-uid" })} />,
      { store: signedIn() },
    );
    await fireEvent.press(screen.getByTestId("request-menu-5"));

    expect(await screen.findByText("Megoldva")).toBeTruthy();
    expect(screen.getByText("Törlés")).toBeTruthy();
    expect(screen.queryByText("Jelentés")).toBeNull();
  });

  it("offers report and block on someone else's request", async () => {
    await renderWithProviders(<RequestCard data={makeRequest({ id: 6 })} />, {
      store: signedIn(),
    });
    await fireEvent.press(screen.getByTestId("request-menu-6"));

    expect(await screen.findByText("Jelentés")).toBeTruthy();
    expect(screen.getByText("Felhasználó letiltása")).toBeTruthy();
    expect(screen.queryByText("Törlés")).toBeNull();
  });

  it("has no solve action on an already solved request", async () => {
    await renderWithProviders(
      <RequestCard
        data={makeRequest({ id: 7, author: "me-uid", status: "solved", solved_at: new Date().toISOString() })}
      />,
      { store: signedIn() },
    );
    await fireEvent.press(screen.getByTestId("request-menu-7"));

    expect(await screen.findByText("Törlés")).toBeTruthy();
    expect(screen.queryByText("Megoldva")).toBeNull();
  });
});
