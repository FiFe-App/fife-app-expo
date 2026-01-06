drop trigger if exists "enforce_author_different" on "public"."buzinessRecommendations";

drop trigger if exists "send_notification_on_new_event" on "public"."events";

drop policy "Enable read access for all users" on "public"."buziness";

drop policy "Enable select, insert, update, delete for author" on "public"."buziness";

drop policy "Enable delete for users based on user_id" on "public"."buzinessRecommendations";

drop policy "Enable read access for all users" on "public"."buzinessRecommendations";

drop policy "Enable delete for users based on user_id" on "public"."comments";

drop policy "Enable insert for users based on user_id" on "public"."comments";

drop policy "Enable read access for all users" on "public"."comments";

drop policy "Enable update for users based on email" on "public"."comments";

drop policy "Enable read access for all users" on "public"."contacts";

drop policy "edit if user's" on "public"."contacts";

drop policy "Enable all for authenticated users only" on "public"."eventResponses";

drop policy "Enable read access for all users" on "public"."events";

drop policy "Edit for Author" on "public"."profileRecommendations";

drop policy "Enable read access for all users" on "public"."profileRecommendations";

drop policy "Public profiles are viewable by everyone." on "public"."profiles";

drop policy "Users can insert their own profile." on "public"."profiles";

drop policy "Users can update own profile." on "public"."profiles";

revoke delete on table "public"."buziness" from "anon";

revoke insert on table "public"."buziness" from "anon";

revoke references on table "public"."buziness" from "anon";

revoke select on table "public"."buziness" from "anon";

revoke trigger on table "public"."buziness" from "anon";

revoke truncate on table "public"."buziness" from "anon";

revoke update on table "public"."buziness" from "anon";

revoke delete on table "public"."buziness" from "authenticated";

revoke insert on table "public"."buziness" from "authenticated";

revoke references on table "public"."buziness" from "authenticated";

revoke select on table "public"."buziness" from "authenticated";

revoke trigger on table "public"."buziness" from "authenticated";

revoke truncate on table "public"."buziness" from "authenticated";

revoke update on table "public"."buziness" from "authenticated";

revoke delete on table "public"."buziness" from "service_role";

revoke insert on table "public"."buziness" from "service_role";

revoke references on table "public"."buziness" from "service_role";

revoke select on table "public"."buziness" from "service_role";

revoke trigger on table "public"."buziness" from "service_role";

revoke truncate on table "public"."buziness" from "service_role";

revoke update on table "public"."buziness" from "service_role";

revoke delete on table "public"."buzinessRecommendations" from "anon";

revoke insert on table "public"."buzinessRecommendations" from "anon";

revoke references on table "public"."buzinessRecommendations" from "anon";

revoke select on table "public"."buzinessRecommendations" from "anon";

revoke trigger on table "public"."buzinessRecommendations" from "anon";

revoke truncate on table "public"."buzinessRecommendations" from "anon";

revoke update on table "public"."buzinessRecommendations" from "anon";

revoke delete on table "public"."buzinessRecommendations" from "authenticated";

revoke insert on table "public"."buzinessRecommendations" from "authenticated";

revoke references on table "public"."buzinessRecommendations" from "authenticated";

revoke select on table "public"."buzinessRecommendations" from "authenticated";

revoke trigger on table "public"."buzinessRecommendations" from "authenticated";

revoke truncate on table "public"."buzinessRecommendations" from "authenticated";

revoke update on table "public"."buzinessRecommendations" from "authenticated";

revoke delete on table "public"."buzinessRecommendations" from "service_role";

revoke insert on table "public"."buzinessRecommendations" from "service_role";

revoke references on table "public"."buzinessRecommendations" from "service_role";

revoke select on table "public"."buzinessRecommendations" from "service_role";

revoke trigger on table "public"."buzinessRecommendations" from "service_role";

revoke truncate on table "public"."buzinessRecommendations" from "service_role";

revoke update on table "public"."buzinessRecommendations" from "service_role";

revoke delete on table "public"."comments" from "anon";

revoke insert on table "public"."comments" from "anon";

revoke references on table "public"."comments" from "anon";

revoke select on table "public"."comments" from "anon";

revoke trigger on table "public"."comments" from "anon";

revoke truncate on table "public"."comments" from "anon";

