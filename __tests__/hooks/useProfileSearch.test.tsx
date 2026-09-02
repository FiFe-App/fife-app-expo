import { act } from "@testing-library/react-native";
import { Dimensions } from "react-native";

import {
  PROFILE_SEARCH_ERROR,
  useProfileSearch,
} from "@/hooks/useProfileSearch";
import { init } from "@/redux/reducers/userReducer";
import { __resetSupabase, __setTableRows, supabase } from "@/test-utils/mocks/supabase";
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

const MY_UID = "11111111-1111-1111-1111-111111111111";

const storeAsUser = () => {
  const store = createTestStore();
  store.dispatch(init(MY_UID));
  return store;
};

const rows = (n: number, prefix = "u") =>
  Array.from({ length: n }, (_, i) => ({
    id: `${prefix}${i}`,
    full_name: `${prefix.toUpperCase()}${i}`,
    username: null,
    avatar_url: null,
    website: null,
    created_at: null,
    updated_at: null,
    viewed_functions: null,
    profileRecommendations: [],
    buzinesses: [],
  }));

/** The chainable builder returned by the most recent `supabase.from(...)` call. */
const lastBuilder = () =>
  supabase.from.mock.results.at(-1)?.value as Record<string, jest.Mock>;

const argsOf = (method: string) => lastBuilder()[method].mock.calls.at(-1);

beforeEach(() => {
  __resetSupabase();
  pinWindowHeight();
});

describe("useProfileSearch / building the query", () => {
  it("does not query at all for a query with nothing searchable in it", async () => {
    const { result } = await renderHookWithProviders(() => useProfileSearch(), {
      store: storeAsUser(),
    });

    await act(async () => {
      await result.current.search("   ");
    });

    expect(supabase.from).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });

  it("matches the sanitised text against both the name and the username", async () => {
    __setTableRows("profiles", { data: rows(2), error: null });
    const { result } = await renderHookWithProviders(() => useProfileSearch(), {
      store: storeAsUser(),
    });

    await act(async () => {
      await result.current.search("Pista");
    });

    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(argsOf("or")).toEqual([
      "full_name.ilike.\"%Pista%\",username.ilike.\"%Pista%\"",
    ]);
  });

  it("excludes the searching user, the way nearest_profiles does", async () => {
    __setTableRows("profiles", { data: [], error: null });
    const { result } = await renderHookWithProviders(() => useProfileSearch(), {
      store: storeAsUser(),
    });

    await act(async () => {
      await result.current.search("Pista");
    });

    expect(argsOf("neq")).toEqual(["id", MY_UID]);
  });

  it("builds a fresh query per search instead of reusing one builder", async () => {
    // PostgrestFilterBuilder mutates its own URL and .or() appends, so a shared
    // instance would carry the first search's filter into the second.
    __setTableRows("profiles", { data: [], error: null });
    const { result } = await renderHookWithProviders(() => useProfileSearch(), {
      store: storeAsUser(),
    });

    await act(async () => {
      await result.current.search("Pista");
    });
    const first = lastBuilder();

    await act(async () => {
      await result.current.search("Kata");
    });
    const second = lastBuilder();

    expect(supabase.from).toHaveBeenCalledTimes(2);
    expect(second).not.toBe(first);
    expect(first.or).toHaveBeenCalledTimes(1);
    expect(second.or).toHaveBeenCalledTimes(1);
  });
});

describe("useProfileSearch / results and paging", () => {
  it("reports more pages only when the first one came back full", async () => {
    __setTableRows("profiles", { data: rows(PAGE_SIZE), error: null });
    const { result } = await renderHookWithProviders(() => useProfileSearch(), {
      store: storeAsUser(),
    });

    await act(async () => {
      await result.current.search("Pista");
    });
    expect(result.current.results).toHaveLength(PAGE_SIZE);
    expect(result.current.hasMore).toBe(true);

    __setTableRows("profiles", { data: rows(3), error: null });
    await act(async () => {
      await result.current.search("Kata");
    });
    expect(result.current.hasMore).toBe(false);
  });

  it("appends the next page using the same filter", async () => {
    __setTableRows("profiles", { data: rows(PAGE_SIZE), error: null });
    const { result } = await renderHookWithProviders(() => useProfileSearch(), {
      store: storeAsUser(),
    });

    await act(async () => {
      await result.current.search("Pista");
    });

    __setTableRows("profiles", { data: rows(4, "p"), error: null });
    await act(async () => {
      await result.current.loadNext();
    });

    expect(argsOf("or")).toEqual([
      "full_name.ilike.\"%Pista%\",username.ilike.\"%Pista%\"",
    ]);
    expect(argsOf("range")).toEqual([PAGE_SIZE, PAGE_SIZE * 2 - 1]);
    expect(result.current.results).toHaveLength(PAGE_SIZE + 4);
    expect(result.current.hasMore).toBe(false);
  });

  it("does not page past a search that never ran", async () => {
    const { result } = await renderHookWithProviders(() => useProfileSearch(), {
      store: storeAsUser(),
    });

    await act(async () => {
      await result.current.loadNext();
    });

    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe("useProfileSearch / failures", () => {
  it("shows a Hungarian message rather than the raw PostgREST error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    __setTableRows("profiles", {
      data: null,
      error: { message: "column profiles.nope does not exist" },
    });
    const { result } = await renderHookWithProviders(() => useProfileSearch(), {
      store: storeAsUser(),
    });

    await act(async () => {
      await result.current.search("Pista");
    });

    expect(result.current.error).toBe(PROFILE_SEARCH_ERROR);
    expect(result.current.results).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });
});
