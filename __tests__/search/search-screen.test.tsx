import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";

import SearchScreen from "@/app/search";
import { storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { storeSearchText, storeSearchView } from "@/redux/reducers/searchReducer";
import { addPreviousSearch } from "@/redux/reducers/userReducer";
import { SearchMode } from "@/redux/store.type";
import { makeRequest } from "@/test-utils/fixtures/requests";
import {
  __resetRouter,
  __setLocalSearchParams,
  navigation,
  router,
} from "@/test-utils/mocks/expo-router";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import {
  createTestStore,
  renderWithProviders,
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
jest.mock("@/components/mapView/FiFeMap", () => {
  const { View } = require("react-native");
  const FiFeMap = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>;
  return FiFeMap;
});
jest.mock("@/components/buziness/BuzinessMap", () => ({ BuzinessMap: () => null }));
jest.mock("@/hooks/useNotificationPrefs", () => ({
  useNotificationPrefs: () => ({ prefs: { aiEnhance: false }, setPref: jest.fn(), hydrated: true }),
}));
jest.mock("@/components/tutorial/Measure", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const biznisz = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    title: `Új biznisz ${i + 1} $ címke`,
    description: "leírás",
    author: "other",
    created_at: new Date().toISOString(),
    images: [],
    recommendations: 0,
    relevance: 1,
  }));

const withRecentSearch = (query: string, mode: SearchMode = "biznisz") => {
  const store = createTestStore();
  store.dispatch(addPreviousSearch({ query, mode }));
  return store;
};

/**
 * The props of the search box the screen hands to the app bar. The header is not part of the
 * screen's own tree, so the box is driven through them: what the user typing, submitting or
 * tapping into it would call.
 */
const searchBox = () => {
  const { header } = navigation.setOptions.mock.calls.at(-1)?.[0] ?? {};
  expect(header).toBeDefined();
  return header().props.center.props as {
    mode: SearchMode;
    initialText: string;
    autoFocus: boolean;
    onSearch: (query: string) => void;
    onFocus: () => void;
    onBlur: () => void;
    onChangeText: (text: string) => void;
  };
};

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
  __setLocalSearchParams({});
  supabase.functions.invoke.mockResolvedValue({ data: [], error: null });
});

describe("the search screen: every chip starts a search", () => {
  it("opens on the new bizniszek, searched with no query", async () => {
    supabase.functions.invoke.mockResolvedValue({ data: biznisz(2), error: null });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    await waitFor(() => expect(screen.getByText("Új biznisz 1")).toBeTruthy());
    expect(screen.getByTestId("search-title")).toHaveTextContent("Új bizniszek");
    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      "business-search",
      expect.objectContaining({ body: expect.objectContaining({ query: "" }) }),
    );
  });

  it("highlights the active chip, and only that one", async () => {
    __setLocalSearchParams({ mode: "kerelem" });
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    const selected = (mode: string) =>
      screen.getByTestId(`search-mode-${mode}`).props.accessibilityState?.selected;
    expect(selected("kerelem")).toBe(true);
    expect(selected("biznisz")).toBe(false);
    expect(selected("fife")).toBe(false);
  });

  it.each([
    ["fife", { pathname: "/search", params: { mode: "fife" } }],
    ["kerelem", { pathname: "/search", params: { mode: "kerelem", scope: "for_me" } }],
  ] as const)("starts the default %s search from its chip, as a new history entry", async (mode, href) => {
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    await fireEvent.press(screen.getByTestId(`search-mode-${mode}`));

    expect(router.push).toHaveBeenCalledWith(href);
  });

  it("reloads instead of stacking a twin when the active chip is tapped again", async () => {
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenCalledTimes(1));

    await fireEvent.press(screen.getByTestId("search-mode-biznisz"));

    expect(router.push).not.toHaveBeenCalled();
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenCalledTimes(2));
  });

  it("goes back to the plain search of a category from a query search", async () => {
    __setLocalSearchParams({ mode: "biznisz", q: "kert" });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    await fireEvent.press(screen.getByTestId("search-mode-biznisz"));

    expect(router.push).toHaveBeenCalledWith({ pathname: "/search", params: { mode: "biznisz" } });
  });

  it("lists the FiFe Radar in fifék mode", async () => {
    __setLocalSearchParams({ mode: "fife" });
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    expect(screen.getByTestId("search-title")).toHaveTextContent("FiFe Radar");
  });

  it("lists the kérések for the user in kérések mode", async () => {
    __setLocalSearchParams({ mode: "kerelem", scope: "for_me" });
    supabase.rpc.mockResolvedValue({ data: [makeRequest({ title: "Neked való" })], error: null });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    await waitFor(() => expect(screen.getByText("Neked való")).toBeTruthy());
    expect(screen.getByTestId("search-title")).toHaveTextContent("Kérések neked");
    expect(supabase.rpc).toHaveBeenCalledWith(
      "requests_feed",
      expect.objectContaining({ p_scope: "for_me" }),
    );
  });
});