revoke update on table "public"."comments" from "anon";

revoke delete on table "public"."comments" from "authenticated";

revoke insert on table "public"."comments" from "authenticated";

revoke references on table "public"."comments" from "authenticated";

revoke select on table "public"."comments" from "authenticated";

revoke trigger on table "public"."comments" from "authenticated";

revoke truncate on table "public"."comments" from "authenticated";

revoke update on table "public"."comments" from "authenticated";

revoke delete on table "public"."comments" from "service_role";

revoke insert on table "public"."comments" from "service_role";

revoke references on table "public"."comments" from "service_role";

revoke select on table "public"."comments" from "service_role";

revoke trigger on table "public"."comments" from "service_role";

revoke truncate on table "public"."comments" from "service_role";

revoke update on table "public"."comments" from "service_role";

revoke delete on table "public"."contacts" from "anon";

revoke insert on table "public"."contacts" from "anon";

revoke references on table "public"."contacts" from "anon";

revoke select on table "public"."contacts" from "anon";

revoke trigger on table "public"."contacts" from "anon";

revoke truncate on table "public"."contacts" from "anon";

revoke update on table "public"."contacts" from "anon";

revoke delete on table "public"."contacts" from "authenticated";

revoke insert on table "public"."contacts" from "authenticated";

revoke references on table "public"."contacts" from "authenticated";

revoke select on table "public"."contacts" from "authenticated";

revoke trigger on table "public"."contacts" from "authenticated";

revoke truncate on table "public"."contacts" from "authenticated";

revoke update on table "public"."contacts" from "authenticated";

revoke delete on table "public"."contacts" from "service_role";

revoke insert on table "public"."contacts" from "service_role";

revoke references on table "public"."contacts" from "service_role";

revoke select on table "public"."contacts" from "service_role";

revoke trigger on table "public"."contacts" from "service_role";

revoke truncate on table "public"."contacts" from "service_role";

revoke update on table "public"."contacts" from "service_role";

revoke delete on table "public"."eventResponses" from "anon";

revoke insert on table "public"."eventResponses" from "anon";

revoke references on table "public"."eventResponses" from "anon";

revoke select on table "public"."eventResponses" from "anon";

revoke trigger on table "public"."eventResponses" from "anon";

revoke truncate on table "public"."eventResponses" from "anon";

revoke update on table "public"."eventResponses" from "anon";

revoke delete on table "public"."eventResponses" from "authenticated";

revoke insert on table "public"."eventResponses" from "authenticated";

revoke references on table "public"."eventResponses" from "authenticated";

revoke select on table "public"."eventResponses" from "authenticated";

revoke trigger on table "public"."eventResponses" from "authenticated";

revoke truncate on table "public"."eventResponses" from "authenticated";

revoke update on table "public"."eventResponses" from "authenticated";

revoke delete on table "public"."eventResponses" from "service_role";

revoke insert on table "public"."eventResponses" from "service_role";

revoke references on table "public"."eventResponses" from "service_role";

revoke select on table "public"."eventResponses" from "service_role";

revoke trigger on table "public"."eventResponses" from "service_role";

revoke truncate on table "public"."eventResponses" from "service_role";

revoke update on table "public"."eventResponses" from "service_role";

revoke delete on table "public"."events" from "anon";

revoke insert on table "public"."events" from "anon";

revoke references on table "public"."events" from "anon";

revoke select on table "public"."events" from "anon";

revoke trigger on table "public"."events" from "anon";

revoke truncate on table "public"."events" from "anon";

revoke update on table "public"."events" from "anon";

revoke delete on table "public"."events" from "authenticated";

revoke insert on table "public"."events" from "authenticated";

revoke references on table "public"."events" from "authenticated";

revoke select on table "public"."events" from "authenticated";

revoke trigger on table "public"."events" from "authenticated";

revoke truncate on table "public"."events" from "authenticated";

revoke update on table "public"."events" from "authenticated";

revoke delete on table "public"."events" from "service_role";

revoke insert on table "public"."events" from "service_role";

revoke references on table "public"."events" from "service_role";

revoke select on table "public"."events" from "service_role";

revoke trigger on table "public"."events" from "service_role";

revoke truncate on table "public"."events" from "service_role";

revoke update on table "public"."events" from "service_role";

revoke delete on table "public"."messages" from "anon";

