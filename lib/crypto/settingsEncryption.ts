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
}

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
 */
export async function decryptSettings(
  uid: string,
  cipher: SettingsCiphertext,
): Promise<SettingsPrivate | null> {
  const parsed = await decryptJson<SettingsPrivate>(uid, cipher);
  if (!parsed) return null;
  // Defensive: a tampered or half-written blob must not put non-arrays into the
  // store, where .map/.filter on them would crash a screen.
  return {
    mantra: typeof parsed.mantra === "string" ? parsed.mantra : undefined,
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    previousSearches: Array.isArray(parsed.previousSearches) ? parsed.previousSearches : [],
  };
}