describe("the search screen: a search is a history entry", () => {
  it("pushes a query search as a new entry and records it in the history", async () => {
    const store = createTestStore();
    await renderWithProviders(<SearchScreen />, { store });

    await act(async () => searchBox().onSearch("kert"));

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/search",
      params: { mode: "biznisz", q: "kert" },
    });
    expect(store.getState().user.previousSearches).toEqual(["kert"]);
  });

  it("pushes the empty search too, so Back can return to it", async () => {
    __setLocalSearchParams({ mode: "biznisz", q: "kert" });
    const store = createTestStore();
    await renderWithProviders(<SearchScreen />, { store });

    await act(async () => searchBox().onSearch(""));

    expect(router.push).toHaveBeenCalledWith({ pathname: "/search", params: { mode: "biznisz" } });
  });

  it("searches the kérések in the whole of them, not only the ones for the user", async () => {
    __setLocalSearchParams({ mode: "kerelem", scope: "for_me" });
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const store = createTestStore();
    await renderWithProviders(<SearchScreen />, { store });

    await act(async () => searchBox().onSearch("fúrógép"));

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/search",
      params: { mode: "kerelem", q: "fúrógép", scope: "all" },
    });
    expect(store.getState().user.previousSearches).toEqual([]);
  });

  it("does not take the keyboard unless a search box that was tapped sent the user here", async () => {
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });
    expect(searchBox().autoFocus).toBe(false);

    __setLocalSearchParams({ mode: "biznisz", focus: "1" });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });
    expect(searchBox().autoFocus).toBe(true);
  });
});

describe("the search screen: the previous searches", () => {
  it("are not shown until the user taps into the search box", async () => {
    await renderWithProviders(<SearchScreen />, { store: withRecentSearch("régi keresés") });

    expect(screen.queryByText("Korábbi kereséseid")).toBeNull();

    await act(async () => searchBox().onFocus());
    expect(await screen.findByText("Korábbi kereséseid")).toBeTruthy();
    expect(screen.getByText("régi keresés")).toBeTruthy();

    // ...and go away again when the box is left.
    await act(async () => searchBox().onBlur());
    await waitFor(() => expect(screen.queryByText("Korábbi kereséseid")).toBeNull());
  });

  it("start the search of the row that is pressed", async () => {
    await renderWithProviders(<SearchScreen />, { store: withRecentSearch("léckerítés") });
    await act(async () => searchBox().onFocus());

    await fireEvent.press(await screen.findByText("léckerítés"));

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/search",
      params: { mode: "biznisz", q: "léckerítés" },
    });
  });

  it("are kept apart per mode", async () => {
    __setLocalSearchParams({ mode: "fife" });
    const store = withRecentSearch("léckerítés");
    store.dispatch(addPreviousSearch({ query: "Nagy Pista", mode: "fife" }));
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    await renderWithProviders(<SearchScreen />, { store });
    await act(async () => searchBox().onFocus());

    expect(await screen.findByText("Nagy Pista")).toBeTruthy();
    expect(screen.queryByText("léckerítés")).toBeNull();
  });

  it("do not exist for the kérések", async () => {
    __setLocalSearchParams({ mode: "kerelem" });
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    await renderWithProviders(<SearchScreen />, { store: withRecentSearch("régi keresés") });

    await act(async () => searchBox().onFocus());

    expect(screen.queryByText("Korábbi kereséseid")).toBeNull();
  });
});