revoke insert on table "public"."messages" from "anon";

revoke references on table "public"."messages" from "anon";

revoke select on table "public"."messages" from "anon";

revoke trigger on table "public"."messages" from "anon";

revoke truncate on table "public"."messages" from "anon";

revoke update on table "public"."messages" from "anon";

revoke delete on table "public"."messages" from "authenticated";

revoke insert on table "public"."messages" from "authenticated";

revoke references on table "public"."messages" from "authenticated";

revoke select on table "public"."messages" from "authenticated";

revoke trigger on table "public"."messages" from "authenticated";

revoke truncate on table "public"."messages" from "authenticated";

revoke update on table "public"."messages" from "authenticated";

revoke delete on table "public"."messages" from "service_role";

revoke insert on table "public"."messages" from "service_role";

revoke references on table "public"."messages" from "service_role";

revoke select on table "public"."messages" from "service_role";

revoke trigger on table "public"."messages" from "service_role";

revoke truncate on table "public"."messages" from "service_role";

revoke update on table "public"."messages" from "service_role";

revoke delete on table "public"."posts" from "anon";

revoke insert on table "public"."posts" from "anon";

revoke references on table "public"."posts" from "anon";

revoke select on table "public"."posts" from "anon";

revoke trigger on table "public"."posts" from "anon";

revoke truncate on table "public"."posts" from "anon";

revoke update on table "public"."posts" from "anon";

revoke delete on table "public"."posts" from "authenticated";

revoke insert on table "public"."posts" from "authenticated";

revoke references on table "public"."posts" from "authenticated";

revoke select on table "public"."posts" from "authenticated";

revoke trigger on table "public"."posts" from "authenticated";

revoke truncate on table "public"."posts" from "authenticated";

revoke update on table "public"."posts" from "authenticated";

revoke delete on table "public"."posts" from "service_role";

revoke insert on table "public"."posts" from "service_role";

revoke references on table "public"."posts" from "service_role";

revoke select on table "public"."posts" from "service_role";

revoke trigger on table "public"."posts" from "service_role";

revoke truncate on table "public"."posts" from "service_role";

revoke update on table "public"."posts" from "service_role";

revoke delete on table "public"."profileRecommendations" from "anon";

revoke insert on table "public"."profileRecommendations" from "anon";

revoke references on table "public"."profileRecommendations" from "anon";

revoke select on table "public"."profileRecommendations" from "anon";

revoke trigger on table "public"."profileRecommendations" from "anon";

revoke truncate on table "public"."profileRecommendations" from "anon";

revoke update on table "public"."profileRecommendations" from "anon";

revoke delete on table "public"."profileRecommendations" from "authenticated";

revoke insert on table "public"."profileRecommendations" from "authenticated";

revoke references on table "public"."profileRecommendations" from "authenticated";

revoke select on table "public"."profileRecommendations" from "authenticated";

revoke trigger on table "public"."profileRecommendations" from "authenticated";

revoke truncate on table "public"."profileRecommendations" from "authenticated";

revoke update on table "public"."profileRecommendations" from "authenticated";

revoke delete on table "public"."profileRecommendations" from "service_role";

revoke insert on table "public"."profileRecommendations" from "service_role";

revoke references on table "public"."profileRecommendations" from "service_role";

revoke select on table "public"."profileRecommendations" from "service_role";

revoke trigger on table "public"."profileRecommendations" from "service_role";

revoke truncate on table "public"."profileRecommendations" from "service_role";

revoke update on table "public"."profileRecommendations" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

alter table "public"."buziness" drop constraint "buziness_author_fkey";

alter table "public"."buziness" drop constraint "buziness_author_fkey1";

alter table "public"."buziness" drop constraint "buziness_defaultContact_fkey";

alter table "public"."buzinessRecommendations" drop constraint "buzinessRecommendations_author_fkey";

alter table "public"."buzinessRecommendations" drop constraint "buzinessRecommendations_author_fkey1";

alter table "public"."buzinessRecommendations" drop constraint "buzinessRecommendations_buziness_id_fkey";

-- Drop the unique/index constraint on buziness.id only after dependent FKs are removed
alter table "public"."buziness" drop constraint "buziness_id_key";

alter table "public"."buzinessRecommendations" drop constraint "buzinessRecommendations_id_key";

