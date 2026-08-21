import getSignedUrl from "@/lib/functions/getSignedUrl";
import { __resetSupabase, storageBucket } from "@/test-utils/mocks/supabase";

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * getSignedUrl keeps its cache in a module-level Map that no test can reach
 * (re-requiring the module would also swap out the supabase double it closes
 * over). Giving every test its own object path keeps them independent without
 * needing to clear it.
 */
let pathCounter = 0;
const uniquePath = () => `uid/file-${++pathCounter}.jpg`;

const signed = (url: string) => ({ data: { signedUrl: url }, error: null });

beforeEach(() => {
  __resetSupabase();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => jest.useRealTimers());

describe("getSignedUrl", () => {
  it("signs the requested object", async () => {
    const bucket = storageBucket("messageImages");
    bucket.createSignedUrl.mockResolvedValue(signed("https://signed/one"));

    const path = uniquePath();
    expect(await getSignedUrl("messageImages", path)).toBe(
      "https://signed/one",
    );
    expect(bucket.createSignedUrl).toHaveBeenCalledWith(path, 3600);
  });

  it("reuses the cached URL instead of signing twice", async () => {
    const bucket = storageBucket("messageImages");
    bucket.createSignedUrl.mockResolvedValue(signed("https://signed/one"));

    const path = uniquePath();
    await getSignedUrl("messageImages", path);
    const second = await getSignedUrl("messageImages", path);

    // Signing twice would produce two different URLs and defeat the image
    // cache — that is the whole reason this cache exists.
    expect(second).toBe("https://signed/one");
    expect(bucket.createSignedUrl).toHaveBeenCalledTimes(1);
  });

  it("caches per bucket and path, not globally", async () => {
    const bucket = storageBucket("messageImages");
    bucket.createSignedUrl
      .mockResolvedValueOnce(signed("https://signed/a"))
      .mockResolvedValueOnce(signed("https://signed/b"));

    expect(await getSignedUrl("messageImages", uniquePath())).toBe(
      "https://signed/a",
    );
    expect(await getSignedUrl("messageImages", uniquePath())).toBe(
      "https://signed/b",
    );
  });

  it("re-signs once the URL is inside the refresh margin", async () => {
    const bucket = storageBucket("messageImages");
    bucket.createSignedUrl
      .mockResolvedValueOnce(signed("https://signed/first"))
      .mockResolvedValueOnce(signed("https://signed/second"));

    const path = uniquePath();
    await getSignedUrl("messageImages", path);

    // 30s before expiry is inside the 60s margin, so it must not be served.
    jest.setSystemTime(Date.now() + ONE_HOUR_MS - 30_000);

    expect(await getSignedUrl("messageImages", path)).toBe(
      "https://signed/second",
    );
    expect(bucket.createSignedUrl).toHaveBeenCalledTimes(2);
  });

  it("still serves the cached URL just outside the refresh margin", async () => {
    const bucket = storageBucket("messageImages");
    bucket.createSignedUrl.mockResolvedValue(signed("https://signed/first"));

    const path = uniquePath();
    await getSignedUrl("messageImages", path);
    jest.setSystemTime(Date.now() + ONE_HOUR_MS - 120_000);

    expect(await getSignedUrl("messageImages", path)).toBe(
      "https://signed/first",
    );
    expect(bucket.createSignedUrl).toHaveBeenCalledTimes(1);
  });

  it("returns null when the object cannot be signed", async () => {
    const bucket = storageBucket("messageImages");
    bucket.createSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "not authorised" },
    });

    expect(await getSignedUrl("messageImages", uniquePath())).toBeNull();
  });

  it("does not cache a failure", async () => {
    const bucket = storageBucket("messageImages");
    bucket.createSignedUrl
      .mockResolvedValueOnce({ data: null, error: { message: "nope" } })
      .mockResolvedValueOnce(signed("https://signed/recovered"));

    const path = uniquePath();
    expect(await getSignedUrl("messageImages", path)).toBeNull();
    // A transient failure must not poison the entry for the next hour.
    expect(await getSignedUrl("messageImages", path)).toBe(
      "https://signed/recovered",
    );
  });
});
