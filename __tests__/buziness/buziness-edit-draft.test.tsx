/**
 * The biznisz editor, reopened after the app was killed.
 *
 * The screen reads the row it is editing from the server *and* the draft the
 * user left behind, and the order matters: the stored row must not overwrite
 * unsaved typing, and a draft that only repeats the row must not be announced
 * as if something had been rescued.
 */
import { waitFor } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/components/MapSelector/MapSelector", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});
jest.mock("@/components/mapView/FiFeMap", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});
jest.mock("@/components/mapView/mapView", () => {
  const { View } = require("react-native");
  return { __esModule: true, Marker: View };
});
jest.mock("@/components/buziness/BuzinessMediaUpload", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});
jest.mock("@/components/buziness/ContactEditScreen", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});
jest.mock("@/hooks/useMyLocation", () => ({
  useMyLocation: () => ({ myLocation: null }),
}));
jest.mock("@/hooks/useNotificationPrefs", () => ({
  DEFAULT_NOTIFICATION_PREFS: {},
  useNotificationPrefs: () => ({
    prefs: { aiEnhance: false },
    hydrated: true,
    setPref: jest.fn(),
  }),
}));

import BuzinessEditScreen from "@/components/buziness/BuzinessEditScreen";
import { setBuzinessDraft } from "@/redux/reducers/appReducer";
import { login } from "@/redux/reducers/userReducer";
import { __resetRouter } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, __setTableRows } from "@/test-utils/mocks/supabase";
import { inputByLabel } from "@/test-utils/paper";
import {
  createTestStore,
  renderWithProviders,
} from "@/test-utils/renderWithProviders";

const ME = "me";

const storeWithDraft = (key: string, draft: Record<string, unknown>) => {
  const store = createTestStore();
  store.dispatch(login(ME));
  store.dispatch(
    setBuzinessDraft({
      key,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draft: { savedAt: new Date().toISOString(), ...(draft as any) },
    }),
  );
  return store;
};

const EMPTY_DRAFT = {
  title: "",
  description: "",
  categories: [],
  ingyen: false,
  isPublic: false,
  circle: null,
  defaultContact: null,
};

const SAVED_ROW = {
  id: 12,
  author: ME,
  title: "Kerékpárszerviz $ bicikli",
  description: "Bármit megjavítok.",
  ingyen: false,
  public: false,
  defaultContact: null,
  images: null,
  location: null,
  radius: null,
};

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
  // The editor asks for the row it edits and for the author's contacts; both
  // come back from the same table double.
  __setTableRows("buziness", { data: [SAVED_ROW], error: null });
  __setTableRows("contacts", { data: [], error: null });
});

describe("biznisz editor / a new one", () => {
  it("puts back what was typed before the app was killed", async () => {
    const store = storeWithDraft("new", {
      ...EMPTY_DRAFT,
      title: "Süteménysütés",
      description: "Bármilyen alkalomra.",
      categories: ["süti"],
    });

    await renderWithProviders(<BuzinessEditScreen />, { store });

    await waitFor(() =>
      expect(inputByLabel("Biznisz neve *").props.value).toBe("Süteménysütés"),
    );
    expect(inputByLabel("Leírás *").props.value).toBe("Bármilyen alkalomra.");
  });

  it("says so, with a way to throw it away", async () => {
    const store = storeWithDraft("new", { ...EMPTY_DRAFT, title: "Süteménysütés" });

    await renderWithProviders(<BuzinessEditScreen />, { store });

    await waitFor(() => expect(store.getState().info.snacks).toHaveLength(1));
    expect(store.getState().info.snacks[0].title).toContain("Folytathatod");
    expect(store.getState().info.snacks[0].buttonText).toBe("Elvetem");
  });

  it("opens empty, and quietly, when there is no draft", async () => {
    const store = createTestStore();
    store.dispatch(login(ME));

    await renderWithProviders(<BuzinessEditScreen />, { store });

    expect(inputByLabel("Biznisz neve *").props.value).toBe("");
    expect(store.getState().info.snacks).toHaveLength(0);
  });
});

describe("biznisz editor / editing an existing one", () => {
  it("shows the stored biznisz when nothing was left unsaved", async () => {
    const store = createTestStore();
    store.dispatch(login(ME));

    await renderWithProviders(<BuzinessEditScreen editId={12} />, { store });

    await waitFor(() =>
      expect(inputByLabel("Biznisz neve *").props.value).toBe("Kerékpárszerviz"),
    );
    expect(store.getState().info.snacks).toHaveLength(0);
  });

  it("keeps the unsaved change on top of the stored biznisz", async () => {
    // The regression this guards: the server load used to be the only writer,
    // so whatever the user had typed was replaced by the saved row.
    const store = storeWithDraft("12", {
      ...EMPTY_DRAFT,
      title: "Kerékpárszerviz",
      description: "Új leírás, még nem mentve.",
      categories: ["bicikli"],
    });

    await renderWithProviders(<BuzinessEditScreen editId={12} />, { store });

    await waitFor(() =>
      expect(inputByLabel("Leírás *").props.value).toBe(
        "Új leírás, még nem mentve.",
      ),
    );
    expect(store.getState().info.snacks[0].title).toContain("Folytathatod");
  });

  it("stays quiet about a draft that only repeats what is saved", async () => {
    const store = storeWithDraft("12", {
      ...EMPTY_DRAFT,
      title: "Kerékpárszerviz",
      description: "Bármit megjavítok.",
      categories: ["bicikli"],
    });

    await renderWithProviders(<BuzinessEditScreen editId={12} />, { store });

    await waitFor(() =>
      expect(inputByLabel("Biznisz neve *").props.value).toBe("Kerékpárszerviz"),
    );
    expect(store.getState().info.snacks).toHaveLength(0);
    // And it is dropped, so it cannot be announced on the next visit either.
    await waitFor(() =>
      expect(store.getState().app.buzinessDrafts["12"]).toBeUndefined(),
    );
  });
});
