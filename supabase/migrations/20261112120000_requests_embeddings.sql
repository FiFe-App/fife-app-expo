-- Embeddingek a kéréseken, a bizniszek mintájára (create-buziness / business-search).
--
-- 1. A kérés szövegéből a create-request edge function ugyanúgy készít kulcsszó-bővítést
--    (embedding_text) és vektort (embedding), mint a create-buziness a bizniszből. Az "AI-s
--    megtalálhatóság" (user_settings.ai_enhance) kikapcsolva mindkettő NULL marad.
-- 2. Ezeket az oszlopokat csak a service role írja (mint a bizniszeknél, 20260926120000 8.
--    pont): ezért a kliens többé nem szúr be közvetlenül, hanem a create-request függvényt hívja.
--    Az authenticated szerepkör UPDATE joga csak a status és images oszlopra marad (megoldva
--    jelölés, képek csatolása).
-- 3. A requests_feed két új dolgot tud:
--    * szöveges keresésnél szó szerinti + szemantikus pontszám (a lekérdezés vektorát a
--      request-search edge function adja, a business-search módjára);
--    * a "neked" (for_me) rendezésben az ÉRDEKLŐDÉSI KÖRÖK előre kerülnek (is_interest_match),
--      utánuk a bizniszeimhez illeszkedők (is_match), aztán a többi. Rendezés, nem szűrés.

-------------------------------------------------------------------
-- 1. Oszlopok
-------------------------------------------------------------------
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS embedding extensions.vector(512),
  ADD COLUMN IF NOT EXISTS embedding_text text;

CREATE INDEX IF NOT EXISTS requests_embedding_idx
  ON public.requests USING hnsw (embedding extensions.vector_ip_ops);

-------------------------------------------------------------------
-- 2. Jogok: beszúrni csak a create-request (service role) tud; a kliens csak a
--    megoldva-jelölést és a képek csatolását írhatja.
-------------------------------------------------------------------
REVOKE INSERT, UPDATE ON public.requests FROM authenticated;
GRANT UPDATE (status, images) ON public.requests TO authenticated;

-- Aki kikapcsolja az "AI-s megtalálhatóság"-ot, annak a meglévő kérései sem maradhatnak
-- AI-s származtatott adattal. A bizniszeknél ezt az újramentés végzi; a kérést nem lehet
-- szerkeszteni, ezért itt trigger.
CREATE OR REPLACE FUNCTION public.clear_request_embeddings_on_opt_out()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.ai_enhance IS NOT TRUE AND OLD.ai_enhance IS TRUE THEN
    UPDATE public.requests
    SET embedding = NULL, embedding_text = NULL
    WHERE author = NEW.author
      AND (embedding IS NOT NULL OR embedding_text IS NOT NULL);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_settings_clear_request_embeddings ON public.user_settings;
CREATE TRIGGER user_settings_clear_request_embeddings
  AFTER UPDATE OF ai_enhance ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.clear_request_embeddings_on_opt_out();

-------------------------------------------------------------------
-- 3. requests_feed, új szignatúrával (a régit el kell dobni: a CREATE OR REPLACE külön
--    túlterhelést hozna létre).
-------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.requests_feed(text, text, double precision, double precision, integer, integer);

