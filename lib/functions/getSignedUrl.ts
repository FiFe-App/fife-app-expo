import { supabase } from "../supabase/supabase";

const EXPIRES_IN_SECONDS = 60 * 60;
const REFRESH_MARGIN_MS = 60 * 1000;

// Signing the same object twice gives two different URLs, which would make the
// image cache miss every time. Keeping the URL around for its lifetime lets
// expo-image serve the file from its own cache.
const cache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Signed URL for an object in a private bucket. Returns null when the current
 * user is not allowed to read it.
 */
const getSignedUrl = async (bucket: string, path: string) => {
  const key = `${bucket}/${path}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt - REFRESH_MARGIN_MS > Date.now())
    return cached.url;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, EXPIRES_IN_SECONDS);

  if (error || !data) {
    console.log("signed url error", error);
    return null;
  }

  cache.set(key, {
    url: data.signedUrl,
    expiresAt: Date.now() + EXPIRES_IN_SECONDS * 1000,
  });
  return data.signedUrl;
};

export default getSignedUrl;
