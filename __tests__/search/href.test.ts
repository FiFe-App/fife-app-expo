import { searchHref } from "@/lib/search/href";

describe("searchHref", () => {
  it("is a /search route with the mode, the query and the slice in its params", () => {
    expect(searchHref("biznisz")).toEqual({ pathname: "/search", params: { mode: "biznisz" } });
    expect(searchHref("kerelem", { q: " kert ", scope: "all" })).toEqual({
      pathname: "/search",
      params: { mode: "kerelem", q: "kert", scope: "all" },
    });
  });

  it("drops an empty query, a slice outside the kérések, and asks for focus only when told to", () => {
    expect(searchHref("fife", { q: "  ", scope: "all" })).toEqual({
      pathname: "/search",
      params: { mode: "fife" },
    });
    expect(searchHref("biznisz", { focus: true }).params).toEqual({ mode: "biznisz", focus: "1" });
  });
});
