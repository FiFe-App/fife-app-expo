/**
 * The biznisz editor's unsaved contents.
 *
 * A form that lives only in a component's state is gone the moment the OS
 * reclaims the app — which on Android is what "switching to the camera for a
 * minute" often means. The draft is what survives that.
 */
import { act, waitFor } from "@testing-library/react-native";

import {
  draftKeyFor,
  draftMatches,
  isDraftWorthKeeping,
  useBuzinessDraft,
  type BuzinessDraftValues,
} from "@/hooks/useBuzinessDraft";
import { setBuzinessDraft } from "@/redux/reducers/appReducer";
import {
  createTestStore,
  renderHookWithProviders,
} from "@/test-utils/renderWithProviders";

const EMPTY: BuzinessDraftValues = {
  title: "",
  description: "",
  categories: [],
  ingyen: false,
  isPublic: false,
  circle: null,
  defaultContact: null,
};

const TYPED: BuzinessDraftValues = {
  ...EMPTY,
  title: "Kerékpárszerviz",
  description: "Bármit megjavítok.",
  categories: ["bicikli"],
};

describe("draftKeyFor", () => {
  it("keeps an unfinished new biznisz apart from an edited one", () => {
    expect(draftKeyFor(undefined)).toBe("new");
    expect(draftKeyFor(12)).toBe("12");
  });
});

describe("isDraftWorthKeeping", () => {
  it("ignores a form nobody has touched", () => {
    expect(isDraftWorthKeeping(EMPTY)).toBe(false);
  });

  it("keeps anything the user actually put in", () => {
    expect(isDraftWorthKeeping(TYPED)).toBe(true);
    expect(isDraftWorthKeeping({ ...EMPTY, ingyen: true })).toBe(true);
    expect(isDraftWorthKeeping({ ...EMPTY, defaultContact: 5 })).toBe(true);
  });
});

describe("draftMatches", () => {
  it("sees a draft that only repeats what is already saved", () => {
    expect(draftMatches(TYPED, { ...TYPED })).toBe(true);
    expect(draftMatches(TYPED, { ...TYPED, title: " Kerékpárszerviz " })).toBe(true);
  });

  it("sees a real unsaved change", () => {
    expect(draftMatches(TYPED, { ...TYPED, description: "Más." })).toBe(false);
    expect(draftMatches(TYPED, { ...TYPED, categories: ["bicikli", "javítás"] })).toBe(false);
    expect(draftMatches(TYPED, { ...TYPED, isPublic: true })).toBe(false);
  });

  it("treats a map pin moved by less than a metre as the same place", () => {
    const here = { location: { latitude: 47.4979, longitude: 19.0402 }, radius: 20 };
    const same = { location: { latitude: 47.49790001, longitude: 19.0402 }, radius: 20 };
    const moved = { location: { latitude: 47.52, longitude: 19.0402 }, radius: 20 };

    expect(draftMatches({ ...EMPTY, circle: here }, { ...EMPTY, circle: same })).toBe(true);
    expect(draftMatches({ ...EMPTY, circle: here }, { ...EMPTY, circle: moved })).toBe(false);
    expect(draftMatches({ ...EMPTY, circle: here }, EMPTY)).toBe(false);
  });
});

describe("useBuzinessDraft", () => {
  /** The stored draft for a key, once the hook's debounce has run. */
  const storedDraft = (store: ReturnType<typeof createTestStore>, key: string) =>
    store.getState().app.buzinessDrafts[key];

  it("keeps what was typed, a moment after the typing stops", async () => {
    const store = createTestStore();

    const { result } = await renderHookWithProviders(() => useBuzinessDraft(), {
      store,
    });

    await act(async () => result.current.saveDraft(TYPED));
    // Not on every keystroke: the whole store goes to disk on each write.
    expect(storedDraft(store, "new")).toBeUndefined();

    await waitFor(() =>
      expect(storedDraft(store, "new")).toMatchObject({
        title: "Kerékpárszerviz",
        categories: ["bicikli"],
      }),
    );
  });

  it("writes once for a burst of keystrokes", async () => {
    const store = createTestStore();
    const { result } = await renderHookWithProviders(() => useBuzinessDraft(12), {
      store,
    });

    await act(async () => {
      result.current.saveDraft({ ...TYPED, title: "K" });
      result.current.saveDraft({ ...TYPED, title: "Ke" });
      result.current.saveDraft({ ...TYPED, title: "Ker" });
    });

    await waitFor(() => expect(storedDraft(store, "12")?.title).toBe("Ker"));
  });

  it("throws the draft away when the form is emptied again", async () => {
    const store = createTestStore();
    store.dispatch(
      setBuzinessDraft({
        key: "new",
        draft: { ...TYPED, savedAt: new Date().toISOString() },
      }),
    );

    const { result } = await renderHookWithProviders(() => useBuzinessDraft(), {
      store,
    });

    await act(async () => result.current.saveDraft(EMPTY));

    await waitFor(() => expect(storedDraft(store, "new")).toBeUndefined());
  });

  it("hands back the draft as it was when the screen opened", async () => {
    const store = createTestStore();
    store.dispatch(
      setBuzinessDraft({
        key: "7",
        draft: { ...TYPED, savedAt: new Date().toISOString() },
      }),
    );

    const { result } = await renderHookWithProviders(() => useBuzinessDraft(7), {
      store,
    });

    expect(result.current.pendingDraft).toMatchObject({ title: "Kerékpárszerviz" });

    // Its own later writes must not change what the screen restores from, or
    // the restore would chase the user's typing.
    await act(async () => result.current.saveDraft({ ...TYPED, title: "Más" }));
    await waitFor(() => expect(storedDraft(store, "7")?.title).toBe("Más"));

    expect(result.current.pendingDraft).toMatchObject({ title: "Kerékpárszerviz" });
  });

  it("forgets the draft when asked, pending write and all", async () => {
    const store = createTestStore();
    const { result } = await renderHookWithProviders(() => useBuzinessDraft(), {
      store,
    });

    await act(async () => {
      result.current.saveDraft(TYPED);
      result.current.clearDraft();
    });

    // Long enough that a debounced write would have landed by now.
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(storedDraft(store, "new")).toBeUndefined();
  });

  it("writes what is pending when the screen is left", async () => {
    const store = createTestStore();
    const { result, unmount } = await renderHookWithProviders(
      () => useBuzinessDraft(),
      { store },
    );

    await act(async () => result.current.saveDraft(TYPED));
    await act(async () => unmount());

    expect(storedDraft(store, "new")).toMatchObject({
      title: "Kerékpárszerviz",
    });
  });
});
