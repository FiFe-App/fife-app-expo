import { MediaKindType } from "@/redux/store.type";

const VIDEO_EXTENSIONS = [
  "3gp",
  "avi",
  "m4v",
  "mkv",
  "mov",
  "mp4",
  "mpeg",
  "mpg",
  "ogv",
  "qt",
  "webm",
];
const AUDIO_EXTENSIONS = [
  "3ga",
  "aac",
  "amr",
  "flac",
  "m4a",
  "mp3",
  "oga",
  "ogg",
  "opus",
  "wav",
  "weba",
];

export const getMediaKindFromMimeType = (
  mimeType?: string | null,
): MediaKindType | undefined => {
  if (!mimeType) return undefined;
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("image/")) return "image";
  return undefined;
};

export const getMediaKindFromFileName = (
  fileName?: string | null,
): MediaKindType | undefined => {
  const extension = fileName?.split("?")[0].split(".").pop()?.toLowerCase();
  if (!extension) return undefined;
  if (VIDEO_EXTENSIONS.includes(extension)) return "video";
  if (AUDIO_EXTENSIONS.includes(extension)) return "audio";
  return undefined;
};

/** A media record, either parsed or still in its stored JSON string form. */
export type MediaLike =
  | string
  | {
      mediaType?: MediaKindType;
      mimeType?: string | null;
      path?: string;
      fileName?: string | null;
      uri?: string;
    };

const parseMedia = (media: MediaLike) => {
  if (typeof media !== "string") return media;
  try {
    return JSON.parse(media);
  } catch {
    return { path: media };
  }
};

/**
 * Bizniszek only had images at first, so records saved back then carry no
 * `mediaType` — anything we cannot identify is treated as an image.
 */
const getMediaKind = (media: MediaLike): MediaKindType => {
  const parsed = parseMedia(media);
  return (
    parsed.mediaType ??
    getMediaKindFromMimeType(parsed.mimeType) ??
    getMediaKindFromFileName(parsed.path || parsed.fileName || parsed.uri) ??
    "image"
  );
};

export default getMediaKind;
