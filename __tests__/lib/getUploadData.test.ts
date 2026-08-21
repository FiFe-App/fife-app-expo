import { Platform } from "react-native";
import { File as FileSystemFile } from "expo-file-system";

import getUploadData from "@/lib/functions/getUploadData";

jest.mock("expo-file-system", () => ({
  File: jest.fn(),
}));

const MockedFile = FileSystemFile as unknown as jest.Mock;

/** `Platform.OS` is read-only in the typings but writable on the mock object. */
const setPlatform = (os: "ios" | "android" | "web") => {
  Object.defineProperty(Platform, "OS", { value: os, configurable: true });
};

const originalOS = Platform.OS;
const originalFetch = global.fetch;

beforeEach(() => {
  MockedFile.mockReset();
  setPlatform("ios");
});

afterEach(() => {
  setPlatform(originalOS as "ios");
  global.fetch = originalFetch;
});

describe("getUploadData", () => {
  describe("assets carrying base64 (images)", () => {
    it("decodes base64 to bytes rather than fetching the uri", async () => {
      // "Hi" — small enough to assert on byte for byte.
      const result = await getUploadData({ uri: "file:///a.jpg", base64: "SGk=" });

      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result as Uint8Array)).toEqual([72, 105]);
      expect(MockedFile).not.toHaveBeenCalled();
    });

    it("tolerates line breaks in the base64 payload", async () => {
      // Some encoders wrap at 76 chars; the raw string would fail atob().
      const result = await getUploadData({
        uri: "file:///a.jpg",
        base64: "SG\nk=",
      });

      expect(Array.from(result as Uint8Array)).toEqual([72, 105]);
    });

    it("returns a view, not a detached ArrayBuffer", async () => {
      // Passing `.buffer` across the Hermes JSI bridge on iOS can detach it,
      // which is why this must stay a Uint8Array.
      const result = await getUploadData({ uri: "file:///a.jpg", base64: "SGk=" });

      expect(ArrayBuffer.isView(result)).toBe(true);
    });
  });

  describe("web without base64", () => {
    it("fetches the blob: uri and returns a Blob", async () => {
      setPlatform("web");
      const blob = { size: 3, type: "audio/mpeg" };
      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(blob),
      }) as unknown as typeof fetch;

      const result = await getUploadData({ uri: "blob:https://app/xyz" });

      expect(global.fetch).toHaveBeenCalledWith("blob:https://app/xyz");
      expect(result).toBe(blob);
      expect(MockedFile).not.toHaveBeenCalled();
    });
  });

  describe("native without base64 (video and audio)", () => {
    it("reads the file directly instead of fetching it", async () => {
      const bytes = new Uint8Array([1, 2, 3]);
      MockedFile.mockImplementation(() => ({
        bytes: jest.fn().mockResolvedValue(bytes),
      }));
      global.fetch = jest.fn() as unknown as typeof fetch;

      const result = await getUploadData({ uri: "file:///clip.mp4" });

      // fetch() is unreliable on iOS temp-file URIs, which is the bug this
      // branch exists to avoid.
      expect(global.fetch).not.toHaveBeenCalled();
      expect(MockedFile).toHaveBeenCalledWith("file:///clip.mp4");
      expect(result).toBe(bytes);
    });

    it("propagates a read failure so the caller can report it", async () => {
      MockedFile.mockImplementation(() => ({
        bytes: jest.fn().mockRejectedValue(new Error("ENOENT")),
      }));

      await expect(getUploadData({ uri: "file:///gone.mp4" })).rejects.toThrow(
        "ENOENT",
      );
    });

    it("takes the file branch when base64 is null", async () => {
      // expo-image-picker returns base64: null for videos, not undefined.
      const bytes = new Uint8Array([9]);
      MockedFile.mockImplementation(() => ({
        bytes: jest.fn().mockResolvedValue(bytes),
      }));

      expect(await getUploadData({ uri: "file:///clip.mp4", base64: null })).toBe(
        bytes,
      );
    });
  });
});
