import { act } from "@testing-library/react-native";

import { useRequests } from "@/hooks/useRequests";
import { setLocation } from "@/redux/reducers/userReducer";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import {
  createTestStore,
  renderHookWithProviders,
} from "@/test-utils/renderWithProviders";

import { makeRequest } from "@/test-utils/fixtures/requests";

jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));

const page = (from: number, n: number) =>
  Array.from({ length: n }, (_, i) => makeRequest({ id: from + i, title: `Kérés ${from + i}` }));

const lastArgs = () => supabase.rpc.mock.calls.at(-1)?.[1];

beforeEach(() => {
  __resetSupabase();
});

describe("useRequests", () => {
  it("asks the requests_feed RPC for the scope, the text and my position", async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const store = createTestStore();
    store.dispatch(setLocation({ latitude: 47.5, longitude: 19.05, radius: 500 }));
    const { result } = await renderHookWithProviders(() => useRequests(5), { store });

    await act(async () => {
      await result.current.load("for_me", "  kert ");
    });

    expect(supabase.rpc).toHaveBeenCalledWith("requests_feed", {
      p_scope: "for_me",
      p_query: "kert",
      p_lat: 47.5,
      p_long: 19.05,
      p_skip: 0,
      p_take: 5,
    });
    expect(result.current.fetched).toBe(true);
    expect(result.current.hasMore).toBe(false);
  });

  it("falls back to Budapest when no location is known", async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const { result } = await renderHookWithProviders(() => useRequests(5));

    await act(async () => {
      await result.current.load("all");
    });

    expect(lastArgs()).toMatchObject({ p_lat: 47.4979, p_long: 19.0402, p_query: undefined });
  });

  it("pages on, skipping what it already has, and does not repeat a row", async () => {
    supabase.rpc
      .mockResolvedValueOnce({ data: page(1, 3), error: null })
      .mockResolvedValueOnce({ data: [...page(3, 1), ...page(4, 1)], error: null });
    const { result } = await renderHookWithProviders(() => useRequests(3));

    await act(async () => {
      await result.current.load("all");
    });
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(lastArgs()).toMatchObject({ p_skip: 3 });
    // Row 3 came back on page two as well (a new request shifted the offset).
    expect(result.current.data.map((r) => r.id)).toEqual([1, 2, 3, 4]);
    expect(result.current.hasMore).toBe(false);
  });

  it("starts over when the filter changes", async () => {
    supabase.rpc
      .mockResolvedValueOnce({ data: page(1, 3), error: null })
      .mockResolvedValueOnce({ data: page(10, 1), error: null });
    const { result } = await renderHookWithProviders(() => useRequests(3));

    await act(async () => {
      await result.current.load("all");
    });
    await act(async () => {
      await result.current.load("solved");
    });

    expect(lastArgs()).toMatchObject({ p_scope: "solved", p_skip: 0 });
    expect(result.current.data.map((r) => r.id)).toEqual([10]);
  });

  it("shows a friendly error and an empty list when the RPC fails", async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { result } = await renderHookWithProviders(() => useRequests(3));

    await act(async () => {
      await result.current.load("all");
    });

    expect(result.current.error).toBe("Sajnos hiba történt, próbáld meg később");
    expect(result.current.data).toEqual([]);
  });

  it("can drop and patch a row locally", async () => {
    supabase.rpc.mockResolvedValue({ data: page(1, 2), error: null });
    const { result } = await renderHookWithProviders(() => useRequests(5));

    await act(async () => {
      await result.current.load("mine");
    });
    await act(async () => result.current.patch(1, { status: "solved" }));
    expect(result.current.data[0].status).toBe("solved");

    await act(async () => result.current.remove(1));
    expect(result.current.data.map((r) => r.id)).toEqual([2]);
  });
});
