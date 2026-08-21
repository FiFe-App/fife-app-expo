-- Version gate: lets us stop old clients from running once a new release is
-- out. Two thresholds per platform, both compared against the version the
-- client reports (app.config.js `version`, e.g. "1.0.1"):
--
--   min_version    -- below this the app refuses to run (hard block)
--   latest_version -- below this the app shows a dismissible "update" card
--
-- Nothing is blocked until someone raises `min_version`, so shipping this
-- migration on its own changes nothing for existing installs.

-------------------------------------------------------------------
-- Semver comparison. Postgres compares int arrays element by element,
-- so "1.10.0" > "1.9.9" comes out right, which a text compare gets
-- wrong. Everything is normalised to exactly three components, so
-- "1.2" and "1.2.0" are the same version. Anything unparseable
-- (a pre-release suffix, an empty string, NULL) degrades to zeros
-- rather than raising: a client reporting garbage must not crash the
-- lookup, it just ends up on the "very old" side.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."parse_app_version"("v" "text")
    RETURNS bigint[]
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
  SELECT (
    COALESCE(
      (
        SELECT array_agg(part::bigint ORDER BY ord)
        FROM unnest(
          string_to_array(
            -- "v1.2.3-beta.4" -> "1.2.3"
            regexp_replace(regexp_replace(COALESCE(v, ''), '^[^0-9]*', ''), '[^0-9.].*$', ''),
            '.'
          )
        ) WITH ORDINALITY AS t(part, ord)
        WHERE part ~ '^[0-9]{1,15}$'
      ),
      ARRAY[]::bigint[]
    ) || ARRAY[0, 0, 0]::bigint[]
  )[1:3];
$$;

ALTER FUNCTION "public"."parse_app_version"("v" "text") OWNER TO "postgres";

-------------------------------------------------------------------
-- One row per platform. Admin-curated: no INSERT/UPDATE/DELETE
-- policies, so only the postgres owner / service_role (which bypass
-- RLS) can change the thresholds — from the Supabase SQL editor or a
-- release script.
-------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."app_versions" (
    "platform" "text" PRIMARY KEY CHECK ("platform" IN ('android', 'ios', 'web')),
    "min_version" "text" NOT NULL DEFAULT '0.0.0',
    "latest_version" "text" NOT NULL DEFAULT '0.0.0',
    "update_url" "text",
    "blocked_message" "text",
    "update_message" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."app_versions" OWNER TO "postgres";

ALTER TABLE "public"."app_versions" ENABLE ROW LEVEL SECURITY;

-- Readable by everyone: the gate has to work before login, too.
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."app_versions";
CREATE POLICY "Enable read access for all users" ON "public"."app_versions" FOR SELECT USING (true);

GRANT SELECT ON "public"."app_versions" TO "authenticated";
GRANT SELECT ON "public"."app_versions" TO "anon";

-- A version can never be older than itself, and a `min_version` above
-- `latest_version` would block every client including the newest one.
DO $$
BEGIN
    ALTER TABLE "public"."app_versions"
        ADD CONSTRAINT "app_versions_min_not_above_latest"
        CHECK ("public"."parse_app_version"("min_version") <= "public"."parse_app_version"("latest_version"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

-------------------------------------------------------------------
-- What the client calls on startup. Returns no row for an unknown
-- platform, which the client treats as "ok" — a missing row must
-- never lock anybody out.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."get_app_version_status"("p_platform" "text", "p_version" "text")
    RETURNS TABLE (
        "status" "text",
        "min_version" "text",
        "latest_version" "text",
        "update_url" "text",
        "message" "text"
    )
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  SELECT
    CASE
      WHEN "public"."parse_app_version"(p_version) < "public"."parse_app_version"(v."min_version")
        THEN 'blocked'
      WHEN "public"."parse_app_version"(p_version) < "public"."parse_app_version"(v."latest_version")
        THEN 'update_available'
      ELSE 'ok'
    END,
    v."min_version",
    v."latest_version",
    v."update_url",
    CASE
      WHEN "public"."parse_app_version"(p_version) < "public"."parse_app_version"(v."min_version")
        THEN v."blocked_message"
      ELSE v."update_message"
    END
  FROM "public"."app_versions" v
  WHERE v."platform" = p_platform;
$$;

ALTER FUNCTION "public"."get_app_version_status"("p_platform" "text", "p_version" "text") OWNER TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_app_version_status"("p_platform" "text", "p_version" "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_app_version_status"("p_platform" "text", "p_version" "text") TO "anon";

-------------------------------------------------------------------
-- Seed the current release with nothing blocked. Raising the
-- thresholds is the release-time step, see README.md.
-------------------------------------------------------------------
INSERT INTO "public"."app_versions" ("platform", "min_version", "latest_version", "update_url")
VALUES
    ('android', '0.0.0', '1.0.1', 'https://play.google.com/store/apps/details?id=com.fife.app'),
    ('ios',     '0.0.0', '1.0.1', NULL),
    ('web',     '0.0.0', '1.0.1', 'https://fifeapp.hu')
ON CONFLICT ("platform") DO NOTHING;
