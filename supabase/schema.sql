

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgroonga" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






CREATE SCHEMA IF NOT EXISTS "postgis";


ALTER SCHEMA "postgis" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "public"."contact_type" AS ENUM (
    'TEL',
    'EMAIL',
    'WEB',
    'OTHER',
    'INSTAGRAM',
    'FACEBOOK',
    'PLACE'
);


ALTER TYPE "public"."contact_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_author_different"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if the author of the recommendation is the same as the author of the buziness
    IF EXISTS (
        SELECT 1
        FROM public.buziness
        WHERE id = NEW.buziness_id AND author = NEW.author
    ) THEN
        RAISE EXCEPTION 'Author of the recommendation cannot be the same as the author of the buziness';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_author_different"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hybrid_buziness_search"("query_text" "text", "query_embedding" "extensions"."vector", "lat" double precision, "long" double precision, "distance" double precision, "skip" integer, "take" integer, "full_text_weight" double precision DEFAULT 0, "semantic_weight" double precision DEFAULT 1, "match_threshold" double precision DEFAULT 0.6, "rrf_k" integer DEFAULT 50) RETURNS TABLE("id" bigint, "title" "text", "description" character varying, "author" "uuid", "created_at" timestamp with time zone, "images" "text"[], "location" "extensions"."geography", "recommendations" integer, "lat" double precision, "long" double precision, "distance" double precision, "relevance" double precision, "defaultcontact" bigint)
    LANGUAGE "sql"
    AS $$
  SET search_path TO public; 
  SELECT 
    b.id, b.title, b.description, b.author, b.created_at, b.images, b.location, count(br.id) as recommendations, 
  st_y(location::geometry) as lat,
  st_x(location::geometry) as long,
  st_distance(location, st_point(long, lat)::geography) as distance,
  b.embedding <#> query_embedding as relevance,
  b."defaultContact"
  FROM public.buziness b 
  LEFT OUTER JOIN public."buzinessRecommendations" br
  ON b.id = br.buziness_id
  where 
    case when query_text = '' then true else b.embedding <#> query_embedding < -match_threshold end and    
    case when location = NULL then true else true end
  GROUP BY b.id
  order by case when query_text != '' then (b.embedding <#> query_embedding) end, st_distance(location, st_point(long, lat)::geography) asc
  OFFSET     CASE WHEN skip>=0 THEN skip 
      END ROWS       -- skip 10 rows
  LIMIT CASE WHEN take>=0 THEN take 
      END
$$;


ALTER FUNCTION "public"."hybrid_buziness_search"("query_text" "text", "query_embedding" "extensions"."vector", "lat" double precision, "long" double precision, "distance" double precision, "skip" integer, "take" integer, "full_text_weight" double precision, "semantic_weight" double precision, "match_threshold" double precision, "rrf_k" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."nearby_buziness"("lat" double precision, "long" double precision, "maxdistance" double precision, "search" character varying, "take" integer, "skip" integer) RETURNS TABLE("id" bigint, "title" "text", "description" character varying, "author" "uuid", "created_at" timestamp with time zone, "location" "extensions"."geography", "recommendations" integer, "lat" double precision, "long" double precision, "distance" double precision)
    LANGUAGE "sql"
    AS $$
  select b.id, b.title, b.description, b.author, b.created_at, b.location, 
  count(br.id) as recommendations,
  st_y(location::geometry) as lat,
  st_x(location::geometry) as long,
  st_distance(location, st_point(long, lat)::geography) as distance
  from public.buziness b left outer join public."buzinessRecommendations" br 
  on b.id = br.buziness_id
  where ( search = '' or (search != '' and b.title &@~ search) )
  group by b.id
  order by count(br.id) desc, b.location <-> st_point(long, lat)::geography
  OFFSET     CASE WHEN skip>=0 THEN skip 
      END ROWS       -- skip 10 rows
  LIMIT CASE WHEN take>=0 THEN take 
      END
$$;


ALTER FUNCTION "public"."nearby_buziness"("lat" double precision, "long" double precision, "maxdistance" double precision, "search" character varying, "take" integer, "skip" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."nearby_posts"("lat" double precision, "long" double precision, "search" character varying, "skip" integer) RETURNS TABLE("id" bigint, "categories" character varying, "text" character varying, "author" "uuid", "created_at" timestamp with time zone, "location" "extensions"."geography", "lat" double precision, "long" double precision, "distance" double precision)
    LANGUAGE "sql"
    AS $$
  select id, categories, text, author, created_at, location, 
  st_y(location::geometry) as lat,
  st_x(location::geometry) as long,
  st_distance(location, st_point(long, lat)::geography) as distance
  from public.posts
  where search = '' or (search != '' and categories &@~ search)
  order by location <-> st_point(long, lat)::geography;
$$;


ALTER FUNCTION "public"."nearby_posts"("lat" double precision, "long" double precision, "search" character varying, "skip" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."newest_buziness"("lat" double precision, "long" double precision, "distance" double precision, "skip" integer DEFAULT 0, "take" integer DEFAULT 6, "full_text_weight" double precision DEFAULT 0, "semantic_weight" double precision DEFAULT 1, "match_threshold" double precision DEFAULT 0.8, "rrf_k" integer DEFAULT 50) RETURNS TABLE("id" bigint, "title" "text", "description" character varying, "author" "uuid", "created_at" timestamp with time zone, "images" "text"[], "location" "extensions"."geography", "recommendations" integer, "lat" double precision, "long" double precision, "distance" double precision)
    LANGUAGE "sql"
    AS $$
  SET search_path TO public; 
  SELECT 
    b.id, b.title, b.description, b.author, b.created_at, b.images, b.location, count(br.id) as recommendations, 
  st_y(location::geometry) as lat,
  st_x(location::geometry) as long,
  st_distance(location, st_point(long, lat)::geography) as distance
  FROM public.buziness b 
  LEFT OUTER JOIN public."buzinessRecommendations" br
  ON b.id = br.buziness_id
  where st_distance(location, st_point(long, lat)::geography) < distance
  GROUP BY b.id
  order by b.created_at desc
  OFFSET CASE WHEN skip>=0 THEN skip 
      END ROWS       -- skip 10 rows
  LIMIT CASE WHEN take>=0 THEN take 
      END
$$;


ALTER FUNCTION "public"."newest_buziness"("lat" double precision, "long" double precision, "distance" double precision, "skip" integer, "take" integer, "full_text_weight" double precision, "semantic_weight" double precision, "match_threshold" double precision, "rrf_k" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."newest_users"("lat" double precision, "long" double precision, "distance" double precision, "skip" integer DEFAULT 0, "take" integer DEFAULT 6, "full_text_weight" double precision DEFAULT 0, "semantic_weight" double precision DEFAULT 1, "match_threshold" double precision DEFAULT 0.8, "rrf_k" integer DEFAULT 50) RETURNS TABLE("id" bigint, "title" "text", "description" character varying, "author" "uuid", "created_at" timestamp with time zone, "images" "text"[], "location" "extensions"."geography", "recommendations" integer, "lat" double precision, "long" double precision, "distance" double precision)
    LANGUAGE "sql"
    AS $$
  SET search_path TO public; 
  SELECT 
    b.id, b.title, b.description, b.author, b.created_at, b.images, b.location, count(br.id) as recommendations, 
  st_y(location::geometry) as lat,
  st_x(location::geometry) as long,
  st_distance(location, st_point(long, lat)::geography) as distance
  FROM public.buziness b 
  LEFT OUTER JOIN public."buzinessRecommendations" br
  ON b.id = br.buziness_id
  where st_distance(location, st_point(long, lat)::geography) <= distance
  GROUP BY b.id
  order by b.created_at asc
  OFFSET CASE WHEN skip>=0 THEN skip 
      END ROWS       -- skip 10 rows
  LIMIT CASE WHEN take>=0 THEN take 
      END
$$;


ALTER FUNCTION "public"."newest_users"("lat" double precision, "long" double precision, "distance" double precision, "skip" integer, "take" integer, "full_text_weight" double precision, "semantic_weight" double precision, "match_threshold" double precision, "rrf_k" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "private"."email_log" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "message" character varying,
    "type" "text"
);


ALTER TABLE "private"."email_log" OWNER TO "postgres";


ALTER TABLE "private"."email_log" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "private"."email_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "private"."keys" (
    "id" bigint NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" NOT NULL
);


ALTER TABLE "private"."keys" OWNER TO "postgres";


ALTER TABLE "private"."keys" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "private"."keys_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."buziness" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "description" character varying NOT NULL,
    "author" "uuid" NOT NULL,
    "images" "text"[],
    "location" "extensions"."geography",
    "radius" real,
    "defaultContact" bigint,
    "embedding" "extensions"."vector"(512),
    "embedding_text" character varying
);


ALTER TABLE "public"."buziness" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."buzinessRecommendations" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author" "uuid" NOT NULL,
    "buziness_id" bigint NOT NULL
);


ALTER TABLE "public"."buzinessRecommendations" OWNER TO "postgres";


ALTER TABLE "public"."buzinessRecommendations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."buzinessRecommendations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."buziness" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."buziness_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "text" "text" NOT NULL,
    "author" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "image" "text"
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


ALTER TABLE "public"."comments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."comments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "public"."contact_type" NOT NULL,
    "data" "text" NOT NULL,
    "title" character varying,
    "public" boolean,
    "author" "uuid" NOT NULL
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


ALTER TABLE "public"."contacts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."contacts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."eventResponses" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "value" smallint NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "event_id" bigint NOT NULL
);


ALTER TABLE "public"."eventResponses" OWNER TO "postgres";


ALTER TABLE "public"."eventResponses" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."eventResponses_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "date" timestamp without time zone NOT NULL,
    "duration" "text",
    "locationName" "text" NOT NULL,
    "description" character varying,
    "location" "extensions"."geometry",
    "author" "uuid" NOT NULL
);


