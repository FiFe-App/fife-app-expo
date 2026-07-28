import "react-native-get-random-values";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import nacl from "tweetnacl";
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from "tweetnacl-util";

const KEY_STORAGE_KEY = "emotion_log_encryption_key_v1";

export interface EmotionLogPlain {
  rate: number;
  note?: string;
}

export interface EmotionLogCiphertext {
  data: string;
  nonce: string;
}

async function getStoredKeyRaw(): Promise<string | null> {
  if (Platform.OS === "web") return AsyncStorage.getItem(KEY_STORAGE_KEY);
  return SecureStore.getItemAsync(KEY_STORAGE_KEY);
}

async function setStoredKeyRaw(value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(KEY_STORAGE_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(KEY_STORAGE_KEY, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

let cachedKey: Uint8Array | null = null;

/** Gets the per-device key, generating and persisting one on first call. Idempotent. */
export async function getOrCreateDeviceKey(): Promise<Uint8Array> {
  if (cachedKey) return cachedKey;
  const existing = await getStoredKeyRaw();
  if (existing) {
    cachedKey = decodeBase64(existing);
    return cachedKey;
  }
  const newKey = nacl.randomBytes(nacl.secretbox.keyLength);
  await setStoredKeyRaw(encodeBase64(newKey));
  cachedKey = newKey;
  return newKey;
}

export async function encryptEmotionLog(plain: EmotionLogPlain): Promise<EmotionLogCiphertext> {
  const key = await getOrCreateDeviceKey();
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const message = decodeUTF8(JSON.stringify(plain));
  const box = nacl.secretbox(message, nonce, key);
  return { data: encodeBase64(box), nonce: encodeBase64(nonce) };
}

/** Returns null on any failure (corrupt data, wrong key, tampering) — never throws. */
export async function decryptEmotionLog(
  cipher: EmotionLogCiphertext,
): Promise<EmotionLogPlain | null> {
  try {
    const key = await getOrCreateDeviceKey();
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
