import { act, screen, waitFor } from "@testing-library/react-native";

import RequestScreen from "@/app/kerelmek/[id]";
import { login } from "@/redux/reducers/userReducer";
import {
  __resetRouter,
  __setLocalSearchParams,
  navigation,
} from "@/test-utils/mocks/expo-router";
import { __resetSupabase, __setTableRow } from "@/test-utils/mocks/supabase";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));
jest.mock("@/components/mapView/mapView", () => ({ Marker: () => null, Circle: () => null }));
jest.mock("@/components/mapView/FiFeMap", () => () => null);

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 5,
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  author: "other-uid",
  title: "Kertészt keresek",
  description: "Fűnyírás",
  tags: ["kertészet"],
  images: [],
  location: null,
  radius: null,
  status: "open",
  solved_at: null,
  profiles: { full_name: "Kiss Anna", avatar_url: null },
  ...overrides,
});

const open = async (data: Record<string, unknown>) => {
  __setTableRow("requests", { data, error: null });
  const store = createTestStore();
  store.dispatch(login("me-uid"));
  await renderWithProviders(<RequestScreen />, { store });
  await screen.findByText("Kertészt keresek");
  return store;
};

/** What the screen hands to the app bar as the middle of its header. */
const headerInfo = () => {
  const { header } = navigation.setOptions.mock.calls.at(-1)?.[0] ?? {};
  return header().props.center.props as {
    authorId: string;
    name: string;
    age: string;
    place: string;
  };
};

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
  __setLocalSearchParams({ id: "5" });
});

describe("the request page", () => {
  it("puts who asked, when and where into the app bar", async () => {
    await open(row());

    await waitFor(() => expect(navigation.setOptions).toHaveBeenCalled());
    expect(headerInfo()).toMatchObject({
      authorId: "other-uid",
      name: "Kiss Anna",
      age: "2 órája",
      place: "Bárhol",
    });
  });

  it("says Te for the user's own request", async () => {
    await open(row({ author: "me-uid" }));

    await waitFor(() => expect(navigation.setOptions).toHaveBeenCalled());
    expect(headerInfo().name).toBe("Te");
  });

  it("offers report and block in the ⋮ menu of the app bar to everyone else", async () => {
    const store = await open(row());

    await waitFor(() =>
      expect(store.getState().info.options.map((o) => o.title)).toEqual([
        "Jelentés",
        "Felhasználó letiltása",
      ]),
    );
  });

  it("offers solve and delete to the author, and the solve button under the text", async () => {
    const store = await open(row({ author: "me-uid" }));

    await waitFor(() =>
      expect(store.getState().info.options.map((o) => o.title)).toEqual(["Megoldva", "Törlés"]),
    );
    expect(screen.getByTestId("request-solve")).toBeTruthy();
  });

  it("explains a solved request once, and offers only delete to its author", async () => {
    const store = await open(
      row({ author: "me-uid", status: "solved", solved_at: new Date().toISOString() }),
    );

    await waitFor(() =>
      expect(store.getState().info.options.map((o) => o.title)).toEqual(["Törlés"]),
    );
    expect(screen.queryByTestId("request-solve")).toBeNull();
    // The badge says it, and the closed comment box says why nobody can write any more: that is
    // the one sentence about the request being solved.
    expect(screen.getByText("megoldva")).toBeTruthy();
    expect(screen.getAllByText(/megoldódott/i)).toHaveLength(1);
    expect(screen.queryByText(/archiválva/i)).toBeNull();
    await act(async () => {});
  });
});