describe("the search screen: Új kérés", () => {
  it("is one button, above the list of the kérések", async () => {
    __setLocalSearchParams({ mode: "kerelem", scope: "for_me" });
    supabase.rpc.mockResolvedValue({ data: [makeRequest({ title: "Valami" })], error: null });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    await waitFor(() => expect(screen.getByText("Valami")).toBeTruthy());
    expect(screen.getAllByTestId("search-new-request")).toHaveLength(1);
    expect(screen.queryByTestId("search-new-request-bottom")).toBeNull();
  });

  it("is above, and not under, the list of the bizniszek", async () => {
    supabase.functions.invoke.mockResolvedValue({ data: biznisz(2), error: null });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    await waitFor(() => expect(screen.getByText("Új biznisz 1")).toBeTruthy());
    expect(screen.getByTestId("search-new-request-top")).toBeTruthy();
    expect(screen.queryByTestId("search-new-request-bottom")).toBeNull();
  });

  it("is there on an empty list of the kérések, too", async () => {
    __setLocalSearchParams({ mode: "kerelem", scope: "for_me" });
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    await waitFor(() => expect(screen.getByText(/Most nincs a környékeden/)).toBeTruthy());
    expect(screen.getAllByTestId("search-new-request")).toHaveLength(1);
  });

  it("is at the top of the previous searches, too", async () => {
    await renderWithProviders(<SearchScreen />, { store: withRecentSearch("régi keresés") });
    await act(async () => searchBox().onFocus());

    expect(await screen.findByTestId("search-new-request-history")).toBeTruthy();
  });

  it("says Új kérés while nothing is typed, and carries the typed text into the modal", async () => {
    __setLocalSearchParams({ mode: "kerelem", scope: "for_me" });
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const store = createTestStore();
    await renderWithProviders(<SearchScreen />, { store });
    expect(await screen.findAllByText("Új kérés", { exact: true })).toHaveLength(1);

    await act(async () => searchBox().onChangeText(" fúrógép kell "));

    expect(await screen.findAllByText("Új kérés ezzel a szöveggel: „fúrógép kell”")).toHaveLength(1);
    await fireEvent.press(screen.getByTestId("search-new-request"));
    expect(store.getState().requests.composer).toEqual({ open: true, initialTitle: "fúrógép kell" });
  });
});

describe("the search screen: the error of the kérések", () => {
  it("is shown in an error container, not as a bare line", async () => {
    __setLocalSearchParams({ mode: "kerelem", scope: "for_me" });
    supabase.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    const container = await screen.findByTestId("requests-error");
    expect(container).toBeTruthy();
    expect(screen.getByText("Sajnos hiba történt, próbáld meg később")).toBeTruthy();
  });
});

describe("the search screen: the map view", () => {
  it.each(["biznisz", "fife", "kerelem"] as const)("has a view switch in %s mode", async (mode) => {
    __setLocalSearchParams({ mode });
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    expect(screen.getByTestId("search-view-switch")).toBeTruthy();
  });

  it("switches every tab between the list and the map, which has no list", async () => {
    __setLocalSearchParams({ mode: "kerelem", scope: "for_me" });
    supabase.rpc.mockResolvedValue({
      data: [makeRequest({ title: "Valami", lat: 47.5, long: 19.05 })],
      error: null,
    });
    const store = createTestStore();
    await renderWithProviders(<SearchScreen />, { store });
    await waitFor(() => expect(screen.getByText("Valami")).toBeTruthy());
    expect(screen.queryByTestId("results-map")).toBeNull();

    await fireEvent.press(screen.getByTestId("search-view-switch"));

    expect(store.getState().search.view).toBe("map");
    expect(await screen.findByTestId("results-map")).toBeTruthy();
    // No list on the map: the request shows only as a pin, and as a card once it is picked.
    expect(screen.queryByText("Valami")).toBeNull();
    await fireEvent.press((await screen.findAllByTestId("map-pin"))[0]);
    expect(await screen.findByText("Valami")).toBeTruthy();

    // The switch is among the map's own buttons now, still one.
    expect(screen.getAllByTestId("search-view-switch")).toHaveLength(1);
    await fireEvent.press(screen.getByTestId("search-view-switch"));
    expect(store.getState().search.view).toBe("list");
    await waitFor(() => expect(screen.queryByTestId("results-map")).toBeNull());
  });

  it("asks for a big page of the kérések for the map", async () => {
    __setLocalSearchParams({ mode: "kerelem", scope: "for_me" });
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const store = createTestStore();
    store.dispatch(storeSearchView("map"));
    await renderWithProviders(<SearchScreen />, { store });

    await waitFor(() =>
      expect(supabase.rpc).toHaveBeenCalledWith(
        "requests_feed",
        expect.objectContaining({ p_take: 100 }),
      ),
    );
  });

  it("searches the bizniszek again for the map, which wants every pin", async () => {
    const store = createTestStore();
    await renderWithProviders(<SearchScreen />, { store });
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenCalledTimes(1));

    await fireEvent.press(screen.getByTestId("search-view-switch"));

    await waitFor(() =>
      expect(supabase.functions.invoke).toHaveBeenLastCalledWith(
        "business-search",
        expect.objectContaining({ body: expect.objectContaining({ take: -1 }) }),
      ),
    );
  });
});