ALTER TABLE "public"."events" OWNER TO "postgres";


ALTER TABLE "public"."events" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    "to" "uuid"
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


ALTER TABLE "public"."messages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "categories" character varying NOT NULL,
    "text" character varying NOT NULL,
    "author" "uuid" NOT NULL,
    "location" "extensions"."geography"
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


ALTER TABLE "public"."posts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."posts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profileRecommendations" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL
);


ALTER TABLE "public"."profileRecommendations" OWNER TO "postgres";


COMMENT ON TABLE "public"."profileRecommendations" IS 'pajtások';



ALTER TABLE "public"."profileRecommendations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."profileRecommendations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone,
    "username" "text",
    "full_name" "text" NOT NULL,
    "avatar_url" "text",
    "website" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "viewed_functions" "text"[],
    "location" "extensions"."geography",
    CONSTRAINT "username_length" CHECK (("char_length"("username") >= 3))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE ONLY "private"."email_log"
    ADD CONSTRAINT "email_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "private"."keys"
    ADD CONSTRAINT "keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."buzinessRecommendations"
    ADD CONSTRAINT "buzinessRecommendations_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."buzinessRecommendations"
    ADD CONSTRAINT "buzinessRecommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."buziness"
    ADD CONSTRAINT "buziness_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."buziness"
    ADD CONSTRAINT "buziness_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eventResponses"
    ADD CONSTRAINT "eventResponses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eventResponses"
    ADD CONSTRAINT "event_responses_user_event_unique" UNIQUE ("event_id", "user_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profileRecommendations"
    ADD CONSTRAINT "profileRecommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."buzinessRecommendations"
    ADD CONSTRAINT "unique_buziness_id" UNIQUE ("buziness_id", "author");



CREATE INDEX "buziness_embedding_idx" ON "public"."buziness" USING "hnsw" ("embedding" "extensions"."vector_ip_ops");



CREATE INDEX "comments_key_idx" ON "public"."comments" USING "hash" ("key");



CREATE INDEX "ix_memos_content" ON "public"."buziness" USING "pgroonga" ("title");



CREATE OR REPLACE TRIGGER "enforce_author_different" BEFORE INSERT OR UPDATE ON "public"."buzinessRecommendations" FOR EACH ROW EXECUTE FUNCTION "public"."check_author_different"();



CREATE OR REPLACE TRIGGER "send_notification_on_new_event" AFTER INSERT OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://pdzuvfkkrhtrrrcckwzj.supabase.co/functions/v1/push', 'POST', '{"Content-type":"application/json"}', '{}', '5000');



ALTER TABLE ONLY "private"."email_log"
    ADD CONSTRAINT "email_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."buzinessRecommendations"
    ADD CONSTRAINT "buzinessRecommendations_author_fkey" FOREIGN KEY ("author") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."buzinessRecommendations"
    ADD CONSTRAINT "buzinessRecommendations_author_fkey1" FOREIGN KEY ("author") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."buzinessRecommendations"
    ADD CONSTRAINT "buzinessRecommendations_buziness_id_fkey" FOREIGN KEY ("buziness_id") REFERENCES "public"."buziness"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."buziness"
    ADD CONSTRAINT "buziness_author_fkey" FOREIGN KEY ("author") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."buziness"
    ADD CONSTRAINT "buziness_author_fkey1" FOREIGN KEY ("author") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."buziness"
    ADD CONSTRAINT "buziness_defaultContact_fkey" FOREIGN KEY ("defaultContact") REFERENCES "public"."contacts"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_fkey" FOREIGN KEY ("author") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_fkey1" FOREIGN KEY ("author") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_author_fkey" FOREIGN KEY ("author") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."eventResponses"
    ADD CONSTRAINT "eventResponses_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."eventResponses"
    ADD CONSTRAINT "eventResponses_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_author_fkey" FOREIGN KEY ("author") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_author_fkey" FOREIGN KEY ("author") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_to_fkey" FOREIGN KEY ("to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_fkey" FOREIGN KEY ("author") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profileRecommendations"
    ADD CONSTRAINT "profileRecommendations_author_fkey" FOREIGN KEY ("author") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profileRecommendations"
    ADD CONSTRAINT "profileRecommendations_author_fkey1" FOREIGN KEY ("author") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profileRecommendations"
    ADD CONSTRAINT "profileRecommendations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "private"."email_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Edit for Author" ON "public"."profileRecommendations" USING ((( SELECT "auth"."uid"() AS "uid") = "author")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "author"));



CREATE POLICY "Enable all for authenticated users only" ON "public"."eventResponses" TO "authenticated" USING (true);



CREATE POLICY "Enable delete for users based on user_id" ON "public"."buzinessRecommendations" USING ((( SELECT "auth"."uid"() AS "uid") = "author")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "author"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."comments" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "author"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."comments" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "author"));



CREATE POLICY "Enable read access for all users" ON "public"."buziness" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."buzinessRecommendations" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."contacts" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."profileRecommendations" FOR SELECT TO "authenticated" USING (true);



-- Separate policies for buziness: select, update, delete without contact requirement
CREATE POLICY "Enable select for author" ON "public"."buziness" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "author"));

