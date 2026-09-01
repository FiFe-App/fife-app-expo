import { supabase } from "@/lib/supabase/supabase";

/**
 * Records "author invited guest" once the guest's profile exists.
 *
 * In the normal flow the row is already there: the inviter's uid travelled
 * into the sign-up metadata as `invited_by` and `handle_new_user` wrote the
 * invitation in the same transaction as the profile. This is the fallback for
 * everything else — a sign-up that carried no metadata, or a row the trigger
 * had to skip — and it is deliberately idempotent: `invitations.guest` is
 * unique, so a second write is ignored rather than duplicating the invite.
 *
 * A failure here is never worth blocking a registration for, so it is logged
 * and reported through the return value instead of thrown.
 */
export async function recordInvitation(
  guest: string,
  author: string,
): Promise<boolean> {
  // Self-invites are rejected by the table's CHECK constraint anyway; stopping
  // here keeps a pointless request (and its error log) off the wire.
  if (!guest || !author || guest === author) return false;

  try {
    const { error } = await supabase
      .from("invitations")
      .upsert({ author, guest }, { onConflict: "guest", ignoreDuplicates: true });

    if (error) {
      console.warn("Could not record the invitation:", error.message);
      return false;
    }

    return true;
  } catch (e) {
    // A rejected request (offline, timeout) must not surface as an unhandled
    // rejection in the middle of the last registration screen.
    console.warn("Could not record the invitation:", e);
    return false;
  }
}
