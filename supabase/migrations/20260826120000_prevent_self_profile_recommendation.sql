-- buzinessRecommendations already blocks recommending your own biznisz via
-- the check_author_different trigger (needs a trigger there since author and
-- the biznisz's owner live in different tables). profileRecommendations has
-- author and profile_id in the same row, so a CHECK constraint is enough —
-- and unlike the client-side gating (RecommendProfileButton only renders on
-- someone else's profile), this also blocks a direct REST/RPC call.
ALTER TABLE "public"."profileRecommendations"
  ADD CONSTRAINT "profile_recommendations_author_not_self"
  CHECK ("author" <> "profile_id");
