/**
 * Autocomplete over the shared tag dictionary.
 *
 * The point of the dictionary is that one concept stops living on as a dozen typos, so
 * what matters here is that the suggestions are debounced (not one request per
 * keystroke), that a tag already on the chip row is never offered again, and that a slow
 * response for an old prefix can't overwrite a newer one.
 */
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));

import { act, waitFor } from "@testing-library/react-native";

import { useTagSuggestions } from "@/hooks/useTagSuggestions";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import { renderHookWithProviders } from "@/test-utils/renderWithProviders";

const suggestions = (...names: string[]) => ({
  data: names.map((name, i) => ({ name, usage_count: 10 - i })),
  error: null,
});

beforeEach(() => {
  __resetSupabase();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

/** Lets the 200ms debounce elapse and the resulting promise settle. */
const flushDebounce = async () => {
  await act(async () => {
    jest.advanceTimersByTime(250);
  });
};

describe("useTagSuggestions", () => {
  it("asks the dictionary for the typed prefix, ranked by usage", async () => {
    supabase.rpc.mockResolvedValue(suggestions("kertészet", "kerítés"));

    const { result } = await renderHookWithProviders(() =>
      useTagSuggestions("kert"),
    );
    await flushDebounce();

    expect(supabase.rpc).toHaveBeenCalledWith("search_tags", {
      p_prefix: "kert",
      p_limit: 8,
    });
    await waitFor(() =>
      expect(result.current.map((s) => s.name)).toEqual(["kertészet", "kerítés"]),
    );
  });

  it("does not query at all while the field is empty", async () => {
    await renderHookWithProviders(() => useTagSuggestions("   "));
    await flushDebounce();

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("does not query when suggesting is switched off", async () => {
    await renderHookWithProviders(() => useTagSuggestions("kert", false));
    await flushDebounce();

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("leaves out tags the user has already picked", async () => {
    supabase.rpc.mockResolvedValue(suggestions("kertészet", "kerítés"));

    const { result } = await renderHookWithProviders(() =>
      // Case differs on purpose: TagInput would reject it as a duplicate either way.
      useTagSuggestions("kert", true, ["Kertészet"]),
    );
    await flushDebounce();

    await waitFor(() =>
      expect(result.current.map((s) => s.name)).toEqual(["kerítés"]),
    );
  });

  it("waits for a pause in typing before asking anything", async () => {
    supabase.rpc.mockResolvedValue(suggestions("kertészet"));

    await renderHookWithProviders(() => useTagSuggestions("ker"));

    // Still inside the debounce window: a request here would mean one round trip per
    // keystroke, which is what the delay exists to prevent.
    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    expect(supabase.rpc).not.toHaveBeenCalled();

    await flushDebounce();
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  it("asks for nothing when the field is torn down mid-debounce", async () => {
    supabase.rpc.mockResolvedValue(suggestions("kertészet"));

    const { unmount } = await renderHookWithProviders(() =>
      useTagSuggestions("ker"),
    );
    await act(async () => {
      unmount();
    });
    await flushDebounce();

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("falls back to no suggestions when the dictionary cannot be reached", async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { message: "offline" } });

    const { result } = await renderHookWithProviders(() =>
      useTagSuggestions("kert"),
    );
    await flushDebounce();

    // The user can still type the tag by hand; an error must not surface here.
    expect(result.current).toEqual([]);
  });
});
