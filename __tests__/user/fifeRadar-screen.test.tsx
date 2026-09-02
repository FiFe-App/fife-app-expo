import { screen, waitFor } from "@testing-library/react-native";

import FifeRadarScreen from "@/app/fifeRadar";
import { NO_LOCATION_ERROR } from "@/hooks/useFifeSearch";
import { init, setLocation } from "@/redux/reducers/userReducer";
import { storeUserSearchParams } from "@/redux/reducers/usersReducer";
import { __resetRouter } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, __setTableRows, supabase } from "@/test-utils/mocks/supabase";
import {
  createTestStore,
  renderWithProviders,
} from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));
// The map picker pulls in react-native-maps, which needs a native module.
// Nothing in these tests opens it.
jest.mock("@/components/MapSelector/MapSelector", () => () => null);

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

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
});

describe("FiFe Radar screen", () => {
  it("lists nearby fifék when there is no search", async () => {
    const store = loggedIn();
    store.dispatch(setLocation({ latitude: 47.5, longitude: 19.05, radius: 500 }));
    supabase.rpc.mockResolvedValue({ data: [], error: null });

    await renderWithProviders(<FifeRadarScreen />, { store });

    await waitFor(() => expect(supabase.rpc).toHaveBeenCalledWith(
      "nearest_profiles",
      expect.objectContaining({ p_lat: 47.5, p_long: 19.05 }),
    ));
    expect(screen.getByText("FiFe Radar")).toBeTruthy();
  });

  it("shows name-search results to a user who never set a location", async () => {
    // The proximity search fails with NO_LOCATION_ERROR for this user, and
    // UsersList renders an error card instead of the list — so an ungated
    // proximity fetch would hide the results from exactly the people most
    // likely to search by name.
    const store = loggedIn();
    store.dispatch(storeUserSearchParams({ text: "Pista" }));
    __setTableRows("profiles", { data: [profileRow("Nagy Pista")], error: null });

    await renderWithProviders(<FifeRadarScreen />, { store });

    await waitFor(() => expect(screen.getByText("Nagy Pista")).toBeTruthy());
    expect(screen.getByText("@pistike")).toBeTruthy();
    expect(screen.getByText("Találatok: Pista")).toBeTruthy();
    expect(screen.queryByText(NO_LOCATION_ERROR)).toBeNull();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("says nothing matched rather than blaming the neighbourhood", async () => {
    const store = loggedIn();
    store.dispatch(storeUserSearchParams({ text: "Nincsilyen" }));
    __setTableRows("profiles", { data: [], error: null });

    await renderWithProviders(<FifeRadarScreen />, { store });

    await waitFor(() => expect(screen.getByText("Nincs találat")).toBeTruthy());
    expect(screen.queryByText("Nincs még FiFe a környékeden")).toBeNull();
  });
});