CREATE OR REPLACE FUNCTION public.requests_feed(
  p_scope           text DEFAULT 'all',
  p_query           text DEFAULT NULL,
  p_lat             double precision DEFAULT NULL,
  p_long            double precision DEFAULT NULL,
  p_skip            integer DEFAULT 0,
  p_take            integer DEFAULT 20,
  -- A felhasználó érdeklődési körei (redux state.user.interests); a szerver tisztítja.
  p_interests       text[] DEFAULT NULL,
  -- A keresőszöveg vektora; NULL, ha nincs keresés vagy az AI ki van kapcsolva.
  p_query_embedding extensions.vector DEFAULT NULL,
  -- Ennél nagyobb (szó szerinti + szemantikus) pontszám kell a találathoz.
  p_match_threshold double precision DEFAULT 0.4
)
RETURNS TABLE(
  id                bigint,
  created_at        timestamptz,
  author            uuid,
  author_name       text,
  author_avatar     text,
  title             text,
  description       text,
  tags              text[],
  images            text[],
  lat               double precision,
  long              double precision,
  radius            real,
  status            text,
  solved_at         timestamptz,
  distance          double precision,
  comment_count     integer,
  is_match          boolean,
  is_interest_match boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
  WITH me AS (
    SELECT auth.uid() AS uid,
           CASE WHEN p_lat IS NOT NULL AND p_long IS NOT NULL
                THEN st_point(p_long, p_lat)::geography END AS here
  ),
  -- A keresőszó szavai, a joker karakterek escape-elve. Minden szónak illeszkednie kell.
  q_words AS (
    SELECT '%' || replace(replace(replace(w, '\', '\\'), '%', '\%'), '_', '\_') || '%' AS pat
    FROM regexp_split_to_table(btrim(COALESCE(p_query, '')), '\s+') AS w
    WHERE w <> ''
  ),
  -- A bizniszeim címkéi (szótár normalizált alakja) és vektorai.
  my_tags AS (
    SELECT DISTINCT tg.normalized AS n
    FROM public.buziness b
    JOIN public.buziness_tags bt ON bt.buziness_id = b.id
    JOIN public.tags tg ON tg.id = bt.tag_id
    WHERE b.author = (SELECT uid FROM me)
      AND char_length(tg.normalized) >= 3
  ),
  my_buziness_vectors AS (
    SELECT b.embedding
    FROM public.buziness b
    WHERE b.author = (SELECT uid FROM me) AND b.embedding IS NOT NULL
  ),
  -- Az érdeklődési köreim: tisztítva (trim, normalizálás, duplikátum és üres ki, legfeljebb 20).
  interests AS (
    SELECT DISTINCT n
    FROM (
      SELECT public.normalize_tag(x) AS n
      FROM unnest(COALESCE(p_interests, ARRAY[]::text[])) AS x
      LIMIT 20
    ) c
    WHERE n <> ''
  ),
  -- Az érdeklődési körök előre kiszámolt vektorai a szótárból (embed-tags tölti): kérés-időben
  -- semmilyen felhasználói szöveg nem megy ki az OpenAI-hoz.
  interest_vectors AS (
    SELECT tg.embedding
    FROM public.tags tg
    WHERE tg.embedding IS NOT NULL
      AND tg.normalized IN (SELECT n FROM interests)
  ),
  scored AS (
    SELECT
      r.*,
      p.full_name AS author_name,
      p.avatar_url AS author_avatar,
      CASE WHEN r.location IS NOT NULL AND (SELECT here FROM me) IS NOT NULL
           THEN st_distance(r.location, (SELECT here FROM me)) END AS dist,
      -- Biznisz-illeszkedés: szó szerinti (címke, szó a szövegben) vagy szemantikus.
      (
        EXISTS (
          SELECT 1 FROM my_tags m
          WHERE m.n = ANY (ARRAY(SELECT public.normalize_tag(t) FROM unnest(r.tags) AS t))
             OR strpos(lower(r.title || ' ' || r.description), m.n) > 0
        )
        OR (r.embedding IS NOT NULL AND EXISTS (
          SELECT 1 FROM my_buziness_vectors v WHERE (-(v.embedding <#> r.embedding)) > 0.5
        ))
      ) AS matched,
      -- Érdeklődés-illeszkedés: ugyanaz a két ág az érdeklődési körökre.
      (
        EXISTS (
          SELECT 1 FROM interests i
          WHERE i.n = ANY (ARRAY(SELECT public.normalize_tag(t) FROM unnest(r.tags) AS t))
             OR (char_length(i.n) >= 3 AND strpos(lower(r.title || ' ' || r.description), i.n) > 0)
        )
        OR (r.embedding IS NOT NULL AND EXISTS (
          SELECT 1 FROM interest_vectors v WHERE (-(v.embedding <#> r.embedding)) > 0.4
        ))
      ) AS interest_matched,
      -- Keresési pontszám. Szó szerinti rész: cím/címke 1.0 + leírás 0.5 + embedding_text 0.5,
      -- mindegyik akkor, ha MINDEN szó illeszkedik az adott mezőre; ha a szavak csak mezők közt
      -- szétosztva találhatók meg (pl. az egyik a címben, a másik a leírásban), az 0.5. Plusz a
      -- szemantikus hasonlóság. Keresőszó nélkül 0.
      CASE WHEN EXISTS (SELECT 1 FROM q_words) THEN
        GREATEST(
          (CASE WHEN (SELECT bool_and((r.title || ' ' || array_to_string(r.tags, ' ')) ILIKE w.pat) FROM q_words w)
                THEN 1.0 ELSE 0.0 END)
          + (CASE WHEN (SELECT bool_and(r.description ILIKE w.pat) FROM q_words w)
                  THEN 0.5 ELSE 0.0 END)
          + (CASE WHEN r.embedding_text IS NOT NULL
                    AND (SELECT bool_and(r.embedding_text ILIKE w.pat) FROM q_words w)
                  THEN 0.5 ELSE 0.0 END),
          (CASE WHEN (SELECT bool_and(
                        (r.title || ' ' || array_to_string(r.tags, ' ') || ' ' || r.description
                         || ' ' || COALESCE(r.embedding_text, '')) ILIKE w.pat)
                      FROM q_words w)
                THEN 0.5 ELSE 0.0 END)
        )
        + (CASE WHEN p_query_embedding IS NOT NULL AND r.embedding IS NOT NULL
                THEN GREATEST(-(r.embedding <#> p_query_embedding), 0.0) ELSE 0.0 END)
      ELSE 0.0 END AS score
    FROM public.requests r
    JOIN public.profiles p ON p.id = r.author
    WHERE (SELECT uid FROM me) IS NOT NULL
      AND (r.author = (SELECT uid FROM me)
           OR (public.in_my_world(r.author) AND NOT public.is_blocked_by(r.author)))
      AND CASE p_scope
            WHEN 'for_me' THEN r.status = 'open'
                               AND r.author <> (SELECT uid FROM me)
                               AND (r.location IS NULL
                                    OR (SELECT here FROM me) IS NULL
                                    OR st_dwithin(r.location, (SELECT here FROM me), COALESCE(r.radius, 5000)))
            WHEN 'all'    THEN r.status = 'open'
            WHEN 'mine'   THEN r.author = (SELECT uid FROM me)
            WHEN 'solved' THEN r.status = 'solved'
            ELSE false
          END
  ),
  page AS (
    SELECT s.*
    FROM scored s
    WHERE NOT EXISTS (SELECT 1 FROM q_words) OR s.score > p_match_threshold
    ORDER BY s.score DESC,
             (p_scope = 'for_me' AND s.interest_matched) DESC,
             (p_scope = 'for_me' AND s.matched) DESC,
             CASE WHEN p_scope = 'solved' THEN s.solved_at ELSE s.created_at END DESC,
             s.id DESC
    OFFSET GREATEST(COALESCE(p_skip, 0), 0)
    LIMIT  LEAST(GREATEST(COALESCE(p_take, 20), 1), 100)
  )
  SELECT
    pg.id, pg.created_at, pg.author, pg.author_name, pg.author_avatar,
    pg.title, pg.description, pg.tags, pg.images,
    st_y(pg.location::geometry), st_x(pg.location::geometry), pg.radius,
    pg.status, pg.solved_at, pg.dist,
    -- Csak a visszaadott oldalra számolva, nem az egész táblára.
    (SELECT count(*)::integer FROM public.comments c WHERE c.key = 'request/' || pg.id),
    pg.matched,
    pg.interest_matched
  FROM page pg
  ORDER BY pg.score DESC,
           (p_scope = 'for_me' AND pg.interest_matched) DESC,
           (p_scope = 'for_me' AND pg.matched) DESC,
           CASE WHEN p_scope = 'solved' THEN pg.solved_at ELSE pg.created_at END DESC,
           pg.id DESC
$function$;

REVOKE EXECUTE ON FUNCTION public.requests_feed(text, text, double precision, double precision, integer, integer, text[], extensions.vector, double precision)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.requests_feed(text, text, double precision, double precision, integer, integer, text[], extensions.vector, double precision)
  TO authenticated, service_role;
