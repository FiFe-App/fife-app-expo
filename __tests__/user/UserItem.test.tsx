import { screen } from "@testing-library/react-native";

import UserItem from "@/components/user/UserItem";
import { NearestProfile } from "@/redux/store.type";
import { __resetSupabase } from "@/test-utils/mocks/supabase";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));

const profile = (overrides: Partial<NearestProfile> = {}): NearestProfile => ({
  id: "u1",
  full_name: "Kovács Anna",
  username: null,
  avatar_url: null,
  website: null,
  created_at: null,
  recommendations: 0,
  lat: 0,
  long: 0,
  distance: 0,
  buzinesses: [],
  ...overrides,
});

beforeEach(() => {
  __resetSupabase();
});

describe("UserItem", () => {
  it("shows the handle so a username match is obvious", async () => {
    await renderWithProviders(<UserItem data={profile({ username: "annak" })} />);

    expect(screen.getByText("Kovács Anna")).toBeTruthy();
    expect(screen.getByText("@annak")).toBeTruthy();
  });

  it("renders no handle line for a profile without a username", async () => {
    await renderWithProviders(<UserItem data={profile()} />);

    expect(screen.getByText("Kovács Anna")).toBeTruthy();
    expect(screen.queryByText(/^@/)).toBeNull();
  });
});
