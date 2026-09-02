import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import SearchScreen from "@/app/search";
import {
  addPreviousSearch,
  removeFromPreviousSearches,
} from "@/redux/reducers/userReducer";
import { storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { SearchMode } from "@/redux/store.type";
import {
  __resetRouter,
  __setLocalSearchParams,
  router,
} from "@/test-utils/mocks/expo-router";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import {
  createTestStore,
  renderWithProviders,
  TestStore,
} from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));

// The search input lives in a header registered through navigation.setOptions,
// which the router mock does not render. Previous-search rows run the same
// handleSearch, so they are what these tests press.
const seed = (store: TestStore, query: string, mode: SearchMode) => {
  store.dispatch(addPreviousSearch({ query, mode }));
  return store;
};

const withRecentSearch = (query: string, mode: SearchMode = "biznisz") =>
  seed(createTestStore(), query, mode);

const history = (store: TestStore) => ({
  biznisz: store.getState().user.previousSearches,
  fife: store.getState().user.previousProfileSearches,
});

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
    const store = withRecentSearch("Pista", "fife");
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
    const store = withRecentSearch("Pista", "fife");
    await renderWithProviders(<SearchScreen />, { store });

    await fireEvent.press(screen.getByText("Pista"));

    expect(router.replace).toHaveBeenCalledWith("/fifeRadar");
  });

  it("hides the buziness query suggestions in fifék mode", async () => {
    supabase.rpc.mockResolvedValue({
      data: [{ query_text: "kerítés", hit_count: 9 }],
      error: null,
    });
    const store = withRecentSearch("léckerítés");
    seed(store, "Pista", "fife");
    await renderWithProviders(<SearchScreen />, { store });

    // The suggestions hook debounces before it calls the RPC.
    await waitFor(() => expect(screen.getByText("Gyakori keresések")).toBeTruthy());

    await fireEvent.press(screen.getByTestId("search-mode-fife"));

    // get_popular_search_queries is fed by buziness searches only.
    await waitFor(() => expect(screen.queryByText("Gyakori keresések")).toBeNull());
    expect(screen.getByText("Korábbi kereséseid")).toBeTruthy();
  });
});

describe("search history is kept per mode", () => {
  it("lists only the history belonging to the selected chip", async () => {
    const store = withRecentSearch("léckerítés");
    seed(store, "Nagy Pista", "fife");
    await renderWithProviders(<SearchScreen />, { store });

    expect(screen.getByText("léckerítés")).toBeTruthy();
    expect(screen.queryByText("Nagy Pista")).toBeNull();

    await fireEvent.press(screen.getByTestId("search-mode-fife"));

    expect(screen.getByText("Nagy Pista")).toBeTruthy();
    expect(screen.queryByText("léckerítés")).toBeNull();
  });

  it("records a fifék search without polluting the buziness history", async () => {
    __setLocalSearchParams({ mode: "fife" });
    const store = withRecentSearch("Nagy Pista", "fife");
    await renderWithProviders(<SearchScreen />, { store });

    await fireEvent.press(screen.getByText("Nagy Pista"));

    expect(history(store)).toEqual({ biznisz: [], fife: ["Nagy Pista"] });
  });

  it("deletes a recent search from its own list only", async () => {
    const store = withRecentSearch("Nagy Pista");
    seed(store, "Nagy Pista", "fife");
    __setLocalSearchParams({ mode: "fife" });
    await renderWithProviders(<SearchScreen />, { store });

    // Same text in both lists: deleting the fife one must leave the other be.
    await fireEvent.press(screen.getByTestId("remove-previous-Nagy Pista"));

    expect(history(store)).toEqual({ biznisz: ["Nagy Pista"], fife: [] });
  });
});

describe("addPreviousSearch / removeFromPreviousSearches", () => {
  it("keeps each mode's list separate", () => {
    const store = createTestStore();
    seed(store, "kerítés", "biznisz");
    seed(store, "Pista", "fife");

    expect(history(store)).toEqual({ biznisz: ["kerítés"], fife: ["Pista"] });
  });

  it("moves a repeated query back to the front instead of duplicating it", () => {
    const store = createTestStore();
    ["a", "b", "a"].forEach((q) => seed(store, q, "fife"));

    expect(history(store).fife).toEqual(["a", "b"]);
  });

  it("caps each list at ten entries independently", () => {
    const store = createTestStore();
    for (let i = 0; i < 12; i++) {
      seed(store, `b${i}`, "biznisz");
      seed(store, `f${i}`, "fife");
    }

    expect(history(store).biznisz).toHaveLength(10);
    expect(history(store).fife).toHaveLength(10);
    expect(history(store).fife?.[0]).toBe("f11");
  });

  it("ignores a blank query in either mode", () => {
    const store = createTestStore();
    seed(store, "   ", "fife");
    seed(store, "", "biznisz");

    expect(history(store)).toEqual({ biznisz: [], fife: [] });
  });

  it("removes from the named mode only", () => {
    const store = createTestStore();
    seed(store, "Pista", "biznisz");
    seed(store, "Pista", "fife");

    store.dispatch(removeFromPreviousSearches({ query: "Pista", mode: "fife" }));

    expect(history(store)).toEqual({ biznisz: ["Pista"], fife: [] });
  });
});
