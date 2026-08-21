import { Platform } from "react-native";
import { File as FileSystemFile } from "expo-file-system";

/**
 * Turns a picked file into something Supabase storage can upload.
 */
const getUploadData = async (asset: {
  uri: string;
  base64?: string | null;
}): Promise<Uint8Array | Blob> => {
  if (asset.base64) {
    // Use base64 directly — avoids fetch failures on iOS temp file URIs.
    // Pass Uint8Array (ArrayBufferView), not .buffer — ArrayBuffer can be
    // detached crossing the Hermes JSI bridge on iOS.
    const b64 = asset.base64.replace(/\s/g, ""); // strip any line breaks
    const binaryString = atob(b64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  if (Platform.OS === "web") {
    const response = await fetch(asset.uri);
    return response.blob();
  }
  // Videos and audio carry no base64, and reading the file directly works
  // where fetch() fails on iOS temp file URIs.
  return new FileSystemFile(asset.uri).bytes();
};

export default getUploadData;
