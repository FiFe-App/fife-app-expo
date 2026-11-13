import { supabase } from "@/lib/supabase/supabase";
import { MESSAGING_ENABLED_VALUE } from "@/lib/chat/messagingContact";

export type Helper = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  /** The optional note the helper wrote next to the "Rám írhatsz" switch. */
  note: string | null;
};

const shuffle = <T,>(items: T[]) => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Everyone who switched on "Rám írhatsz" (an I-HELP-YOU contact) and can
 * actually be messaged, i.e. also has MESSAGE on. Leaves out `myUid` and the
 * people they blocked. Shuffled, so the same few people are not always on top.
 */
export const fetchHelpers = async (
  myUid: string | undefined,
): Promise<{ helpers: Helper[]; error: string | null }> => {
  const { data: offers, error } = await supabase
    .from("contacts")
    .select("author, title")
    .eq("type", "I-HELP-YOU")
    .eq("data", MESSAGING_ENABLED_VALUE);
  if (error) return { helpers: [], error: error.message };

  // One note per author, even if old duplicate rows exist.
  const notes = new Map<string, string | null>();
  for (const o of offers ?? []) {
    if (o.author === myUid) continue;
    if (!notes.has(o.author) || (!notes.get(o.author) && o.title)) {
      notes.set(o.author, o.title?.trim() || null);
    }
  }
  const ids = Array.from(notes.keys());
  if (ids.length === 0) return { helpers: [], error: null };

  const [messaging, profiles, blocked] = await Promise.all([
    supabase
      .from("contacts")
      .select("author")
      .eq("type", "MESSAGE")
      .eq("data", MESSAGING_ENABLED_VALUE)
      .in("author", ids),
    supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", ids),
    myUid
      ? supabase
          .from("blocked_users")
          .select("blocked_id")
          .eq("blocker_id", myUid)
      : Promise.resolve({ data: [] as { blocked_id: string }[], error: null }),
  ]);
  const failed = messaging.error || profiles.error;
  if (failed) return { helpers: [], error: failed.message };

  const canMessage = new Set((messaging.data ?? []).map((m) => m.author));
  const blockedIds = new Set((blocked.data ?? []).map((b) => b.blocked_id));

  const helpers = (profiles.data ?? [])
    .filter((p) => canMessage.has(p.id) && !blockedIds.has(p.id))
    .map((p) => ({ ...p, note: notes.get(p.id) ?? null }));

  return { helpers: shuffle(helpers), error: null };
};

/**
 * Whether `uid` has "Rám írhatsz" switched on, or `null` when the read failed.
 */
export const fetchOffersHelp = async (uid: string) => {
  const { data, error } = await supabase
    .from("contacts")
    .select("id")
    .eq("author", uid)
    .eq("type", "I-HELP-YOU")
    .eq("data", MESSAGING_ENABLED_VALUE)
    .limit(1);
  if (error) {
    console.error("reading I-HELP-YOU contact failed", error);
    return null;
  }
  return (data ?? []).length > 0;
};
