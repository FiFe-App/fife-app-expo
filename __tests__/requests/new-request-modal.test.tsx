import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import NewRequestModal from "@/components/requests/NewRequestModal";
import { login } from "@/redux/reducers/userReducer";
import {
  closeRequestComposer,
  openRequestComposer,
} from "@/redux/reducers/requestsReducer";
import { __resetRouter, router } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));
// The map and the keyboard are native; the modal only needs them to exist.
jest.mock("@/components/KeyboardAwareModal", () => ({
  useKeyboardHeight: () => 0,
  KeyboardAwareModal: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("@/components/MapSelector/MapSelector", () => () => null);
jest.mock("@/components/mapView/FiFeMap", () => () => null);
jest.mock("@/components/mapView/mapView", () => ({ Marker: () => null }));

const signedIn = () => {
  const store = createTestStore();
  store.dispatch(login("me-uid"));
  return store;
};

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
});

/** create-request answers with the new id. */
const respondWithCreated = (id: number) =>
  supabase.functions.invoke.mockResolvedValue({ data: { id }, error: null });

describe("NewRequestModal", () => {
  it("is closed until something opens it", async () => {
    await renderWithProviders(<NewRequestModal />, { store: signedIn() });

    expect(screen.queryByTestId("request-title")).toBeNull();
  });

  it("opens with only the title input and the details folded", async () => {
    const store = signedIn();
    store.dispatch(openRequestComposer());
    await renderWithProviders(<NewRequestModal />, { store });

    expect(await screen.findByTestId("request-title")).toBeTruthy();
    expect(screen.getByText("További részletek")).toBeTruthy();
    expect(screen.queryByTestId("request-description")).toBeNull();
  });

  it("copies the searched text into the title", async () => {
    const store = signedIn();
    store.dispatch(openRequestComposer("  fúrógép kell "));
    await renderWithProviders(<NewRequestModal />, { store });

    expect((await screen.findByTestId("request-title")).props.value).toBe("fúrógép kell");
  });

  it("needs a title of at least 3 characters to submit", async () => {
    const store = signedIn();
    store.dispatch(openRequestComposer("ab"));
    await renderWithProviders(<NewRequestModal />, { store });

    const submit = await screen.findByTestId("request-submit");
    expect(submit.props.accessibilityState?.disabled).toBe(true);

    await fireEvent.changeText(screen.getByTestId("request-title"), "abc");
    await waitFor(() =>
      expect(screen.getByTestId("request-submit").props.accessibilityState?.disabled).toBe(false),
    );
  });

  it("creates the request through create-request from the title alone, closes and opens it", async () => {
    respondWithCreated(77);
    const store = signedIn();
    store.dispatch(openRequestComposer("Kertészt keresek"));
    await renderWithProviders(<NewRequestModal />, { store });

    await fireEvent.press(await screen.findByTestId("request-submit"));

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/kerelmek/[id]",
        params: { id: 77 },
      }),
    );
    expect(supabase.functions.invoke).toHaveBeenCalledWith("create-request", {
      body: {
        title: "Kertészt keresek",
        description: "",
        tags: [],
        location: null,
        radius: null,
      },
    });
    // The row is no longer inserted from the app.
    expect(supabase.from).not.toHaveBeenCalledWith("requests");
    expect(store.getState().requests.composer.open).toBe(false);
  });

  it("starts from a clean form every time it opens", async () => {
    const store = signedIn();
    store.dispatch(openRequestComposer("régi szöveg"));
    await renderWithProviders(<NewRequestModal />, { store });
    await screen.findByTestId("request-title");

    store.dispatch(closeRequestComposer());
    await waitFor(() => expect(screen.queryByTestId("request-title")).toBeNull());
    store.dispatch(openRequestComposer());

    expect((await screen.findByTestId("request-title")).props.value).toBe("");
  });

  it("renders nothing for a signed-out visitor", async () => {
    const store = createTestStore();
    store.dispatch(openRequestComposer("x"));
    await renderWithProviders(<NewRequestModal />, { store });

    expect(screen.queryByTestId("request-title")).toBeNull();
  });

  it("tells the user when the open-requests limit is reached", async () => {
    const { FunctionsHttpError } = jest.requireActual("@supabase/supabase-js");
    const message = "Egyszerre legfeljebb 10 nyitott kérésed lehet. Jelöld megoldottnak a régebbieket.";
    supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError({ json: () => Promise.resolve({ error: message }) }),
    });
    const store = signedIn();
    store.dispatch(openRequestComposer("Tizenegyedik"));
    await renderWithProviders(<NewRequestModal />, { store });

    await fireEvent.press(await screen.findByTestId("request-submit"));

    await waitFor(() => expect(store.getState().info.snacks?.[0]?.title).toBe(message));
    expect(router.push).not.toHaveBeenCalled();
    expect(store.getState().requests.composer.open).toBe(true);
  });
});
