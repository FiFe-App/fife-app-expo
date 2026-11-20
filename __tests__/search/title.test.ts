import { searchTitle } from "@/lib/search/title";

describe("searchTitle", () => {
  it("names the default search of each category", () => {
    expect(searchTitle({ mode: "biznisz" })).toBe("Új bizniszek");
    expect(searchTitle({ mode: "fife" })).toBe("FiFe Radar");
    expect(searchTitle({ mode: "kerelem", scope: "for_me" })).toBe("Kérések neked");
    expect(searchTitle({ mode: "kerelem", scope: "all" })).toBe("Új kérések");
    expect(searchTitle({ mode: "kerelem", scope: "mine" })).toBe("Saját kérések");
    expect(searchTitle({ mode: "kerelem", scope: "solved" })).toBe("Megoldott kérések");
  });

  it("says what is searched when there is a query", () => {
    expect(searchTitle({ mode: "biznisz", q: "kert" })).toBe("Találatok a bizniszek között: kert");
    expect(searchTitle({ mode: "fife", q: "Pista" })).toBe("Találatok a fifék között: Pista");
    expect(searchTitle({ mode: "kerelem", q: "fúrógép", scope: "all" })).toBe(
      "Találatok a kérések között: fúrógép",
    );
  });

  it("appends what the filter narrowed", () => {
    expect(searchTitle({ mode: "biznisz", ingyen: true })).toBe("Új bizniszek · ingyenes");
    expect(searchTitle({ mode: "biznisz", q: "kert", ingyen: true, hasCircle: true })).toBe(
      "Találatok a bizniszek között: kert · ingyenes, kiválasztott helyen",
    );
    expect(searchTitle({ mode: "fife", hasCircle: true })).toBe("FiFe Radar · kiválasztott helyen");
    expect(searchTitle({ mode: "kerelem", q: "kert", scope: "mine" })).toBe(
      "Találatok a kérések között: kert · saját",
    );
  });

  it("ignores a blank query", () => {
    expect(searchTitle({ mode: "biznisz", q: "   " })).toBe("Új bizniszek");
  });
});