CREATE POLICY "Enable update for author" ON "public"."buziness" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "author"));

CREATE POLICY "Enable delete for author" ON "public"."buziness" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "author"));

-- Note: INSERT policy removed - buziness creation should only happen through create-buziness edge function



CREATE POLICY "Enable update for users based on email" ON "public"."comments" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uuid") = "author"));



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."buziness" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."buzinessRecommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


-- Separate policies for contacts to prevent deletion of last contact
CREATE POLICY "Enable insert for author" ON "public"."contacts" 
  FOR INSERT 
  TO "authenticated" 
  WITH CHECK ("author" = "auth"."uid"());

CREATE POLICY "Enable update for author" ON "public"."contacts" 
  FOR UPDATE 
  TO "authenticated" 
  USING ("author" = "auth"."uid"())
  WITH CHECK ("author" = "auth"."uid"());

-- Prevent deletion if it's the user's last contact
CREATE POLICY "Enable delete for author with remaining contacts" ON "public"."contacts" 
  FOR DELETE 
  TO "authenticated" 
  USING (
    "author" = "auth"."uid"()
    AND
    (
      SELECT COUNT(*) 
      FROM "public"."contacts" 
      WHERE "contacts"."author" = "auth"."uid"()
      AND "contacts"."data" IS NOT NULL 
      AND "contacts"."data" != ''
    ) > 1
  );



