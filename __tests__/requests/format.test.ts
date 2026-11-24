import { firstLine, requestPlaceText } from "@/lib/requests/format";

describe("requestPlaceText", () => {
  it("says Bárhol for a request without a place", () => {
    expect(requestPlaceText({ lat: null, long: null, distance: null })).toBe("Bárhol");
  });

  it("shows the distance in kilometres", () => {
    expect(requestPlaceText({ lat: 47.5, long: 19.0, distance: 3200 })).toBe("3.2 km");
  });

  it("says Közel hozzád under 100 m", () => {
    expect(requestPlaceText({ lat: 47.5, long: 19.0, distance: 40 })).toBe("Közel hozzád");
  });

  it("falls back when the distance is unknown", () => {
    expect(requestPlaceText({ lat: 47.5, long: 19.0, distance: null })).toBe("Helyhez kötött");
  });
});

describe("firstLine", () => {
  it("keeps only the first line", () => {
    expect(firstLine("egy\nkettő")).toBe("egy");
  });
});
