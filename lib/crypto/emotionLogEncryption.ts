import { Ciphertext, decryptJson, encryptJson } from "@/lib/crypto/userKey";

// Emotion-log-shaped wrapper around the shared account-key crypto in userKey.ts.
// The key, storage location and wire format are unchanged from when this module
// owned them outright, so existing ciphertext keeps decrypting.

export interface EmotionLogPlain {
  rate: number;
  note?: string;
}

export type EmotionLogCiphertext = Ciphertext;

export async function encryptEmotionLog(
  uid: string,
  plain: EmotionLogPlain,
): Promise<EmotionLogCiphertext> {
  return encryptJson(uid, plain);
}

/** Returns null on any failure (corrupt data, wrong key, offline, tampering) — never throws. */
export async function decryptEmotionLog(
  uid: string,
  cipher: EmotionLogCiphertext,
): Promise<EmotionLogPlain | null> {
  const parsed = await decryptJson<EmotionLogPlain>(uid, cipher);
  if (typeof parsed?.rate !== "number") return null;
  return { rate: parsed.rate, note: parsed.note ?? undefined };
}