alter table "public"."buzinessRecommendations" drop constraint "unique_buziness_id";

alter table "public"."comments" drop constraint "comments_author_fkey";

alter table "public"."comments" drop constraint "comments_author_fkey1";

alter table "public"."contacts" drop constraint "contacts_author_fkey";

alter table "public"."eventResponses" drop constraint "eventResponses_event_id_fkey";

alter table "public"."eventResponses" drop constraint "eventResponses_user_fkey";

alter table "public"."eventResponses" drop constraint "event_responses_user_event_unique";

alter table "public"."events" drop constraint "events_author_fkey";

alter table "public"."messages" drop constraint "messages_author_fkey";

alter table "public"."messages" drop constraint "messages_to_fkey";

alter table "public"."posts" drop constraint "posts_author_fkey";

alter table "public"."profileRecommendations" drop constraint "profileRecommendations_author_fkey";

alter table "public"."profileRecommendations" drop constraint "profileRecommendations_author_fkey1";

alter table "public"."profileRecommendations" drop constraint "profileRecommendations_profile_id_fkey";

alter table "public"."profiles" drop constraint "profiles_id_fkey";

alter table "public"."profiles" drop constraint "profiles_username_key";

alter table "public"."profiles" drop constraint "username_length";

drop function if exists "public"."check_author_different"();

drop trigger if exists "on_auth_user_created" on "auth"."users";

drop function if exists "public"."handle_new_user"();

drop function if exists "public"."hybrid_buziness_search"(query_text text, query_embedding vector, lat double precision, long double precision, distance double precision, skip integer, take integer, full_text_weight double precision, semantic_weight double precision, match_threshold double precision, rrf_k integer);

drop function if exists "public"."nearby_buziness"(lat double precision, long double precision, maxdistance double precision, search character varying, take integer, skip integer);

drop function if exists "public"."nearby_posts"(lat double precision, long double precision, search character varying, skip integer);

drop function if exists "public"."newest_buziness"(lat double precision, long double precision, distance double precision, skip integer, take integer, full_text_weight double precision, semantic_weight double precision, match_threshold double precision, rrf_k integer);

drop function if exists "public"."newest_users"(lat double precision, long double precision, distance double precision, skip integer, take integer, full_text_weight double precision, semantic_weight double precision, match_threshold double precision, rrf_k integer);

alter table "public"."buziness" drop constraint "buziness_pkey";

alter table "public"."buzinessRecommendations" drop constraint "buzinessRecommendations_pkey";

alter table "public"."comments" drop constraint "comments_pkey";

alter table "public"."contacts" drop constraint "contacts_pkey";

alter table "public"."eventResponses" drop constraint "eventResponses_pkey";

alter table "public"."events" drop constraint "events_pkey";

alter table "public"."messages" drop constraint "messages_pkey";

alter table "public"."posts" drop constraint "posts_pkey";

alter table "public"."profileRecommendations" drop constraint "profileRecommendations_pkey";

alter table "public"."profiles" drop constraint "profiles_pkey";

drop index if exists "public"."buzinessRecommendations_id_key";

drop index if exists "public"."buzinessRecommendations_pkey";

drop index if exists "public"."buziness_embedding_idx";

drop index if exists "public"."buziness_id_key";

drop index if exists "public"."buziness_pkey";

drop index if exists "public"."comments_key_idx";

drop index if exists "public"."comments_pkey";

drop index if exists "public"."contacts_pkey";

drop index if exists "public"."eventResponses_pkey";

drop index if exists "public"."event_responses_user_event_unique";

drop index if exists "public"."events_pkey";

drop index if exists "public"."ix_memos_content";

drop index if exists "public"."messages_pkey";

drop index if exists "public"."posts_pkey";

drop index if exists "public"."profileRecommendations_pkey";

drop index if exists "public"."profiles_pkey";

drop index if exists "public"."profiles_username_key";

drop index if exists "public"."unique_buziness_id";

drop table "public"."buziness";

drop table "public"."buzinessRecommendations";

drop table "public"."comments";

drop table "public"."contacts";

drop table "public"."eventResponses";

drop table "public"."events";

drop table "public"."messages";

drop table "public"."posts";

drop table "public"."profileRecommendations";

drop table "public"."profiles";

drop type "public"."contact_type";


