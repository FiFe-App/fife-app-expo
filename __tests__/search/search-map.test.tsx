import { act, fireEvent, screen, waitFor, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import SearchScreen from "@/app/search";
import { storeSearchView } from "@/redux/reducers/searchReducer";
import { addPreviousSearch, init, setLocation } from "@/redux/reducers/userReducer";
import { makeRequest } from "@/test-utils/fixtures/requests";
import { __resetRouter, __setLocalSearchParams, navigation } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));
jest.mock("@/hooks/useNotificationPrefs", () => ({
  useNotificationPrefs: () => ({ prefs: { aiEnhance: false }, setPref: jest.fn(), hydrated: true }),
}));
jest.mock("@/components/tutorial/Measure", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/components/mapView/mapView", () => {
  const { Pressable } = require("react-native");
  return {
    Marker: ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) =>
      onPress ? (
        <Pressable testID="map-pin" onPress={onPress}>
          {children}
        </Pressable>
      ) : null,
    Circle: () => null,
  };
});
// How many times the map was created: it must be once, however many tabs are visited.
const mockMapMounts = jest.fn();
jest.mock("@/components/mapView/FiFeMap", () => {
  const React = require("react");
  const { Pressable, View } = require("react-native");
  const FiFeMap = ({
    children,
    onPress,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
  }) => {
    React.useEffect(() => {
      mockMapMounts();
    }, []);
    return (
      <View testID="the-map">
        <Pressable testID="map-background" onPress={onPress} />
        {children}
      </View>
    );
  };
  return FiFeMap;
});

const MY_UID = "11111111-1111-1111-1111-111111111111";

/** A WKB hex point, as PostGIS hands a biznisz location over. */
const wkbPoint = (lon: number, lat: number) => {
  const b = Buffer.alloc(21);
  b.writeUInt8(1, 0);
  b.writeUInt32LE(1, 1);
  b.writeDoubleLE(lon, 5);
  b.writeDoubleLE(lat, 13);
  return b.toString("hex");
};

const biznisz = {
  id: 7,
  title: "Kertész Kft $ kertészet",
  description: "leírás",
  author: "other",
  created_at: new Date().toISOString(),
  images: [],
  recommendations: 0,
  relevance: 1,
  location: wkbPoint(19.05, 47.5),
};

const fifeRow = {
  id: "u1",
  full_name: "Nagy Pista",
  username: null,
  avatar_url: null,
  website: null,
  created_at: null,
  recommendations: 0,
  lat: 47.5,
  long: 19.05,
  distance: 100,
  buzinesses: [],
};

const mapStore = () => {
  const store = createTestStore();
  store.dispatch(init(MY_UID));
  store.dispatch(setLocation({ latitude: 47.5, longitude: 19.05, radius: 500 }));
  store.dispatch(storeSearchView("map"));
  return store;
};

const SEARCH_HERE = "map-search-here";

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
  __setLocalSearchParams({});
  mockMapMounts.mockClear();
  supabase.functions.invoke.mockResolvedValue({ data: [biznisz], error: null });
  supabase.rpc.mockImplementation(async (name?: string) => ({
    data: name === "requests_feed" ? [makeRequest({ title: "Kertészt keresek", lat: 47.5, long: 19.05 })] : [fifeRow],
    error: null,
  }));
});

describe("the search screen: one map", () => {
  it("is created once and only changes its pins when the tabs change", async () => {
    await renderWithProviders(<SearchScreen />, { store: mapStore() });
    expect(await screen.findAllByTestId("map-pin")).toHaveLength(1);

    await fireEvent.press(screen.getByTestId("search-mode-fife"));
    await waitFor(() => expect(supabase.rpc).toHaveBeenCalledWith("nearest_profiles", expect.anything()));
    await fireEvent.press(screen.getByTestId("search-mode-kerelem"));
    await fireEvent.press(screen.getByTestId("search-mode-biznisz"));

    expect(mockMapMounts).toHaveBeenCalledTimes(1);
    expect(screen.getAllByTestId("the-map")).toHaveLength(1);
  });

  it("is not created by a list view", async () => {
    const store = mapStore();
    store.dispatch(storeSearchView("list"));
    await renderWithProviders(<SearchScreen />, { store });

    expect(screen.queryByTestId("the-map")).toBeNull();
  });
});

describe("the search screen: a picked pin", () => {
  it.each([
    ["biznisz", "Kertész Kft"],
    ["fife", "Nagy Pista"],
    ["kerelem", "Kertészt keresek"],
  ] as const)(
    "replaces \"Keress ezen a környéken\" with a list item of the record, in %s mode",
    async (mode, name) => {
      __setLocalSearchParams({ mode, scope: "for_me" });
      await renderWithProviders(<SearchScreen />, { store: mapStore() });
      const pin = await screen.findAllByTestId("map-pin");
      expect(screen.getByTestId(SEARCH_HERE)).toBeTruthy();
      expect(screen.queryByText(name)).toBeNull();

      await fireEvent.press(pin[0]);

      expect(await screen.findByText(name)).toBeTruthy();
      expect(screen.queryByTestId(SEARCH_HERE)).toBeNull();

      // A tap on the bare map ends the selection: the button is back. (Not the very tap that
      // picked the pin, which some maps also report as a map press.)
      await fireEvent.press(screen.getByTestId("map-background"));
      expect(screen.queryByTestId(SEARCH_HERE)).toBeNull();
      jest.spyOn(Date, "now").mockReturnValue(Date.now() + 1000);
      await fireEvent.press(screen.getByTestId("map-background"));
      jest.restoreAllMocks();
      await waitFor(() => expect(screen.getByTestId(SEARCH_HERE)).toBeTruthy());
      expect(screen.queryByText(name)).toBeNull();
    },
  );

  it("is forgotten when the tab changes", async () => {
    await renderWithProviders(<SearchScreen />, { store: mapStore() });
    await fireEvent.press((await screen.findAllByTestId("map-pin"))[0]);
    expect(await screen.findByText("Kertész Kft")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("search-mode-fife"));

    expect(screen.queryByText("Kertész Kft")).toBeNull();
    await waitFor(() => expect(screen.getByTestId(SEARCH_HERE)).toBeTruthy());
  });
});

