import { Ciphertext, decryptJson, encryptJson } from "@/lib/crypto/userKey";
import { TaskItem } from "@/redux/store.type";

/**
 * The private half of a user_settings row: free-text personal content that the
 * server must not be able to read. Everything else on the row (theme, dismiss
 * flags, notification flags) stays in plain columns.
 */
export interface SettingsPrivate {
  mantra?: string;
  tasks: TaskItem[];
  previousSearches: string[];
  previousProfileSearches: string[];
}

/**
 * What comes back out. Same shape, except `previousProfileSearches` may be
 * absent: blobs written before the field existed — or by an older client still
 * running elsewhere — simply do not carry it, and "absent" has to stay
 * distinguishable from "empty" so `loadFromServer` can keep this device's list
 * instead of wiping it. The write type above keeps it required on purpose, so
 * forgetting the field in `pushToServer` is a compile error rather than a
 * silent data loss.
 */
export type DecryptedSettings = Omit<SettingsPrivate, "previousProfileSearches"> & {
  previousProfileSearches?: string[];
};

export type SettingsCiphertext = Ciphertext;

export async function encryptSettings(
  uid: string,
  plain: SettingsPrivate,
): Promise<SettingsCiphertext> {
  return encryptJson(uid, plain);
}

/**
 * Returns null on any failure (corrupt data, wrong key, offline, tampering) —
 * never throws. Callers keep their local values when this returns null rather
 * than wiping the user's mantra and task list.
 *
 * A decryptable blob that predates a field is a different case, and null cannot
 * express it: see `previousProfileSearches` below, which normalises to undefined
 * rather than [] so the caller can tell "the server says empty" from "the server
 * has never heard of this field".
 */
export async function decryptSettings(
  uid: string,
  cipher: SettingsCiphertext,
): Promise<DecryptedSettings | null> {
  const parsed = await decryptJson<DecryptedSettings>(uid, cipher);
  if (!parsed) return null;
  // Defensive: a tampered or half-written blob must not put non-arrays into the
  // store, where .map/.filter on them would crash a screen.
  return {
    mantra: typeof parsed.mantra === "string" ? parsed.mantra : undefined,
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    previousSearches: Array.isArray(parsed.previousSearches) ? parsed.previousSearches : [],
    previousProfileSearches: Array.isArray(parsed.previousProfileSearches)
      ? parsed.previousProfileSearches
      : undefined,
  };
}
