import { screen } from "@testing-library/react-native";

import { UsersList } from "@/components/user/UsersList";
import { NO_NEARBY_USERS, NO_NEARBY_USERS_HINT } from "@/hooks/useFifeSearch";
import {
  NO_PROFILE_RESULTS,
  NO_PROFILE_RESULTS_HINT,
} from "@/hooks/useProfileSearch";
import { __resetSupabase } from "@/test-utils/mocks/supabase";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));

beforeEach(() => {
  __resetSupabase();
});

describe("UsersList empty state", () => {
  it("keeps the proximity wording by default", async () => {
    await renderWithProviders(
      <UsersList load={jest.fn()} data={[]} error={null} canLoadMore={false} />,
    );

    expect(screen.getByText(NO_NEARBY_USERS)).toBeTruthy();
    expect(screen.getByText(NO_NEARBY_USERS_HINT)).toBeTruthy();
  });

  it("uses the search wording when the caller supplies it", async () => {
    // "Nincs még FiFe a környékeden" would be wrong for a name search.
    await renderWithProviders(
      <UsersList
        load={jest.fn()}
        data={[]}
        error={null}
        canLoadMore={false}
        emptyTitle={NO_PROFILE_RESULTS}
        emptyHint={NO_PROFILE_RESULTS_HINT}
      />,
    );

    expect(screen.getByText(NO_PROFILE_RESULTS)).toBeTruthy();
    expect(screen.queryByText(NO_NEARBY_USERS)).toBeNull();
  });
});
