import { screen, waitFor } from "@testing-library/react-native";

import Home from "@/app/home";
import { login } from "@/redux/reducers/userReducer";
import { __resetRouter } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import { makeRequest } from "@/test-utils/fixtures/requests";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));
jest.mock("@/components/InviteCard", () => () => null);

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
});

describe("Környék (home)", () => {
  it("shows the FiFe Radar with the requests for you under it, and no bizniszek", async () => {
    supabase.rpc.mockImplementation((fn?: string) =>
      Promise.resolve({
        data: fn === "requests_feed" ? [makeRequest({ title: "Kertészt keresek" })] : [],
        error: null,
      }),
    );
    const store = createTestStore();
    store.dispatch(login("me-uid"));
    await renderWithProviders(<Home />, { store });

    await waitFor(() => expect(screen.getByText("Kertészt keresek")).toBeTruthy());
    expect(screen.getByText("FiFe Radar")).toBeTruthy();
    expect(screen.getByText("Kérések neked")).toBeTruthy();
    expect(screen.queryByText(/Bizniszek neked/)).toBeNull();
    expect(supabase.functions.invoke).not.toHaveBeenCalledWith(
      "business-search",
      expect.anything(),
    );

    // The radar comes first, the requests under it.
    const text = JSON.stringify(screen.toJSON());
    expect(text.indexOf("FiFe Radar")).toBeLessThan(text.indexOf("Kérések neked"));
  });
});