describe("the search screen: nothing blocks anything", () => {
  const style = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style) ?? {};

  it.each(["biznisz", "fife", "kerelem"] as const)(
    "has the switch at the top right and the map buttons in one overlay at the bottom, in %s mode",
    async (mode) => {
      __setLocalSearchParams({ mode, scope: "for_me" });
      const store = mapStore();
      await renderWithProviders(<SearchScreen />, { store });
      await screen.findAllByTestId("map-pin");

      // The switch: one, outside the map's overlay, so it cannot be covered by it...
      const overlay = screen.getByTestId("map-overlay");
      expect(screen.getAllByTestId("search-view-switch")).toHaveLength(1);
      expect(within(overlay).queryByTestId("search-view-switch")).toBeNull();
      // ...and the map's buttons and the "search around here" button are in it, as rows of a
      // column, not separately placed layers.
      for (const id of ["map-locate", "map-zoom-in", "map-zoom-out", SEARCH_HERE]) {
        expect(within(overlay).getByTestId(id)).toBeTruthy();
      }
      expect(style("map-overlay").position).toBe("absolute");

      // Picking a pin changes what is in the column, not what is absolutely placed.
      await fireEvent.press(screen.getAllByTestId("map-pin")[0]);
      expect(within(screen.getByTestId("map-overlay")).getByTestId("map-locate")).toBeTruthy();
      expect(screen.getAllByTestId("search-view-switch")).toHaveLength(1);
    },
  );

  it("keeps the switch at the same place in the list view and the map view", async () => {
    const store = mapStore();
    await renderWithProviders(<SearchScreen />, { store });
    const parentOf = () => screen.getByTestId("search-view-switch").parent?.parent?.parent;
    const inMap = parentOf();

    await fireEvent.press(screen.getByTestId("search-view-switch"));
    await waitFor(() => expect(screen.queryByTestId("the-map")).toBeNull());

    expect(screen.getByTestId("search-filter")).toBeTruthy();
    expect(parentOf()).toBe(inMap);
  });

  it("does not stack a second absolutely positioned layer over the map", async () => {
    await renderWithProviders(<SearchScreen />, { store: mapStore() });
    await screen.findAllByTestId("map-pin");

    const map = screen.getByTestId("search-map");
    const absolute: string[] = [];
    const walk = (node: { props?: { style?: unknown; testID?: string }; children?: unknown[] }) => {
      const flat = StyleSheet.flatten(node.props?.style as object) as { position?: string } | undefined;
      if (flat?.position === "absolute") absolute.push(node.props?.testID ?? "(anonymous)");
      (node.children ?? []).forEach((c) => typeof c === "object" && c && walk(c as never));
    };
    await act(async () => {});
    walk(map as never);
    // Only the overlay column is placed over the map: everything else flows inside it. (The
    // map itself is the layer below, filling its container.)
    expect(absolute.filter((id) => id !== "(anonymous)")).toEqual(["map-overlay"]);
  });
});

describe("the search screen: a tall card", () => {
  it("is bounded by the map and scrolls, instead of covering the header", async () => {
    __setLocalSearchParams({ mode: "kerelem", scope: "for_me" });
    await renderWithProviders(<SearchScreen />, { store: mapStore() });
    await fireEvent.press((await screen.findAllByTestId("map-pin"))[0]);

    const overlay = StyleSheet.flatten(screen.getByTestId("map-overlay").props.style);
    expect(overlay.top).toBeDefined();
    expect(overlay.bottom).toBeDefined();
    expect(within(screen.getByTestId("map-overlay")).getByTestId("map-card")).toBeTruthy();
  });

  it("switches the view in one tap even while the previous searches are open", async () => {
    const store = mapStore();
    store.dispatch(storeSearchView("list"));
    store.dispatch(addPreviousSearch({ query: "régi keresés", mode: "biznisz" }));
    await renderWithProviders(<SearchScreen />, { store });
    const { header } = navigation.setOptions.mock.calls.at(-1)![0];
    await act(async () => header().props.center.props.onFocus());
    expect(await screen.findByText("Korábbi kereséseid")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("search-view-switch"));

    expect(await screen.findByTestId("the-map")).toBeTruthy();
  });
});

describe("the search screen: the map's locate button", () => {
  it("is one button, with a question mark while no position is known", async () => {
    await renderWithProviders(<SearchScreen />, { store: mapStore() });
    await screen.findAllByTestId("map-pin");

    expect(screen.getAllByTestId("map-locate")).toHaveLength(1);
  });
});
