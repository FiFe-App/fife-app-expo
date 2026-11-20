import {
  addPreviousSearch,
  removeFromPreviousSearches,
} from "@/redux/reducers/userReducer";
import { SearchMode } from "@/redux/store.type";
import { createTestStore, TestStore } from "@/test-utils/renderWithProviders";

const seed = (store: TestStore, query: string, mode: SearchMode) => {
  store.dispatch(addPreviousSearch({ query, mode }));
  return store;
};

const history = (store: TestStore) => ({
  biznisz: store.getState().user.previousSearches,
  fife: store.getState().user.previousProfileSearches,
});

describe("addPreviousSearch / removeFromPreviousSearches", () => {
  it("keeps each mode's list separate", () => {
    const store = createTestStore();
    seed(store, "kerítés", "biznisz");
    seed(store, "Pista", "fife");

    expect(history(store)).toEqual({ biznisz: ["kerítés"], fife: ["Pista"] });
  });

  it("moves a repeated query back to the front instead of duplicating it", () => {
    const store = createTestStore();
    ["a", "b", "a"].forEach((q) => seed(store, q, "fife"));

    expect(history(store).fife).toEqual(["a", "b"]);
  });

  it("caps each list at ten entries independently", () => {
    const store = createTestStore();
    for (let i = 0; i < 12; i++) {
      seed(store, `b${i}`, "biznisz");
      seed(store, `f${i}`, "fife");
    }

    expect(history(store).biznisz).toHaveLength(10);
    expect(history(store).fife).toHaveLength(10);
    expect(history(store).fife?.[0]).toBe("f11");
  });

  it("ignores a blank query in either mode", () => {
    const store = createTestStore();
    seed(store, "   ", "fife");
    seed(store, "", "biznisz");

    expect(history(store)).toEqual({ biznisz: [], fife: [] });
  });

  it("removes from the named mode only", () => {
    const store = createTestStore();
    seed(store, "Pista", "biznisz");
    seed(store, "Pista", "fife");

    store.dispatch(removeFromPreviousSearches({ query: "Pista", mode: "fife" }));

    expect(history(store)).toEqual({ biznisz: ["Pista"], fife: [] });
  });
});

