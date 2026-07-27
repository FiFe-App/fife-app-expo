import "react-native-get-random-values";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import nacl from "tweetnacl";
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from "tweetnacl-util";
import { supabase } from "@/lib/supabase/supabase";

// v2: key is derived from / stored on the account (emotion_keys table) so it
// survives reinstall and works across devices. The local copy is only a cache.
const KEY_STORAGE_PREFIX = "emotion_log_encryption_key_v2_";

export interface EmotionLogPlain {
  rate: number;
  note?: string;
}

export interface EmotionLogCiphertext {
  data: string;
  nonce: string;
}

function storageKey(uid: string): string {
  return `${KEY_STORAGE_PREFIX}${uid}`;
}

async function getStoredKeyRaw(uid: string): Promise<string | null> {
  if (Platform.OS === "web") return AsyncStorage.getItem(storageKey(uid));
  return SecureStore.getItemAsync(storageKey(uid));
}

async function setStoredKeyRaw(uid: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(storageKey(uid), value);
    return;
  }
  await SecureStore.setItemAsync(storageKey(uid), value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * Reads the account's key from the server.
 * - Returns the base64 key when the row exists.
 * - Returns null only when the query succeeded and no key has been created yet.
 * - Throws on any network/permission error, so callers never mistake "offline"
 *   for "no key exists" (which would generate a divergent, unrecoverable key).
 */
async function fetchRemoteKey(uid: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("emotion_keys")
    .select("key")
    .eq("author", uid)
    .maybeSingle();
  if (error) throw error;
  return data?.key ?? null;
}

/**
 * Publishes a freshly generated key, but never overwrites one that already
 * exists (ignoreDuplicates => INSERT ... ON CONFLICT DO NOTHING). Then reads
 * back the canonical key so concurrent devices converge on the same value.
 */
async function pushKeyToServer(uid: string, keyB64: string): Promise<string> {
  const { error: insertError } = await supabase
    .from("emotion_keys")
    .upsert({ author: uid, key: keyB64 }, { onConflict: "author", ignoreDuplicates: true });
  if (insertError) throw insertError;

  const canonical = await fetchRemoteKey(uid);
  if (!canonical) throw new Error("emotion key push failed");
  return canonical;
}

let cachedKey: Uint8Array | null = null;
let cachedUid: string | null = null;

/**
 * Resolves the per-user key, in priority order:
 *   1. in-memory cache (same uid)
 *   2. local secure storage cache
 *   3. the account's key on the server
 *   4. a newly generated key, published to the server
 *
 * Throws if the server can't be reached and no local copy exists — callers
 * treat that as a transient failure and retry, rather than losing data.
 */
export async function getOrCreateUserKey(uid: string): Promise<Uint8Array> {
  if (cachedKey && cachedUid === uid) return cachedKey;

  const localRaw = await getStoredKeyRaw(uid);
  if (localRaw) {
    cachedKey = decodeBase64(localRaw);
    cachedUid = uid;
    return cachedKey;
  }

  const remote = await fetchRemoteKey(uid);
  if (remote) {
    await setStoredKeyRaw(uid, remote);
    cachedKey = decodeBase64(remote);
    cachedUid = uid;
    return cachedKey;
  }

  const generated = encodeBase64(nacl.randomBytes(nacl.secretbox.keyLength));
  const canonical = await pushKeyToServer(uid, generated);
  await setStoredKeyRaw(uid, canonical);
  cachedKey = decodeBase64(canonical);
  cachedUid = uid;
  return cachedKey;
}

export async function encryptEmotionLog(
  uid: string,
  plain: EmotionLogPlain,
): Promise<EmotionLogCiphertext> {
  const key = await getOrCreateUserKey(uid);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const message = decodeUTF8(JSON.stringify(plain));
  const box = nacl.secretbox(message, nonce, key);
  return { data: encodeBase64(box), nonce: encodeBase64(nonce) };
}

/** Returns null on any failure (corrupt data, wrong key, offline, tampering) — never throws. */
export async function decryptEmotionLog(
  uid: string,
  cipher: EmotionLogCiphertext,
): Promise<EmotionLogPlain | null> {
  try {
    const key = await getOrCreateUserKey(uid);
    const box = decodeBase64(cipher.data);
    const nonce = decodeBase64(cipher.nonce);
    const opened = nacl.secretbox.open(box, nonce, key);
    if (!opened) return null;
    const parsed = JSON.parse(encodeUTF8(opened));
    if (typeof parsed?.rate !== "number") return null;
    return { rate: parsed.rate, note: parsed.note ?? undefined };
  } catch {
    return null;
  }
}