ALTER TABLE "public"."eventResponses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profileRecommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."comments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






























































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."check_author_different"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_author_different"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_author_different"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";






GRANT ALL ON FUNCTION "public"."nearby_buziness"("lat" double precision, "long" double precision, "maxdistance" double precision, "search" character varying, "take" integer, "skip" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."nearby_buziness"("lat" double precision, "long" double precision, "maxdistance" double precision, "search" character varying, "take" integer, "skip" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."nearby_buziness"("lat" double precision, "long" double precision, "maxdistance" double precision, "search" character varying, "take" integer, "skip" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."nearby_posts"("lat" double precision, "long" double precision, "search" character varying, "skip" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."nearby_posts"("lat" double precision, "long" double precision, "search" character varying, "skip" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."nearby_posts"("lat" double precision, "long" double precision, "search" character varying, "skip" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."newest_buziness"("lat" double precision, "long" double precision, "distance" double precision, "skip" integer, "take" integer, "full_text_weight" double precision, "semantic_weight" double precision, "match_threshold" double precision, "rrf_k" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."newest_buziness"("lat" double precision, "long" double precision, "distance" double precision, "skip" integer, "take" integer, "full_text_weight" double precision, "semantic_weight" double precision, "match_threshold" double precision, "rrf_k" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."newest_buziness"("lat" double precision, "long" double precision, "distance" double precision, "skip" integer, "take" integer, "full_text_weight" double precision, "semantic_weight" double precision, "match_threshold" double precision, "rrf_k" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."newest_users"("lat" double precision, "long" double precision, "distance" double precision, "skip" integer, "take" integer, "full_text_weight" double precision, "semantic_weight" double precision, "match_threshold" double precision, "rrf_k" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."newest_users"("lat" double precision, "long" double precision, "distance" double precision, "skip" integer, "take" integer, "full_text_weight" double precision, "semantic_weight" double precision, "match_threshold" double precision, "rrf_k" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."newest_users"("lat" double precision, "long" double precision, "distance" double precision, "skip" integer, "take" integer, "full_text_weight" double precision, "semantic_weight" double precision, "match_threshold" double precision, "rrf_k" integer) TO "service_role";


















































































































GRANT ALL ON TABLE "public"."buziness" TO "anon";
GRANT ALL ON TABLE "public"."buziness" TO "authenticated";
GRANT ALL ON TABLE "public"."buziness" TO "service_role";



GRANT ALL ON TABLE "public"."buzinessRecommendations" TO "anon";
GRANT ALL ON TABLE "public"."buzinessRecommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."buzinessRecommendations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."buzinessRecommendations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."buzinessRecommendations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."buzinessRecommendations_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."buziness_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."buziness_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."buziness_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."contacts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."contacts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."contacts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."eventResponses" TO "anon";
GRANT ALL ON TABLE "public"."eventResponses" TO "authenticated";
GRANT ALL ON TABLE "public"."eventResponses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."eventResponses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."eventResponses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."eventResponses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profileRecommendations" TO "anon";
GRANT ALL ON TABLE "public"."profileRecommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."profileRecommendations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profileRecommendations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profileRecommendations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profileRecommendations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























