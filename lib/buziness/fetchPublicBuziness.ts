import type { Comment } from "@/components/comments/comments.types";
import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import type { PostgrestError } from "@supabase/supabase-js";

export interface PublicRecommendation extends Tables<"buzinessRecommendations"> {
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

/**
 * What a signed-out visitor sees of a public biznisz.
 *
 * anon has no table access, so the page cannot query buziness, contacts,
 * comments and the rest the way it does for a member. The
 * get_public_buziness function returns all of it in one go, and only for a
 * listing its author made public (see
 * supabase/migrations/20261003120000_revoke_anon_table_access.sql).
 */
export interface PublicBuziness
  extends Omit<Tables<"buziness">, "embedding" | "embedding_text" | "location"> {
  /** Hex EWKB, the same as PostgREST returns for the column. */
  location: string | null;
  profiles: { full_name: string | null; avatar_url: string | null };
  contacts: Tables<"contacts">[];
  recommendations: PublicRecommendation[];
  /** Newest first. */
  comments: Comment[];
}

/** `data` is null when there is no public biznisz under this id. */
export async function fetchPublicBuziness(
  id: number,
): Promise<{ data: PublicBuziness | null; error: PostgrestError | null }> {
  const { data, error } = await supabase.rpc("get_public_buziness", { p_id: id });
  return { data: (data as PublicBuziness | null) ?? null, error };
}
