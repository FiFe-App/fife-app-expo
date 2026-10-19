/**
 * The link-preview head built by netlify/edge-functions/social-preview.ts.
 *
 * The edge function itself runs on Deno at the CDN and is not exercised here;
 * everything it decides about *what the card says* lives in socialMeta.ts,
 * which is plain TypeScript for exactly this reason.
 */
import {
  buildBuzinessMeta,
  getBuzinessImageUrl,
  injectSocialMeta,
  renderMetaTags,
  truncate,
} from "@/netlify/edge-functions/socialMeta";

const SUPABASE_URL = "https://project.supabase.co";
const OPTIONS = {
  siteUrl: "https://fifeapp.hu",
  supabaseUrl: SUPABASE_URL,
  fallbackImage: "https://fifeapp.hu/og-image.png",
};

const image = (path: string, mediaType = "image") =>
  JSON.stringify({ path, mediaType, description: "" });

describe("buildBuzinessMeta", () => {
  it("uses the name from the title and drops the keywords behind it", () => {
    const meta = buildBuzinessMeta(
      {
        id: 12,
        title: "Kerékpárszerviz $ bicikli $ javítás",
        description: "Bármit megjavítok.",
        images: null,
      },
      OPTIONS,
    );

    expect(meta.title).toBe("Kerékpárszerviz – FiFe App");
    expect(meta.description).toBe("Bármit megjavítok.");
    expect(meta.url).toBe("https://fifeapp.hu/biznisz/12");
    expect(meta.type).toBe("article");
  });

  it("falls back to the keywords when there is no description", () => {
    const meta = buildBuzinessMeta(
      { id: 3, title: "Fodrász $ haj $ Budapest", description: "", images: null },
      OPTIONS,
    );

    expect(meta.description).toBe("haj, Budapest");
  });

  it("shows the app's own picture when the biznisz has none", () => {
    const meta = buildBuzinessMeta(
      { id: 3, title: "Fodrász", description: null, images: null },
      OPTIONS,
    );

    expect(meta.image).toBe(OPTIONS.fallbackImage);
  });

  it("shows the first picture of the biznisz when it has one", () => {
    const meta = buildBuzinessMeta(
      {
        id: 3,
        title: "Fodrász",
        description: null,
        images: [image("uid/clip.mp4", "video"), image("uid/hair.jpg")],
      },
      OPTIONS,
    );

    expect(meta.image).toBe(
      `${SUPABASE_URL}/storage/v1/object/public/buzinessImages/uid/hair.jpg`,
    );
  });
});

describe("getBuzinessImageUrl", () => {
  it("ignores entries that are not images or not parseable", () => {
    expect(getBuzinessImageUrl(["{ not json"], SUPABASE_URL)).toBeNull();
    expect(getBuzinessImageUrl([image("a/b.mp3", "audio")], SUPABASE_URL)).toBeNull();
  });

  it("falls back to the file extension when the entry has no mediaType", () => {
    expect(
      getBuzinessImageUrl([JSON.stringify({ path: "uid/pic.PNG" })], SUPABASE_URL),
    ).toBe(`${SUPABASE_URL}/storage/v1/object/public/buzinessImages/uid/pic.PNG`);
  });

  it("escapes a path with a space in it", () => {
    expect(
      getBuzinessImageUrl([image("uid/my pic.png")], SUPABASE_URL),
    ).toBe(`${SUPABASE_URL}/storage/v1/object/public/buzinessImages/uid/my%20pic.png`);
  });
});

describe("truncate", () => {
  it("leaves a short description alone", () => {
    expect(truncate("Rövid szöveg")).toBe("Rövid szöveg");
  });

  it("cuts a long one on a word boundary", () => {
    const long = "szó ".repeat(100);
    const result = truncate(long);

    expect(result.length).toBeLessThanOrEqual(200);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toContain("  ");
  });
});

describe("renderMetaTags", () => {
  it("escapes the text so a quote in a description cannot break out of the tag", () => {
    const tags = renderMetaTags({
      title: "Bögre \"kézműves\" & társai",
      description: "<script>alert(1)</script>",
      url: "https://fifeapp.hu/biznisz/1",
      image: "https://fifeapp.hu/og-image.png",
    });

    expect(tags).toContain("&quot;kézműves&quot;");
    expect(tags).not.toContain("<script>");
    expect(tags).toContain("<meta property=\"og:type\" content=\"website\" />");
  });
});

describe("injectSocialMeta", () => {
  // The shape app/+html.tsx renders, cut down to the parts that matter.
  const html = [
    "<!DOCTYPE html><html lang=\"hu\"><head>",
    "<meta charSet=\"utf-8\"/>",
    "<title>FiFe App</title>",
    "<meta name=\"description\" content=\"A FiFe App egy közösség\"/>",
    "<meta property=\"og:title\" content=\"FiFe App\"/>",
    "<meta property=\"og:image\" content=\"https://fifeapp.hu/og-image.png\"/>",
    "<meta name=\"twitter:card\" content=\"summary_large_image\"/>",
    "</head><body><div id=\"root\"></div></body></html>",
  ].join("");

  const meta = {
    title: "Kerékpárszerviz – FiFe App",
    description: "Bármit megjavítok.",
    url: "https://fifeapp.hu/biznisz/12",
    image: "https://project.supabase.co/storage/v1/object/public/buzinessImages/uid/bike.jpg",
    type: "article",
  };

  it("replaces the app-wide defaults instead of adding a second set", () => {
    const result = injectSocialMeta(html, meta);

    expect(result.match(/<title>/g)).toHaveLength(1);
    expect(result.match(/property="og:title"/g)).toHaveLength(1);
    expect(result).toContain("<title>Kerékpárszerviz – FiFe App</title>");
    expect(result).toContain("content=\"Bármit megjavítok.\"");
    expect(result).not.toContain("content=\"FiFe App\"/>");
  });

  it("keeps the rest of the document intact", () => {
    const result = injectSocialMeta(html, meta);

    expect(result).toContain("<meta charSet=\"utf-8\"/>");
    expect(result).toContain("<div id=\"root\"></div>");
    expect(result.indexOf("og:url")).toBeLessThan(result.indexOf("</head>"));
  });

  it("returns the document untouched when it has no head to write into", () => {
    expect(injectSocialMeta("<p>hello</p>", meta)).toBe("<p>hello</p>");
  });
});
