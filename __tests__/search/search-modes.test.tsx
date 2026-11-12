import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import SearchScreen from "@/app/search";
import {
  addPreviousSearch,
  removeFromPreviousSearches,
} from "@/redux/reducers/userReducer";
import { storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { storeRequestScope, storeRequestSearchText } from "@/redux/reducers/requestsReducer";
import { setInterests } from "@/redux/reducers/userReducer";
import { makeRequest } from "@/test-utils/fixtures/requests";
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
// The map is native; what matters here is which filter modal opens, so it renders its children.
jest.mock("@/components/MapSelector/MapSelector", () => {
  const { Text } = require("react-native");
  const MapSelector = ({ children }: { children?: React.ReactNode }) => (
    <>
      <Text testID="map-selector">térkép</Text>
      {children}
    </>
  );
  return MapSelector;
});
jest.mock("@/hooks/useNotificationPrefs", () => ({
  useNotificationPrefs: () => ({ prefs: { aiEnhance: false }, setPref: jest.fn(), hydrated: true }),
}));

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
  // Opened from a search box, which always passes its mode: the screen is for searching.
  __setLocalSearchParams({ mode: "biznisz" });
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

  it("lists the kérések on the search screen itself, filtered by the submitted text", async () => {
    __setLocalSearchParams({ mode: "kerelem" });
    supabase.functions.invoke.mockResolvedValue({
      data: [makeRequest({ id: 9, title: "Fúrógép kell" })],
      error: null,
    });
    const store = createTestStore();
    store.dispatch(storeBuzinessSearchParams({ text: "kerítés" }));
    store.dispatch(storeRequestSearchText("fúrógép"));
    await renderWithProviders(<SearchScreen />, { store });

    await waitFor(() => expect(screen.getByText("Fúrógép kell")).toBeTruthy());
    expect(screen.getByText("Találatok: fúrógép")).toBeTruthy();
    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      "request-search",
      expect.objectContaining({
        body: expect.objectContaining({ query: "fúrógép", scope: "all" }),
      }),
    );
    // No separate results page: nothing navigates, and the other searches are left alone.
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(store.getState().buziness.searchParams?.text).toBe("kerítés");
  });

  it("lists the slice chosen in the filter when nothing is searched", async () => {
    __setLocalSearchParams({ mode: "kerelem" });
    supabase.rpc.mockResolvedValue({ data: [makeRequest({ title: "Neked való" })], error: null });
    const store = createTestStore();
    store.dispatch(storeRequestScope("for_me"));
    await renderWithProviders(<SearchScreen />, { store });

    await waitFor(() => expect(screen.getByText("Neked való")).toBeTruthy());
    expect(screen.getByText("Kérések: Neked")).toBeTruthy();
    expect(supabase.rpc).toHaveBeenCalledWith(
      "requests_feed",
      expect.objectContaining({ p_scope: "for_me" }),
    );
  });

  it("keeps no search history for the kérések", async () => {
    __setLocalSearchParams({ mode: "kerelem" });
    await renderWithProviders(<SearchScreen />, { store: withRecentSearch("régi keresés") });

    expect(screen.queryByText("Korábbi kereséseid")).toBeNull();
  });

  it("offers a new request with the typed text in kérések mode, until it is cleared", async () => {
    __setLocalSearchParams({ mode: "kerelem" });
    const store = createTestStore();
    store.dispatch(storeRequestSearchText("  fúrógép kell "));
    await renderWithProviders(<SearchScreen />, { store });

    await fireEvent.press(screen.getByTestId("search-new-request"));
    expect(store.getState().requests.composer).toEqual({
      open: true,
      initialTitle: "fúrógép kell",
    });

    await fireEvent.press(screen.getByTestId("requests-clear-search"));
    expect(screen.queryByTestId("search-new-request")).toBeNull();
    expect(store.getState().requests.searchText).toBe("");
  });

  it("offers no new request in the other modes", async () => {
    const store = createTestStore();
    store.dispatch(storeRequestSearchText("fúrógép"));
    await renderWithProviders(<SearchScreen />, { store });

    expect(screen.queryByTestId("search-new-request")).toBeNull();
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

describe("search screen opened from the menu", () => {
  beforeEach(() => {
    // The Keresés tab opens /search with no mode.
    __setLocalSearchParams({});
  });

  const rows = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: i + 1,
      title: `Új biznisz ${i + 1} $ címke`,
      description: "leírás",
      author: "other",
      created_at: new Date().toISOString(),
      images: [],
      recommendations: 0,
    }));

  it("lists the new bizniszek with an empty, non-personalised search", async () => {
    supabase.functions.invoke.mockResolvedValue({ data: rows(2), error: null });
    const store = withRecentSearch("régi keresés");
    store.dispatch(setInterests(["kert"]));
    await renderWithProviders(<SearchScreen />, { store });

    await waitFor(() => expect(screen.getByText("Új biznisz 1")).toBeTruthy());
    expect(screen.getByText("Új bizniszek")).toBeTruthy();
    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      "business-search",
      expect.objectContaining({
        body: expect.objectContaining({ query: "", interests: [] }),
      }),
    );
  });

  it("does not show the search history until the user starts searching", async () => {
    supabase.functions.invoke.mockResolvedValue({ data: [], error: null });
    await renderWithProviders(<SearchScreen />, { store: withRecentSearch("régi keresés") });

    expect(screen.queryByText("Korábbi kereséseid")).toBeNull();
    expect(screen.queryByText("régi keresés")).toBeNull();
  });

  it("lists the newest requests in kérések mode", async () => {
    supabase.functions.invoke.mockResolvedValue({ data: [], error: null });
    supabase.rpc.mockResolvedValue({
      data: [makeRequest({ id: 3, title: "Fúrógép kell" })],
      error: null,
    });
    await renderWithProviders(<SearchScreen />, { store: withRecentSearch("régi keresés") });

    await fireEvent.press(screen.getByTestId("search-mode-kerelem"));

    await waitFor(() => expect(screen.getByText("Fúrógép kell")).toBeTruthy());
    expect(screen.getByText("Új kérések")).toBeTruthy();
    expect(supabase.rpc).toHaveBeenCalledWith(
      "requests_feed",
      expect.objectContaining({ p_scope: "all" }),
    );
  });
});

