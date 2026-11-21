import { searchTitle } from "@/lib/search/title";

describe("searchTitle", () => {
  it("names the default search of each category", () => {
    expect(searchTitle({ mode: "biznisz" }).title).toBe("Új bizniszek");
    expect(searchTitle({ mode: "fife" }).title).toBe("FiFe Radar");
    expect(searchTitle({ mode: "kerelem", scope: "for_me" }).title).toBe("Kérések neked");
    expect(searchTitle({ mode: "kerelem", scope: "all" }).title).toBe("Új kérések");
    expect(searchTitle({ mode: "kerelem", scope: "mine" }).title).toBe("Saját kérések");
    expect(searchTitle({ mode: "kerelem", scope: "solved" }).title).toBe("Megoldott kérések");
  });

  it("says what is searched when there is a query", () => {
    expect(searchTitle({ mode: "biznisz", q: "kert" }).title).toBe("Találatok a bizniszek között: kert");
    expect(searchTitle({ mode: "fife", q: "Pista" }).title).toBe("Találatok a fifék között: Pista");
    expect(searchTitle({ mode: "kerelem", q: "fúrógép", scope: "all" }).title).toBe(
      "Találatok a kérések között: fúrógép",
    );
  });

  it("keeps what the filter narrowed apart from the title, as lines of its own", () => {
    expect(searchTitle({ mode: "biznisz", ingyen: true })).toEqual({
      title: "Új bizniszek",
      filters: ["ingyenes"],
    });
    expect(searchTitle({ mode: "biznisz", q: "kert", ingyen: true, hasCircle: true })).toEqual({
      title: "Találatok a bizniszek között: kert",
      filters: ["ingyenes", "kiválasztott helyen"],
    });
    expect(searchTitle({ mode: "fife", hasCircle: true })).toEqual({
      title: "FiFe Radar",
      filters: ["kiválasztott helyen"],
    });
    expect(searchTitle({ mode: "kerelem", q: "kert", scope: "mine" }).filters).toEqual(["saját"]);
  });

  it("has no filter lines when nothing was narrowed", () => {
    expect(searchTitle({ mode: "biznisz" }).filters).toEqual([]);
    expect(searchTitle({ mode: "kerelem", scope: "for_me" }).filters).toEqual([]);
  });

  it("ignores a blank query", () => {
    expect(searchTitle({ mode: "biznisz", q: "   " }).title).toBe("Új bizniszek");
  });
});
