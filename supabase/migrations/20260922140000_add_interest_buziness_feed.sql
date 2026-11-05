-- A Közösség oldal (/home) kezdeti biznisz listája az érdeklődési körök szerint.
--
-- Eddig ez egy sima "created_at DESC" lista volt, mindenkinek ugyanaz
-- (supabase/functions/business-search/index.ts, a "nincs keresőszó" ág). Ez a függvény
-- ugyanazt adja vissza, csak egy extra rendezési kulccsal: a felhasználó érdeklődési
-- köreire illeszkedő bizniszek kerülnek előre.
--
-- MIÉRT RENDEZÉS ÉS NEM SZŰRÉS
-- A hatás a gyakorlatban szűrés — amíg van illeszkedő, addig csak azok jönnek —, de
-- egyetlen determinisztikus ORDER BY-jal valósul meg. Ez két dolgot ad ingyen: a lista
-- soha nem ürül ki (a találatok után folytatódik a többivel), és a skip-alapú lapozás
-- (hooks/useNearbyBuzinesses.ts) nem duplikál és nem ejt sorokat, mert nincs két külön
-- lapozási mód, amit a kliensnek vezérelnie kellene.
--
-- MIÉRT CÍMKE <-> CÍMKE A SZEMANTIKUS ÁG
-- Kézenfekvő lenne a public.buziness.embedding-hez mérni az érdeklődési köröket, de az
-- hibás eredményt adna. Azt a vektort a create-buziness a biznisz nevéből, az ÖSSZES
-- címkéjéből és a leírásából állítja elő, egyetlen centroidba olvasztva (index.ts:164).
-- Egy "kertészet + bőrdíszműves + autószerelő" biznisz vektora egyik címkéjéhez sincs
-- közel, így a címkék vagyolása ezen a vektoron ÉS-sé torzulna: csak az a biznisz lenne
-- találat, ami az érdeklődési körök EGYÜTTES jelentéséhez hasonlít.
--
-- Ezért mindkét oldalon a public.tags.embedding-et használjuk, és a biznisz saját
-- címkéihez mérünk a public.buziness_tags kapcsolótáblán át. Egy biznisz akkor találat,
-- ha BÁRMELYIK címkéje hasonlít BÁRMELYIK érdeklődési körre — ez a valódi vagyolás.
--
-- Mellékhaszon: ezen az úton egyetlen felhasználói szöveg sem megy ki az OpenAI-hoz,
-- mert minden vektor előre ki van számolva a tags táblában (supabase/functions/embed-tags).
-- Az ai_enhance privacy-flag így erre az ágra nem is vonatkozik.

CREATE OR REPLACE FUNCTION public.interest_buziness_feed(
  p_interests text[],
  p_semantic boolean DEFAULT true,
  p_match_threshold double precision DEFAULT 0.6,
  p_ingyen boolean DEFAULT false,
  p_bad_boy boolean DEFAULT false,
  p_skip integer DEFAULT 0,
  p_take integer DEFAULT 20
)
RETURNS TABLE(
  id bigint,
  title text,
  description character varying,
  author uuid,
  created_at timestamp with time zone,
  images text[],
  location extensions.geography,
  radius real,
  recommendations integer,
  lat double precision,
  long double precision,
  distance double precision,
  defaultcontact bigint,
  ingyen boolean,
  is_match boolean
)
LANGUAGE sql
-- extensions is on the path because this leans on three of them: pgroonga's &@~,
-- pgvector's <#> and PostGIS's st_x/st_y.
SET search_path = public, extensions
AS $function$
  WITH q AS (
    -- The pgroonga query, ORed across the tags. ESCAPING IS load-bearing: the tags are
    -- user input and pgroonga's query language has operators (OR, -, parentheses,
    -- quotes). Each tag is wrapped in quotes with its own quotes and backslashes
    -- escaped, so its contents can never be read as syntax. NULL when there are no
    -- usable tags, which makes the literal half below constant-false.
    SELECT string_agg(
             '"' || replace(replace(t, '\', '\\'), '"', '\"') || '"',
             ' OR '
           ) AS literal
    FROM unnest(COALESCE(p_interests, ARRAY[]::text[])) AS t
    WHERE btrim(t) <> ''
  ),
  interest AS (
    -- The interest tags' own vectors, straight out of the dictionary. Nothing is
    -- embedded at request time; embed-tags fills these in ahead of us.
    SELECT tg.id, tg.embedding
    FROM public.tags tg
    WHERE tg.normalized = ANY (
      SELECT public.normalize_tag(x)
      FROM unnest(COALESCE(p_interests, ARRAY[]::text[])) AS x
    )
  ),
  scored AS (
    SELECT
      b.id, b.title, b.description, b.author, b.created_at, b.images, b.location,
      b.radius,
      count(br.id)::integer AS recommendations,
      st_y(b.location::geometry) AS blat,
      st_x(b.location::geometry) AS blong,
      b."defaultContact",
      b.ingyen,
      (
        -- Literal half: the tag appears in the title (pgroonga index ix_memos_content).
        ((SELECT literal FROM q) IS NOT NULL AND b.title &@~ (SELECT literal FROM q))
        OR
        -- Semantic half: ANY of this listing's own tags is close to ANY interest tag.
        -- Tag against tag, never against buziness.embedding — that column blends the
        -- name, every tag and the description into one vector, on which ORing the tags
        -- would collapse into ANDing them.
        (p_semantic AND EXISTS (
          SELECT 1
          FROM public.buziness_tags bt
          JOIN public.tags btag ON btag.id = bt.tag_id
          CROSS JOIN interest i
          WHERE bt.buziness_id = b.id
            AND btag.embedding IS NOT NULL
            AND i.embedding IS NOT NULL
            AND (-(btag.embedding <#> i.embedding)) > p_match_threshold
        ))
      ) AS matched
    FROM public.buziness b
    JOIN public.profiles p ON p.id = b.author AND p.bad_boy = p_bad_boy
    LEFT OUTER JOIN public."buzinessRecommendations" br ON b.id = br.buziness_id
    WHERE (NOT p_ingyen OR b.ingyen = true)
    GROUP BY b.id
  )
  SELECT
    s.id, s.title, s.description, s.author, s.created_at, s.images, s.location,
    s.radius, s.recommendations, s.blat, s.blong,
    NULL::double precision AS distance,
    s."defaultContact",
    s.ingyen,
    s.matched
  FROM scored s
  -- One fully deterministic ordering. With no interests `matched` is false everywhere,
  -- so this is exactly the "created_at DESC, id DESC" the listing had before.
  ORDER BY s.matched DESC, s.created_at DESC, s.id DESC
  OFFSET GREATEST(COALESCE(p_skip, 0), 0)
  LIMIT  LEAST(GREATEST(COALESCE(p_take, 20), 1), 100)
$function$;

-- Csak a business-search edge function hívja, service role-lal — ahogy a "nincs keresőszó"
-- ág eddig is service role klienssel futott.
REVOKE EXECUTE ON FUNCTION public.interest_buziness_feed(text[], boolean, double precision, boolean, boolean, integer, integer) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.interest_buziness_feed(text[], boolean, double precision, boolean, boolean, integer, integer) TO service_role;