describe("the search screen: the one search text of the store", () => {
  it.each(["biznisz", "fife", "kerelem"] as const)("follows the query of the search on screen in %s mode", async (mode) => {
    __setLocalSearchParams({ mode, q: "kert" });
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const store = createTestStore();

    await renderWithProviders(<SearchScreen />, { store });

    await waitFor(() => expect(store.getState().search.text).toBe("kert"));
  });

  it("is emptied by a search with no query", async () => {
    __setLocalSearchParams({ mode: "biznisz" });
    const store = createTestStore();
    store.dispatch(storeSearchText("régi"));

    await renderWithProviders(<SearchScreen />, { store });

    await waitFor(() => expect(store.getState().search.text).toBe(""));
  });
});

describe("the search screen: the title", () => {
  it("says what is searched, in which category, and what the filter narrowed", async () => {
    __setLocalSearchParams({ mode: "kerelem", q: "fúrógép", scope: "mine" });
    supabase.functions.invoke.mockResolvedValue({ data: [], error: null });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    expect(screen.getByTestId("search-title")).toHaveTextContent(
      "Találatok a kérések között: fúrógép",
    );
    // What the filter narrowed is a line of its own, not part of the title.
    expect(screen.getByTestId("search-title-filters")).toHaveTextContent("saját");
  });

  it("follows the bizniszek filter", async () => {
    const store = createTestStore();
    store.dispatch(storeBuzinessSearchParams({ ingyen: true }));
    await renderWithProviders(<SearchScreen />, { store });

    expect(screen.getByTestId("search-title")).toHaveTextContent("Új bizniszek");
    expect(screen.getByTestId("search-title-filters")).toHaveTextContent("ingyenes");
  });
});

describe("the search screen: Szűrés", () => {
  it.each(["biznisz", "fife", "kerelem"] as const)("is always there, in %s mode", async (mode) => {
    __setLocalSearchParams({ mode });
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    expect(screen.getByTestId("search-filter")).toBeTruthy();
    expect(screen.getByText("Szűrés")).toBeTruthy();
  });

  it("opens the bizniszek filter (place, free-only) in biznisz mode", async () => {
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    await fireEvent.press(screen.getByTestId("search-filter"));

    expect(await screen.findByText("Csak ingyenes bizniszek")).toBeTruthy();
    expect(screen.getByTestId("map-selector")).toBeTruthy();
  });

  it("opens only the place picker in fifék mode", async () => {
    __setLocalSearchParams({ mode: "fife" });
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    await fireEvent.press(screen.getByTestId("search-filter"));

    expect(await screen.findByTestId("map-selector")).toBeTruthy();
    expect(screen.queryByText("Csak ingyenes bizniszek")).toBeNull();
  });

  it("opens the slices of the kérések in kérések mode; picking one changes the search in place", async () => {
    __setLocalSearchParams({ mode: "kerelem", scope: "for_me" });
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    await renderWithProviders(<SearchScreen />, { store: createTestStore() });

    await fireEvent.press(screen.getByTestId("search-filter"));
    await fireEvent.press(await screen.findByTestId("requests-scope-mine"));

    // Not a new history entry: the filter refines the search on screen.
    expect(router.setParams).toHaveBeenCalledWith({ scope: "mine" });
    expect(router.push).not.toHaveBeenCalled();
  });
});
