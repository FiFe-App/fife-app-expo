import { compareVersions, isOlderThan, parseVersion } from "@/lib/appVersion/compareVersions";

describe("parseVersion", () => {
  it("pads a partial version to three components", () => {
    expect(parseVersion("1.2")).toEqual([1, 2, 0]);
    expect(parseVersion("2")).toEqual([2, 0, 0]);
  });

  it("drops a pre-release suffix and a leading v", () => {
    expect(parseVersion("v1.2.3-beta.4")).toEqual([1, 2, 3]);
  });

  it("ignores a fourth component", () => {
    expect(parseVersion("1.2.3.4")).toEqual([1, 2, 3]);
  });

  it("degrades to zeros instead of throwing", () => {
    expect(parseVersion("")).toEqual([0, 0, 0]);
    expect(parseVersion(null)).toEqual([0, 0, 0]);
    expect(parseVersion("nonsense")).toEqual([0, 0, 0]);
  });
});

describe("compareVersions", () => {
  it("compares numerically, not as text", () => {
    // The whole reason this exists: "1.10.0" < "1.9.9" as strings.
    expect(compareVersions("1.10.0", "1.9.9")).toBeGreaterThan(0);
  });

  it("treats a missing component as zero", () => {
    expect(compareVersions("1.2", "1.2.0")).toBe(0);
  });

  it("orders patch releases", () => {
    expect(compareVersions("1.0.1", "1.0.2")).toBeLessThan(0);
    expect(compareVersions("1.0.2", "1.0.1")).toBeGreaterThan(0);
  });

  it("answers whether a build is behind a threshold", () => {
    expect(isOlderThan("1.0.1", "1.1.0")).toBe(true);
    expect(isOlderThan("1.1.0", "1.1.0")).toBe(false);
    expect(isOlderThan("1.2.0", "1.1.0")).toBe(false);
  });
});
