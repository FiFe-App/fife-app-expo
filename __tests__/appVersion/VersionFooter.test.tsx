import AsyncStorage from "@react-native-async-storage/async-storage";
import { screen, waitFor } from "@testing-library/react-native";

import VersionFooter from "@/components/version/VersionFooter";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.1" } },
}));

const row = (status: string, latest = "1.2.0") => ({
  data: [
    {
      status,
      min_version: "1.1.0",
      latest_version: latest,
      update_url: "https://play.google.com/store/apps/details?id=com.fife.app",
      message: null,
    },
  ],
  error: null,
});

beforeEach(async () => {
  __resetSupabase();
  await AsyncStorage.clear();
});

describe("VersionFooter", () => {
  it("always names the version this build is running", async () => {
    supabase.rpc.mockResolvedValue(row("ok"));

    await renderWithProviders(<VersionFooter />);

    expect(screen.getByText("FiFe App 1.0.1")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("Naprakész vagy")).toBeTruthy());
  });

  it("points at the newer release when there is one", async () => {
    supabase.rpc.mockResolvedValue(row("update_available"));

    await renderWithProviders(<VersionFooter />);

    await waitFor(() => expect(screen.getByText("Új verzió elérhető: 1.2.0")).toBeTruthy());
    expect(screen.getByText("Frissítés")).toBeTruthy();
  });

  it("offers a re-check when the server says nothing useful", async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { message: "offline" } });

    await renderWithProviders(<VersionFooter />);

    expect(screen.getByText("FiFe App 1.0.1")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("Frissítések keresése")).toBeTruthy());
  });
});
