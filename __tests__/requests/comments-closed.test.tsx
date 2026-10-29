import { screen } from "@testing-library/react-native";

import Comments from "@/components/comments/Comments";
import { login } from "@/redux/reducers/userReducer";
import { __resetSupabase } from "@/test-utils/mocks/supabase";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));

beforeEach(() => __resetSupabase());

const store = () => {
  const s = createTestStore();
  s.dispatch(login("me-uid"));
  return s;
};

describe("Comments closed", () => {
  it("replaces the input with the explanation", async () => {
    await renderWithProviders(
      <Comments path="request/1" placeholder="Írj" closed closedText="Megoldódott." />,
      { store: store() },
    );

    expect(screen.getByTestId("comments-closed")).toBeTruthy();
    expect(screen.getByText("Megoldódott.")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Írj")).toBeNull();
  });

  it("keeps the input when open", async () => {
    await renderWithProviders(<Comments path="request/1" placeholder="Írj" />, { store: store() });

    expect(screen.queryByTestId("comments-closed")).toBeNull();
  });
});
