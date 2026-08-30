import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import SearchScreen from "@/app/search";
import { addPreviousSearch } from "@/redux/reducers/userReducer";
import { storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import {
  __resetRouter,
  __setLocalSearchParams,
  router,
} from "@/test-utils/mocks/expo-router";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import {
  createTestStore,
  renderWithProviders,
} from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));

// The search input lives in a header registered through navigation.setOptions,
// which the router mock does not render. Previous-search rows run the same
// handleSearch, so they are what these tests press.
const withRecentSearch = (query: string) => {
  const store = createTestStore();
  store.dispatch(addPreviousSearch(query));
  return store;
};

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
  __setLocalSearchParams({});
});

describe("search screen modes", () => {
  it("searches bizniszek by default", async () => {
    const { store } = await renderWithProviders(<SearchScreen />, {
      store: withRecentSearch("kerítés"),
    });

    await fireEvent.press(screen.getByText("kerítés"));

    expect(router.replace).toHaveBeenCalledWith("/biznisz");
    expect(store.getState().buziness.searchParams?.text).toBe("kerítés");
  });

  it("sends a fifék search to the radar without touching the buziness query", async () => {
    const store = withRecentSearch("Pista");
    store.dispatch(storeBuzinessSearchParams({ text: "kerítés" }));
    await renderWithProviders(<SearchScreen />, { store });

    await fireEvent.press(screen.getByTestId("search-mode-fife"));
    await fireEvent.press(screen.getByText("Pista"));

    expect(router.replace).toHaveBeenCalledWith("/fifeRadar");
    expect(store.getState().users.userSearchParams?.text).toBe("Pista");
    // The two searches are distinct: this must be left alone.
    expect(store.getState().buziness.searchParams?.text).toBe("kerítés");
  });

  it("starts in fifék mode when opened from the radar", async () => {
    __setLocalSearchParams({ mode: "fife" });
    const store = withRecentSearch("Pista");
    await renderWithProviders(<SearchScreen />, { store });

    await fireEvent.press(screen.getByText("Pista"));

    expect(router.replace).toHaveBeenCalledWith("/fifeRadar");
  });

  it("hides the buziness query suggestions in fifék mode", async () => {
    supabase.rpc.mockResolvedValue({
      data: [{ query_text: "kerítés", hit_count: 9 }],
      error: null,
    });
    const store = withRecentSearch("Pista");
    await renderWithProviders(<SearchScreen />, { store });

    // The suggestions hook debounces before it calls the RPC.
    await waitFor(() => expect(screen.getByText("Gyakori keresések")).toBeTruthy());

    await fireEvent.press(screen.getByTestId("search-mode-fife"));

    // get_popular_search_queries is fed by buziness searches only.
    await waitFor(() => expect(screen.queryByText("Gyakori keresések")).toBeNull());
    expect(screen.getByText("Korábbi kereséseid")).toBeTruthy();
  });
});
