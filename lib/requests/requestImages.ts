import { supabase } from "@/lib/supabase/supabase";
import type * as ExpoImagePicker from "expo-image-picker";

export const REQUESTS_BUCKET = "requests";

/**
 * Uploads the picked images to `<uid>/<requestId>/<n>-<fileName>` in the requests bucket
 * (the storage policy only lets a user write under their own uid folder) and returns the
 * paths that made it. A failed image is skipped rather than failing the request: the text
 * is already saved, and `failed` tells the caller how many to apologise for.
 */
export async function uploadRequestImages(
  uid: string,
  requestId: number,
  assets: ExpoImagePicker.ImagePickerAsset[],
): Promise<{ paths: string[]; failed: number }> {
  const paths: string[] = [];
  let failed = 0;

  for (const [index, asset] of assets.entries()) {
    try {
      // iOS leaves fileName null for edited picks and under limited photo access.
      const fileName =
        asset.fileName || asset.uri.split("/").pop() || `${Date.now()}.jpg`;
      const safeName = fileName.replace(/[^\w.-]+/g, "_");
      const arrayBuffer = await (await fetch(asset.uri)).arrayBuffer();
      const { data, error } = await supabase.storage
        .from(REQUESTS_BUCKET)
        .upload(`${uid}/${requestId}/${index}-${safeName}`, arrayBuffer, {
          contentType: asset.mimeType ?? "image/jpeg",
          upsert: false,
        });
      if (error || !data?.path) throw error ?? new Error("no path");
      paths.push(data.path);
    } catch (error) {
      console.error("Request image upload error:", error);
      failed += 1;
    }
  }

  return { paths, failed };
}

/** Best effort: an orphaned file is wasted space, not a broken request. */
export async function removeRequestImages(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const { error } = await supabase.storage.from(REQUESTS_BUCKET).remove(paths);
  if (error) console.error("Request image delete error:", error);
}
