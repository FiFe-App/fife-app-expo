import { fireEvent, screen } from "@testing-library/react-native";

import RequestComposerPrompt from "@/components/requests/RequestComposerPrompt";
import { login } from "@/redux/reducers/userReducer";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));

describe("RequestComposerPrompt", () => {
  it("opens the new-request modal when tapped", async () => {
    const store = createTestStore();
    store.dispatch(login("me-uid"));
    await renderWithProviders(<RequestComposerPrompt />, { store });

    await fireEvent.press(screen.getByTestId("request-composer-prompt"));

    expect(store.getState().requests.composer).toEqual({ open: true, initialTitle: "" });
  });

  it("is not shown to a signed-out visitor", async () => {
    await renderWithProviders(<RequestComposerPrompt />, { store: createTestStore() });

    expect(screen.queryByTestId("request-composer-prompt")).toBeNull();
  });
});
