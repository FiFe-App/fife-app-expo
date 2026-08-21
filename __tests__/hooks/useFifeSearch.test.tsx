import { act } from "@testing-library/react-native";
import { Dimensions } from "react-native";

import { NO_LOCATION_ERROR, useFifeSearch } from "@/hooks/useFifeSearch";
import { setLocation } from "@/redux/reducers/userReducer";
import { storeUserSearchParams } from "@/redux/reducers/usersReducer";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import {
  createTestStore,
  renderHookWithProviders,
} from "@/test-utils/renderWithProviders";

// PAGE_SIZE is derived from the window height, so pin it: 1000/100 = 10.
// jest.setup.js calls restoreAllMocks() after every test, so this has to be
// re-installed each time rather than once at module load.
const PAGE_SIZE = 10;
const pinWindowHeight = () =>
  jest.spyOn(Dimensions, "get").mockReturnValue({
    width: 400,
    height: PAGE_SIZE * 100,
    scale: 2,
    fontScale: 2,
  });

const profileAt = (lat: number, lng: number) => {
  const store = createTestStore();
  store.dispatch(setLocation({ latitude: lat, longitude: lng, radius: 500 }));
  return store;
};

const rows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `u${i}`, full_name: `U${i}` }));

const rpcArgs = () => supabase.rpc.mock.calls.at(-1)?.[1];

beforeEach(() => {
  __resetSupabase();
  pinWindowHeight();
});

describe("useFifeSearch / choosing where to search", () => {
  it("reports a missing location instead of querying", async () => {
    const { result } = await renderHookWithProviders(() => useFifeSearch(), {
      store: createTestStore(),
    });

    await act(async () => {
      await result.current.fetch();
    });

    expect(result.current.error).toBe(NO_LOCATION_ERROR);
    expect(result.current.data).toEqual([]);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("searches around the profile location when nothing else is set", async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const { result } = await renderHookWithProviders(() => useFifeSearch(), {
      store: profileAt(47.5, 19.05),
    });

    await act(async () => {
      await result.current.fetch();
    });

    expect(supabase.rpc).toHaveBeenCalledWith(
      "nearest_profiles",
      expect.objectContaining({ p_lat: 47.5, p_long: 19.05 }),
    );
    expect(result.current.error).toBeNull();
  });

  it("prefers an explicitly picked circle over the profile location", async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const store = profileAt(47.5, 19.05);
    store.dispatch(
      storeUserSearchParams({
        searchCircle: { location: { latitude: 46.1, longitude: 18.2 }, radius: 5 },
      }),
    );

    const { result } = await renderHookWithProviders(() => useFifeSearch(), {
      store,
    });
    await act(async () => {
      await result.current.fetch();
    });

    expect(rpcArgs()).toEqual(
      expect.objectContaining({ p_lat: 46.1, p_long: 18.2 }),
    );
  });

  it("recovers once a location is set, without a remount", async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const store = createTestStore();
    const { result } = await renderHookWithProviders(() => useFifeSearch(), {
      store,
    });

    await act(async () => {
      await result.current.fetch();
    });
    expect(result.current.error).toBe(NO_LOCATION_ERROR);

    // This is the radar bug: saving a location in settings must make the very
    // next search work, rather than waiting for an app restart.
    await act(async () => {
      store.dispatch(
        setLocation({ latitude: 47.5, longitude: 19.05, radius: 500 }),
      );
    });
    await act(async () => {
      await result.current.fetch();
    });

    expect(result.current.error).toBeNull();
    expect(rpcArgs()).toEqual(
      expect.objectContaining({ p_lat: 47.5, p_long: 19.05 }),
    );
  });
});

describe("useFifeSearch / results and paging", () => {
  it("keeps the returned profiles", async () => {
    supabase.rpc.mockResolvedValue({ data: rows(3), error: null });
    const { result } = await renderHookWithProviders(() => useFifeSearch(), {
      store: profileAt(47.5, 19.05),
    });

    await act(async () => {
      await result.current.fetch();
    });

    expect(result.current.data).toHaveLength(3);
    // A short page means there is nothing more to ask for.
    expect(result.current.hasMore).toBe(false);
  });

  it("expects more when the first page comes back full", async () => {
    supabase.rpc.mockResolvedValue({ data: rows(PAGE_SIZE), error: null });
    const { result } = await renderHookWithProviders(() => useFifeSearch(), {
      store: profileAt(47.5, 19.05),
    });

    await act(async () => {
      await result.current.fetch();
    });

    expect(result.current.hasMore).toBe(true);
    expect(rpcArgs()).toEqual(
      expect.objectContaining({ skip: 0, take: PAGE_SIZE }),
    );
  });

  it("appends the next page and advances the offset", async () => {
    supabase.rpc.mockResolvedValue({ data: rows(PAGE_SIZE), error: null });
    const { result } = await renderHookWithProviders(() => useFifeSearch(), {
      store: profileAt(47.5, 19.05),
    });

    await act(async () => {
      await result.current.fetch();
    });
    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(rpcArgs()).toEqual(expect.objectContaining({ skip: PAGE_SIZE }));
    expect(result.current.data).toHaveLength(PAGE_SIZE * 2);
  });

  it("does not page past the end", async () => {
    supabase.rpc.mockResolvedValue({ data: rows(2), error: null });
    const { result } = await renderHookWithProviders(() => useFifeSearch(), {
      store: profileAt(47.5, 19.05),
    });

    await act(async () => {
      await result.current.fetch();
    });
    supabase.rpc.mockClear();
    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("surfaces a query error and clears stale results", async () => {
    supabase.rpc
      .mockResolvedValueOnce({ data: rows(2), error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "rpc exploded" } });
    const { result } = await renderHookWithProviders(() => useFifeSearch(), {
      store: profileAt(47.5, 19.05),
    });

    await act(async () => {
      await result.current.fetch();
    });
    await act(async () => {
      await result.current.fetch();
    });

    expect(result.current.error).toBe("rpc exploded");
    expect(result.current.data).toEqual([]);
  });

  it("treats an empty result as a successful empty search, not an error", async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const { result } = await renderHookWithProviders(() => useFifeSearch(), {
      store: profileAt(47.5, 19.05),
    });

    await act(async () => {
      await result.current.fetch();
    });

    // The radar shows a "nobody nearby" hint for this, not the error card.
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual([]);
  });
});
