import { screen, waitFor } from "@testing-library/react-native";

import FifeResults from "@/components/search/FifeResults";
import { NO_LOCATION_ERROR } from "@/hooks/useFifeSearch";
import { init, setLocation } from "@/redux/reducers/userReducer";
import { __resetRouter } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, __setTableRows, supabase } from "@/test-utils/mocks/supabase";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));
jest.mock("@/components/mapView/mapView", () => ({ Marker: () => null, Circle: () => null }));
jest.mock("@/components/mapView/FiFeMap", () => () => null);

const MY_UID = "11111111-1111-1111-1111-111111111111";

const loggedIn = () => {
  const store = createTestStore();
  store.dispatch(init(MY_UID));
  return store;
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
  __resetSupabase();
});

describe("FifeResults", () => {
  it("lists nearby fifék (the FiFe Radar) when there is no query", async () => {
    const store = loggedIn();
    store.dispatch(setLocation({ latitude: 47.5, longitude: 19.05, radius: 500 }));
    supabase.rpc.mockResolvedValue({ data: [nearby("a", 47.5, 19.05)], error: null });

    await renderWithProviders(<FifeResults q="" reloadKey={0} view="list" />, { store });

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

    await renderWithProviders(<FifeResults q="Pista" reloadKey={0} view="list" />, {
      store: loggedIn(),
    });

    await waitFor(() => expect(screen.getByText("Nagy Pista")).toBeTruthy());
    expect(screen.getByText("@pistike")).toBeTruthy();
    expect(screen.queryByText(NO_LOCATION_ERROR)).toBeNull();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("says nothing matched rather than blaming the neighbourhood", async () => {
    __setTableRows("profiles", { data: [], error: null });

    await renderWithProviders(<FifeResults q="Nincsilyen" reloadKey={0} view="list" />, {
      store: loggedIn(),
    });

    await waitFor(() => expect(screen.getByText("Nincs találat")).toBeTruthy());
    expect(screen.queryByText("Nincs még FiFe a környékeden")).toBeNull();
  });

  it("in the map view lists the same fifék under the map", async () => {
    const store = loggedIn();
    store.dispatch(setLocation({ latitude: 47.5, longitude: 19.05, radius: 500 }));
    supabase.rpc.mockResolvedValue({
      data: [nearby("a", 47.5, 19.05), nearby("b", 47.51, 19.06)],
      error: null,
    });

    await renderWithProviders(<FifeResults q="" reloadKey={0} view="map" />, { store });

    expect(await screen.findByText("Fife a")).toBeTruthy();
    expect(screen.getByText("Fife b")).toBeTruthy();
    expect(screen.getByTestId("results-map")).toBeTruthy();
  });

  it("tells that a name search has nothing to pin on the map", async () => {
    __setTableRows("profiles", { data: [profileRow("Nagy Pista")], error: null });

    await renderWithProviders(<FifeResults q="Pista" reloadKey={0} view="map" />, {
      store: loggedIn(),
    });

    expect(await screen.findByText("A névkeresés találatai nem jelennek meg a térképen.")).toBeTruthy();
  });
});