describe("search screen: Finomítás", () => {
  it.each(["biznisz", "fife", "kerelem"] as const)("is always there, in %s mode", async (mode) => {
    __setLocalSearchParams({ mode });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    expect(screen.getByTestId("search-filter")).toBeTruthy();
    expect(screen.getByText("Finomítás")).toBeTruthy();
  });

  it("is there when the screen was opened from the menu, too", async () => {
    __setLocalSearchParams({});
    supabase.functions.invoke.mockResolvedValue({ data: [], error: null });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    expect(screen.getByTestId("search-filter")).toBeTruthy();
  });

  it("opens the bizniszek filter (place, free-only) in biznisz mode", async () => {
    __setLocalSearchParams({ mode: "biznisz" });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    await fireEvent.press(screen.getByTestId("search-filter"));

    expect(await screen.findByText("Csak ingyenes bizniszek")).toBeTruthy();
    expect(screen.getByTestId("map-selector")).toBeTruthy();
  });

  it("opens only the place picker in fifék mode", async () => {
    __setLocalSearchParams({ mode: "fife" });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    await fireEvent.press(screen.getByTestId("search-filter"));

    expect(await screen.findByTestId("map-selector")).toBeTruthy();
    expect(screen.queryByText("Csak ingyenes bizniszek")).toBeNull();
  });

  it("opens the slices of the kérések in kérések mode, and picking one filters the list", async () => {
    __setLocalSearchParams({ mode: "kerelem" });
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const store = createTestStore();
    await renderWithProviders(<SearchScreen />, { store });

    await fireEvent.press(screen.getByTestId("search-filter"));
    await fireEvent.press(await screen.findByTestId("requests-scope-mine"));

    expect(store.getState().requests.scope).toBe("mine");
    await waitFor(() =>
      expect(supabase.rpc).toHaveBeenCalledWith(
        "requests_feed",
        expect.objectContaining({ p_scope: "mine" }),
      ),
    );
  });
});
