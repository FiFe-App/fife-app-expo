import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import RequestsForYou from "@/components/requests/RequestsForYou";
import { login } from "@/redux/reducers/userReducer";
import { storeRequestSearchText } from "@/redux/reducers/requestsReducer";
import { __resetRouter, router } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import { makeRequest } from "@/test-utils/fixtures/requests";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));

const signedIn = () => {
  const store = createTestStore();
  store.dispatch(login("me-uid"));
  return store;
};

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
});

describe("RequestsForYou (community screen strip)", () => {
  it("loads the for_me slice and lists the requests", async () => {
    supabase.rpc.mockResolvedValue({
      data: [makeRequest({ id: 1, title: "Kertészt keresek" }), makeRequest({ id: 2, title: "Fúrógép kell" })],
      error: null,
    });
    await renderWithProviders(<RequestsForYou />, { store: signedIn() });

    await waitFor(() => expect(screen.getByText("Kertészt keresek")).toBeTruthy());
    expect(screen.getByText("Fúrógép kell")).toBeTruthy();
    expect(supabase.rpc).toHaveBeenCalledWith(
      "requests_feed",
      expect.objectContaining({ p_scope: "for_me", p_take: 6 }),
    );
  });

  it("invites the user to ask when there is nothing nearby", async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    await renderWithProviders(<RequestsForYou />, { store: signedIn() });

    await waitFor(() => expect(screen.getByText("Nincs kérés a környékeden.")).toBeTruthy());
    await fireEvent.press(screen.getByText("Kérj te valamit"));

    expect(router.push).toHaveBeenCalledWith("/kerelmek/new");
  });

  it("opens the full list from Mind, without a leftover search", async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const store = signedIn();
    store.dispatch(storeRequestSearchText("régi keresés"));
    await renderWithProviders(<RequestsForYou />, { store });

    await fireEvent.press(screen.getByTestId("requests-all"));

    expect(router.push).toHaveBeenCalledWith("/kerelmek");
    expect(store.getState().requests.searchText).toBe("");
  });

  it("shows the error and not the empty state when the load fails", async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await renderWithProviders(<RequestsForYou />, { store: signedIn() });

    await waitFor(() =>
      expect(screen.getByText("Sajnos hiba történt, próbáld meg később")).toBeTruthy(),
    );
    expect(screen.queryByText("Nincs kérés a környékeden.")).toBeNull();
  });

  it("renders nothing for a signed-out visitor", async () => {
    await renderWithProviders(<RequestsForYou />, { store: createTestStore() });

    expect(screen.queryByTestId("requests-for-you")).toBeNull();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
