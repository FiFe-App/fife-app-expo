/**
 * Building the link-preview <head> for a page of the site.
 *
 * The web build is a single-page app: every URL is served the same index.html,
 * whose head carries the app-wide Open Graph tags from app/+html.tsx. A crawler
 * (Facebook, Messenger, WhatsApp, Slack, Twitter…) never runs the JavaScript
 * that fills the page in, so without this it shows "FiFe App" for every link,
 * including a link to one particular biznisz.
 *
 * The edge function next to this file swaps those defaults for the real ones
 * before the HTML leaves the CDN. Kept free of Deno APIs on purpose so the
 * rewriting can be unit-tested with the rest of the app (see
 * __tests__/social/socialMeta.test.ts).
 */

export interface SocialMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  /** og:type — "website" for the app itself, "article" for one biznisz. */
  type?: string;
  imageAlt?: string;
}

export interface BuzinessPreviewRow {
  id: number | string;
  title: string;
  description: string | null;
  images: string[] | null;
}

const SITE_NAME = "FiFe App";

/** Longest description a preview shows before it is cut off anyway. */
const DESCRIPTION_LIMIT = 200;

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const truncate = (value: string, limit = DESCRIPTION_LIMIT) => {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  // Cut on a word boundary when there is one close enough to the limit.
  const clipped = text.slice(0, limit - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
};

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"];

/**
 * The first still image of a biznisz, as a public storage URL.
 *
 * `images` holds JSON strings written by the editor ({ path, mediaType, … }).
 * Videos and audio are skipped: a preview card can only show a picture.
 */
export const getBuzinessImageUrl = (
  images: string[] | null,
  supabaseUrl: string,
): string | null => {
  for (const entry of images ?? []) {
    let parsed: { path?: string; mediaType?: string } | null = null;
    try {
      parsed = JSON.parse(entry);
    } catch {
      continue;
    }
    const path = parsed?.path;
    if (!path) continue;
    const extension = path.split(".").pop()?.toLowerCase() ?? "";
    const isImage = parsed?.mediaType
      ? parsed.mediaType === "image"
      : IMAGE_EXTENSIONS.includes(extension);
    if (!isImage) continue;
    return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/buzinessImages/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  }
  return null;
};

/**
 * What the card should say for one biznisz. The title column keeps the name and
 * the keywords in one string ("Fodrász $ haj $ Budapest"), the same way the app
 * splits it for display.
 */
export const buildBuzinessMeta = (
  row: BuzinessPreviewRow,
  options: { siteUrl: string; supabaseUrl: string; fallbackImage: string },
): SocialMeta => {
  const segments = row.title.split(" $ ").map((s) => s.trim()).filter(Boolean);
  const name = segments[0] || SITE_NAME;
  const keywords = segments.slice(1);
  const description = row.description?.trim()
    ? truncate(row.description)
    : keywords.length
      ? truncate(keywords.join(", "))
      : "Nézd meg ezt a bizniszt a FiFe Appon!";

  return {
    title: `${name} – ${SITE_NAME}`,
    description,
    url: `${options.siteUrl.replace(/\/$/, "")}/biznisz/${row.id}`,
    image:
      getBuzinessImageUrl(row.images, options.supabaseUrl) ?? options.fallbackImage,
    imageAlt: name,
    type: "article",
  };
};

/** The tags themselves, in the order a crawler reads them. */
export const renderMetaTags = (meta: SocialMeta): string => {
  const tags: [string, string][] = [
    ["description", meta.description],
  ];
  const properties: [string, string][] = [
    ["og:site_name", SITE_NAME],
    ["og:type", meta.type ?? "website"],
    ["og:title", meta.title],
    ["og:description", meta.description],
    ["og:url", meta.url],
    ["og:image", meta.image],
    ["og:locale", "hu_HU"],
  ];
  const twitter: [string, string][] = [
    ["twitter:card", "summary_large_image"],
    ["twitter:title", meta.title],
    ["twitter:description", meta.description],
    ["twitter:image", meta.image],
  ];
  if (meta.imageAlt) {
    properties.push(["og:image:alt", meta.imageAlt]);
    twitter.push(["twitter:image:alt", meta.imageAlt]);
  }

  return [
    `<title>${escapeHtml(meta.title)}</title>`,
    ...tags.map(
      ([name, content]) =>
        `<meta name="${name}" content="${escapeHtml(content)}" />`,
    ),
    ...properties.map(
      ([property, content]) =>
        `<meta property="${property}" content="${escapeHtml(content)}" />`,
    ),
    ...twitter.map(
      ([name, content]) =>
        `<meta name="${name}" content="${escapeHtml(content)}" />`,
    ),
  ].join("\n    ");
};

const TITLE_TAG = /<title>[\s\S]*?<\/title>/gi;
const META_TAG =
  /<meta\b[^>]*?(?:property\s*=\s*["'](?:og|fb):[^"']*["']|name\s*=\s*["'](?:description|twitter:[^"']*)["'])[^>]*?>/gi;

/**
 * Replaces the document's own title and preview tags with `meta`.
 *
 * The defaults have to go rather than be added to: two og:title tags leave it
 * to the crawler which one wins, and the one it picks is usually the first.
 */
export const injectSocialMeta = (html: string, meta: SocialMeta): string => {
  const stripped = html.replace(TITLE_TAG, "").replace(META_TAG, "");
  const block = `    ${renderMetaTags(meta)}\n  `;
  const headEnd = stripped.search(/<\/head>/i);
  if (headEnd === -1) return stripped;
  return `${stripped.slice(0, headEnd)}${block}${stripped.slice(headEnd)}`;
};
