import "react-native-get-random-values";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import nacl from "tweetnacl";
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from "tweetnacl-util";
import { supabase } from "@/lib/supabase/supabase";

// One symmetric key per account, used for every piece of client-encrypted data
// (emotion logs and the private half of user_settings).
//
// The key lives in the `emotion_keys` table — a name that predates its wider
// use. It is deliberately NOT renamed: the table has no UPDATE/DELETE policy
// precisely so the key can never be rotated out from under existing ciphertext,
// and moving the rows would break that guarantee.
//
// Storing the key on the account (rather than device-only) means it survives an
// app reinstall and works across devices. The trade-off, chosen deliberately
// when this was introduced, is that anyone with database access could decrypt.
const KEY_STORAGE_PREFIX = "emotion_log_encryption_key_v2_";

export interface Ciphertext {
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

/** Encrypts any JSON-serialisable value with the account key. Throws on failure. */
export async function encryptJson(uid: string, value: unknown): Promise<Ciphertext> {
  const key = await getOrCreateUserKey(uid);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const message = decodeUTF8(JSON.stringify(value));
  const box = nacl.secretbox(message, nonce, key);
  return { data: encodeBase64(box), nonce: encodeBase64(nonce) };
}

/**
 * Decrypts a value produced by encryptJson.
 * Returns null on any failure (corrupt data, wrong key, offline, tampering) —
 * never throws, so a single bad row can't take a screen down.
 */
export async function decryptJson<T>(uid: string, cipher: Ciphertext): Promise<T | null> {
  try {
    const key = await getOrCreateUserKey(uid);
    const box = decodeBase64(cipher.data);
    const nonce = decodeBase64(cipher.nonce);
    const opened = nacl.secretbox.open(box, nonce, key);
    if (!opened) return null;
    return JSON.parse(encodeUTF8(opened)) as T;
  } catch {
    return null;
  }
}
