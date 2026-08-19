import { supabase } from "@/lib/supabase/supabase";

/** What a MESSAGE contact's `data` column holds when messaging is on. */
export const MESSAGING_ENABLED_VALUE = "true";

/**
 * Reads a MESSAGE contact without tripping over duplicates.
 *
 * `contacts` never had a uniqueness rule per (author, type), so accounts could
 * collect several MESSAGE rows. Every read used `.maybeSingle()`, which fails
 * with PGRST116 as soon as there is more than one — and since callers only
 * destructured `data`, the error was dropped and messaging silently read as
 * off. Ordering by id and taking the first row copes with whatever is already
 * in the table.
 */
const readMessagingContact = async (uid: string) => {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, data")
    .eq("author", uid)
    .eq("type", "MESSAGE")
    .order("id")
    .limit(1);

  return { row: data?.[0] ?? null, error };
};

/**
 * Whether `uid` has messaging switched on, or `null` when the check itself
 * failed. Callers should keep their previous answer on `null` rather than
 * showing the account as disabled because one request did not come back.
 */
export const fetchMessagingEnabled = async (uid: string) => {
  const { row, error } = await readMessagingContact(uid);
  if (error) {
    console.error("messaging contact read failed", error);
    return null;
  }
  return !!row?.data;
};

/**
 * Switches messaging on for `uid`, reusing the existing contact when there is
 * one. The old code inserted whenever its read came back empty, so on an
 * account with duplicates every press added another row and made the next read
 * fail harder.
 */
export const enableMessaging = async (uid: string) => {
  const { row, error: readError } = await readMessagingContact(uid);
  if (readError) return { error: readError.message };

  const { error } = row
    ? await supabase
        .from("contacts")
        .update({ data: MESSAGING_ENABLED_VALUE, public: true })
        .eq("id", row.id)
    : await supabase.from("contacts").insert({
        author: uid,
        type: "MESSAGE",
        data: MESSAGING_ENABLED_VALUE,
        public: true,
        title: null,
      });

  if (error) {
    console.error("enabling messaging failed", error);
    return { error: error.message };
  }
  return {};
};
