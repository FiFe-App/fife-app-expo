import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { BackHandler } from "react-native";

import { lightTheme } from "@/assets/theme";

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

  it("opens with only the title input and the two accordions folded", async () => {
    const store = signedIn();
    store.dispatch(openRequestComposer());
    await renderWithProviders(<NewRequestModal />, { store });

    expect(await screen.findByTestId("request-title")).toBeTruthy();
    expect(screen.getByText("Targetálás")).toBeTruthy();
    expect(screen.getByText("További infók")).toBeTruthy();
    expect(screen.queryByTestId("request-description")).toBeNull();
    expect(screen.queryByText("Kulcsszavak")).toBeNull();
  });

  it("has the keywords and the place under Targetálás, the text and pictures under További infók", async () => {
    const store = signedIn();
    store.dispatch(openRequestComposer());
    await renderWithProviders(<NewRequestModal />, { store });

    await fireEvent.press(await screen.findByText("Targetálás"));
    expect(await screen.findByText("Kulcsszavak")).toBeTruthy();
    expect(screen.getByText("Hol kell a segítség?")).toBeTruthy();
    expect(screen.queryByTestId("request-description")).toBeNull();

    await fireEvent.press(screen.getByText("További infók"));
    expect(await screen.findByTestId("request-description")).toBeTruthy();
    expect(screen.getByText("Képek")).toBeTruthy();
  });

  it("makes every text field multiline", async () => {
    const store = signedIn();
    store.dispatch(openRequestComposer());
    await renderWithProviders(<NewRequestModal />, { store });

    expect(screen.getByTestId("request-title").props.multiline).toBe(true);
    await fireEvent.press(screen.getByText("További infók"));
    expect((await screen.findByTestId("request-description")).props.multiline).toBe(true);
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

  it("has no radius: the place is a point, nothing asks how far", async () => {
    const store = signedIn();
    store.dispatch(openRequestComposer());
    await renderWithProviders(<NewRequestModal />, { store });

    await fireEvent.press(await screen.findByText("Targetálás"));
    await fireEvent.press(await screen.findByText("Térképen"));

    expect(screen.queryByText(/körzetből/)).toBeNull();
    expect(screen.queryByText("5 km")).toBeNull();
  });

  /** The system Back button, as far as the app can tell: the listeners it registered, newest first. */
  const fakeBackButton = () => {
    const listeners: (() => boolean)[] = [];
    jest.spyOn(BackHandler, "addEventListener").mockImplementation((_event, handler) => {
      listeners.push(handler as () => boolean);
      return { remove: () => listeners.splice(listeners.indexOf(handler as () => boolean), 1) };
    });
    return {
      listeners,
      press: () => {
        for (const handler of [...listeners].reverse()) if (handler()) return true;
        return false;
      },
    };
  };

  it("is closed by the Back button, not by leaving the screen under it", async () => {
    const back = fakeBackButton();
    const store = signedIn();
    store.dispatch(openRequestComposer("Kertészt keresek"));
    await renderWithProviders(<NewRequestModal />, { store });
    await screen.findByTestId("request-title");

    let handled = false;
    await act(async () => {
      handled = back.press();
    });

    // The press was taken: the screen under the modal is not asked to go back.
    expect(handled).toBe(true);
    expect(store.getState().requests.composer.open).toBe(false);
    await waitFor(() => expect(screen.queryByTestId("request-title")).toBeNull());
  });

  it("leaves Back to the screen once the modal is closed", async () => {
    const back = fakeBackButton();
    const store = signedIn();
    await renderWithProviders(<NewRequestModal />, { store });

    // Never opened, or closed again: the modal listens to nothing.
    expect(back.press()).toBe(false);
    store.dispatch(openRequestComposer());
    await screen.findByTestId("request-title");
    await act(async () => {
      store.dispatch(closeRequestComposer());
    });
    expect(back.press()).toBe(false);
  });
});

describe("NewRequestModal: the height of the title", () => {
  const LINE = lightTheme.fonts.bodyLarge.lineHeight ?? 24;
  const heightOf = () =>
    (screen.getByTestId("request-title").props.style as { height: number }[] | { height: number })
      ? (flatten(screen.getByTestId("request-title").props.style) as { height: number }).height
      : 0;
  const flatten = (style: unknown): unknown =>
    Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : (style ?? {});
  const layoutMirror = async (height: number) => {
    await act(async () => {
      fireEvent(screen.getByTestId("request-title-mirror", { includeHiddenElements: true }), "layout", {
        nativeEvent: { layout: { height, width: 300, x: 0, y: 0 } },
      });
    });
  };

  const open = async () => {
    const store = signedIn();
    store.dispatch(openRequestComposer("Kertészt keresek"));
    await renderWithProviders(<NewRequestModal />, { store });
    await screen.findByTestId("request-title");
  };

  it("is one line to begin with", async () => {
    await open();

    expect(heightOf()).toBe(LINE + 16);
    expect(screen.getByTestId("request-title").props.multiline).toBe(true);
  });

  it("grows to show the whole title", async () => {
    await open();

    await layoutMirror(LINE * 3);

    expect(heightOf()).toBe(LINE * 3 + 16);
  });

  it("stops at seven lines, and scrolls from there", async () => {
    await open();

    await layoutMirror(LINE * 7);
    expect(heightOf()).toBe(LINE * 7 + 16);
    expect(screen.getByTestId("request-title").props.scrollEnabled).toBe(false);

    await layoutMirror(LINE * 10);
    expect(heightOf()).toBe(LINE * 7 + 16);
    expect(screen.getByTestId("request-title").props.scrollEnabled).toBe(true);
  });
});
