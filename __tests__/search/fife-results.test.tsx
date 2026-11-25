import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import SearchScreen from "@/app/search";
import { NO_LOCATION_ERROR } from "@/hooks/useFifeSearch";
import { init, setLocation } from "@/redux/reducers/userReducer";
import { storeSearchView } from "@/redux/reducers/searchReducer";
import { __resetRouter, __setLocalSearchParams } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, __setTableRows, supabase } from "@/test-utils/mocks/supabase";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));
jest.mock("@/components/mapView/mapView", () => {
  const { Pressable } = require("react-native");
  return {
    // A pin is a pressable holding what the screen drew for it.
    Marker: ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) => (
      <Pressable testID="map-pin" onPress={onPress}>
        {children}
      </Pressable>
    ),
    Circle: () => null,
  };
});
jest.mock("@/components/tutorial/Measure", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/components/mapView/FiFeMap", () => {
  const { View } = require("react-native");
  const FiFeMap = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>;
  return FiFeMap;
});

const MY_UID = "11111111-1111-1111-1111-111111111111";

const loggedIn = (view: "list" | "map" = "list") => {
  const store = createTestStore();
  store.dispatch(init(MY_UID));
  store.dispatch(storeSearchView(view));
  return store;
};

/** The screen on its fifék tab, as a chip or a link opens it. */
const renderFife = (q: string, store: ReturnType<typeof loggedIn>) => {
  __setLocalSearchParams({ mode: "fife", q });
  return renderWithProviders(<SearchScreen />, { store });
};

const profileRow = (full_name: string) => ({
  id: "u1",
  full_name,
  username: "pistike",
  avatar_url: null,
  website: null,
  created_at: null,
  updated_at: null,
  viewed_functions: null,
  profileRecommendations: [],
  buzinesses: [],
});

const nearby = (id: string, lat: number, long: number) => ({
  id,
  full_name: `Fife ${id}`,
  username: null,
  avatar_url: null,
  website: null,
  created_at: null,
  recommendations: 0,
  lat,
  long,
  distance: 100,
  buzinesses: [],
});

beforeEach(() => {
  __resetRouter();
  __setLocalSearchParams({});
  __resetSupabase();
});

describe("the fifék of the search screen", () => {
  it("lists nearby fifék (the FiFe Radar) when there is no query", async () => {
    const store = loggedIn();
    store.dispatch(setLocation({ latitude: 47.5, longitude: 19.05, radius: 500 }));
    supabase.rpc.mockResolvedValue({ data: [nearby("a", 47.5, 19.05)], error: null });

    await renderFife("", store);

    await waitFor(() => expect(supabase.rpc).toHaveBeenCalledWith(
      "nearest_profiles",
      expect.objectContaining({ p_lat: 47.5, p_long: 19.05 }),
    ));
    expect(await screen.findByText("Fife a")).toBeTruthy();
  });

  it("shows name-search results to a user who never set a location", async () => {
    // The proximity search fails with NO_LOCATION_ERROR for this user, and UsersList renders an
    // error card instead of the list — so an ungated proximity fetch would hide the results from
    // exactly the people most likely to search by name.
    __setTableRows("profiles", { data: [profileRow("Nagy Pista")], error: null });

    await renderFife("Pista", loggedIn());

    await waitFor(() => expect(screen.getByText("Nagy Pista")).toBeTruthy());
    expect(screen.getByText("@pistike")).toBeTruthy();
    expect(screen.queryByText(NO_LOCATION_ERROR)).toBeNull();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("says nothing matched rather than blaming the neighbourhood", async () => {
    __setTableRows("profiles", { data: [], error: null });

    await renderFife("Nincsilyen", loggedIn());

    await waitFor(() => expect(screen.getByText("Nincs találat")).toBeTruthy());
    expect(screen.queryByText("Nincs még FiFe a környékeden")).toBeNull();
  });

  it("in the map view pins the fifék, with no list, and shows the picked one as a card", async () => {
    const store = loggedIn();
    store.dispatch(setLocation({ latitude: 47.5, longitude: 19.05, radius: 500 }));
    supabase.rpc.mockResolvedValue({
      data: [nearby("a", 47.5, 19.05), nearby("b", 47.51, 19.06)],
      error: null,
    });

    store.dispatch(storeSearchView("map"));
    await renderFife("", store);

    // Two fifék, and the marker of the user's own position.
    expect(await screen.findAllByTestId("map-pin")).toHaveLength(3);
    expect(screen.getByTestId("search-map")).toBeTruthy();
    // No list: the names appear only for the pin that is picked.
    expect(screen.queryByText("Fife a")).toBeNull();
    expect(screen.queryByText("Fife b")).toBeNull();

    await fireEvent.press(screen.getAllByTestId("map-pin")[0]);

    expect(await screen.findByText("Fife a")).toBeTruthy();
    expect(screen.queryByText("Fife b")).toBeNull();
  });

  it("asks for a page of the fifék big enough for a map", async () => {
    const store = loggedIn();
    store.dispatch(setLocation({ latitude: 47.5, longitude: 19.05, radius: 500 }));
    supabase.rpc.mockResolvedValue({ data: [], error: null });

    store.dispatch(storeSearchView("map"));
    await renderFife("", store);

    await waitFor(() =>
      expect(supabase.rpc).toHaveBeenCalledWith(
        "nearest_profiles",
        expect.objectContaining({ take: 100 }),
      ),
    );
  });

  it("searches around the spot the map shows when asked to", async () => {
    const store = loggedIn();
    store.dispatch(setLocation({ latitude: 47.5, longitude: 19.05, radius: 500 }));
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    store.dispatch(storeSearchView("map"));
    await renderFife("", store);

    await fireEvent.press(await screen.findByTestId("map-search-here"));

    expect(store.getState().users.userSearchParams?.searchCircle?.location).toEqual({
      latitude: 47.5,
      longitude: 19.05,
    });
  });

  it("tells that a name search has nothing to pin on the map", async () => {
    __setTableRows("profiles", { data: [profileRow("Nagy Pista")], error: null });

    await renderFife("Pista", loggedIn("map"));

    expect(await screen.findByText("A névkeresés találatai nem jelennek meg a térképen.")).toBeTruthy();
  });
});
