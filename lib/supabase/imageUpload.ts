import { ImagePickerAsset } from "expo-image-picker";

export interface UploadableImage {
  data: Uint8Array | Blob;
  fileName: string;
  mimeType: string;
}

// Converts a picked image asset into a payload safe to pass to
// supabase.storage.from(...).upload(path, data, { contentType }).
//
// Reading image.uri via fetch() is unreliable on native: content:// URIs on
// Android (especially cloud-backed gallery photos) and tmp file URIs on iOS
// can make fetch hang indefinitely with no error or resolve to an empty
// blob. Decoding the picker's base64 output avoids that path entirely.
// fetch is only used as a fallback when base64 wasn't requested/returned.
export async function getUploadableImage(
  image: ImagePickerAsset,
): Promise<UploadableImage> {
  const fileName =
    image.fileName || image.uri.split("/").pop() || `image_${Date.now()}.jpg`;
  const mimeType = image.mimeType || "image/jpeg";

  if (image.base64) {
    const b64 = image.base64.replace(/\s/g, "");
    const binaryString = atob(b64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    // Pass a Uint8Array (ArrayBufferView), not .buffer — a plain ArrayBuffer
    // can be detached crossing the Hermes JSI bridge on iOS.
    return { data: bytes, fileName, mimeType };
  }

  const response = await fetch(image.uri);
  const blob = await response.blob();
  return { data: blob, fileName, mimeType };
}
