jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));

import { MODE_HOME, modeForPath, otherMode } from "@/lib/mode/appMode";

describe("modeForPath", () => {
  it.each([
    ["/me", "en"],
    ["/me/", "en"],
    ["/user/emotion-history", "en"],
    ["/user/get-help", "en"],
    ["/home", "mi"],
    ["/search", "mi"],
    ["/chats", "mi"],
    ["/chat/abc", "mi"],
    ["/user/edit", "mi"],
    ["/user/some-uid", "mi"],
    ["/biznisz/123", "mi"],
    ["/meme", "mi"],
    ["/", "mi"],
  ])("%s → %s", (path, mode) => {
    expect(modeForPath(path)).toBe(mode);
  });
});

describe("mode switch targets", () => {
  it("lands on each side's first tab", () => {
    expect(MODE_HOME[otherMode("en")]).toBe("/home");
    expect(MODE_HOME[otherMode("mi")]).toBe("/me");
  });
});
