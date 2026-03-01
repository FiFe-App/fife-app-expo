SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

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

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01', 'authenticated', 'authenticated', 'luna@example.com', '$2a$06$ytpr9ggjIkch/tKhW3PQHeg2RJTudPHVJoQfAtw.Cuwxi669y6nKu', '2026-02-22 22:04:18.434868+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Luna Kovacs", "avatar_url": "https://picsum.photos/seed/luna/200"}', false, '2026-02-22 22:04:18.434868+00', '2026-02-22 22:04:18.434868+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e', 'authenticated', 'authenticated', 'marci@example.com', '$2a$06$B94MzpQ01rCBlz1Mnr326e4tpG2PJe5Fiy4v1WdDVaGSstnSCwGBK', '2026-02-22 22:04:18.434868+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Marci Nagy", "avatar_url": "https://picsum.photos/seed/marci/200"}', false, '2026-02-22 22:04:18.434868+00', '2026-02-22 22:04:18.434868+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f', 'authenticated', 'authenticated', 'zsofi@example.com', '$2a$06$iJaP4nIjx7UTwPq1.2VF.eplOALxnkCIxJJ2lXIditrF7P8vuaQ7O', '2026-02-22 22:04:18.434868+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Zsofi Szabo", "avatar_url": "https://picsum.photos/seed/zsofi/200"}', false, '2026-02-22 22:04:18.434868+00', '2026-02-22 22:04:18.434868+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'd1e2f3a4-b5c6-4d7e-8f90-a1b2c3d4e5f6', 'authenticated', 'authenticated', 'test@fife.hu', '$2a$06$feu7w2wRQ2WPjyFFMiApz.blL1eii8qzBxt9hfDtADihWz3l2HyS2', '2026-02-22 22:04:18.434868+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Teszt Fife", "avatar_url": "https://picsum.photos/seed/teszt/200"}', false, '2026-02-22 22:04:18.434868+00', '2026-02-22 22:04:18.434868+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: email_log; Type: TABLE DATA; Schema: private; Owner: postgres
--



--
-- Data for Name: keys; Type: TABLE DATA; Schema: private; Owner: postgres
--



--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."contacts" ("id", "created_at", "type", "data", "title", "public", "author") VALUES
	(1001, '2026-02-22 22:04:18.434868+00', 'TEL', '+36 30 123 4567', 'Telefon', true, 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01'),
	(1002, '2026-02-22 22:04:18.434868+00', 'EMAIL', 'hello@luna.dev', 'E-mail', true, 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01'),
	(1003, '2026-02-22 22:04:18.434868+00', 'WEB', 'https://luna.dev', 'Web', true, 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01'),
	(1004, '2026-02-22 22:04:18.434868+00', 'EMAIL', 'contact@marci.example.com', 'E-mail', true, 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e'),
	(1005, '2026-02-22 22:04:18.434868+00', 'MESSAGE', 'true', NULL, true, 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e'),
	(1006, '2026-02-22 22:04:24.639396+00', 'MESSAGE', 'enabled', NULL, true, 'd1e2f3a4-b5c6-4d7e-8f90-a1b2c3d4e5f6');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "updated_at", "username", "full_name", "avatar_url", "website", "created_at", "viewed_functions", "location") VALUES
	('a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01', NULL, 'luna', 'Luna Kovacs', 'https://picsum.photos/seed/luna/200', 'https://example-luna.dev', '2026-02-22 22:04:18.434868', '{create-buziness,map}', '0101000020E6100000984C158C4A0A3340D656EC2FBBBF4740'),
	('b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e', NULL, 'marci', 'Marci Nagy', 'https://picsum.photos/seed/marci/200', 'https://marci.example.com', '2026-02-22 22:04:18.434868', '{comments}', '0101000020E6100000508D976E12133340E4839ECDAABF4740'),
	('c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f', NULL, 'zsofi', 'Zsofi Szabo', 'https://picsum.photos/seed/zsofi/200', NULL, '2026-02-22 22:04:18.434868', '{profile}', '0101000020E6100000AE47E17A140E334052B81E85EBC14740'),
	('d1e2f3a4-b5c6-4d7e-8f90-a1b2c3d4e5f6', NULL, 'tesztfife', 'Teszt Fife', 'https://picsum.photos/seed/teszt/200', NULL, '2026-02-22 22:04:18.434868', '{map,comments}', '0101000020E61000000AD7A3703D0A33400000000000C04740');


--
-- Data for Name: buziness; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."buziness" ("id", "created_at", "title", "description", "author", "images", "location", "radius", "defaultContact", "embedding", "embedding_text") VALUES
	(2001, '2026-02-15 22:04:18.434868+00', 'Helyi Pékseg', 'Kovászos kenyér és péksütik minden nap.', 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01', '{https://picsum.photos/seed/bread1/400,https://picsum.photos/seed/bread2/400}', '0101000020E6100000EE7C3F355E0A33402B8716D9CEBF4740', 200, 1001, NULL, 'kovaszos, pékség, kenyér'),
	(2002, '2026-02-19 22:04:18.434868+00', 'Kávé Sarki', 'Specialty kávék és sütemények.', 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e', '{https://picsum.photos/seed/coffee1/400}', '0101000020E6100000E7FBA9F1D20D3340560E2DB29DBF4740', 150, 1004, NULL, 'kávé, kávézó, süti'),
	(2003, '2026-02-12 22:04:18.434868+00', 'Zöld Piac', 'Hétvégi termelői piac helyi árusokkal.', 'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f', '{https://picsum.photos/seed/market/400}', '0101000020E61000008FC2F5285C0F33400000000000C04740', 500, NULL, NULL, 'piac, zöldség, helyi'),
	(2004, '2026-02-21 22:04:18.434868+00', 'Kézműves Műhely', 'Egyedi kerámia és kézműves tárgyak.', 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01', '{https://picsum.photos/seed/craft/400}', '0101000020E610000048E17A14AE0733408FC2F5285CBF4740', 300, 1002, NULL, 'kézműves, kerámia'),
	(2005, '2026-02-22 10:04:18.434868+00', 'Futó Klub', 'Heti közösségi futások a Dunaparton.', 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e', '{https://picsum.photos/seed/run/400}', '0101000020E610000052B81E85EB113340713D0AD7A3C04740', 1000, NULL, NULL, 'sport, futás, közösség');


--
-- Data for Name: buzinessRecommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."buzinessRecommendations" ("id", "created_at", "author", "buziness_id") VALUES
	(2101, '2026-02-20 22:04:18.434868+00', 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e', 2001),
	(2102, '2026-02-21 22:04:18.434868+00', 'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f', 2002),
	(2103, '2026-02-22 17:04:18.434868+00', 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01', 2003);


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."comments" ("id", "created_at", "text", "author", "key", "image") VALUES
	(2301, '2026-02-21 22:04:18.434868+00', 'Nagyon ajánlom ezt a pékséget!', 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e', 'buziness:2001', NULL),
	(2302, '2026-02-22 02:04:18.434868+00', 'A fahéjas csiga kihagyhatatlan.', 'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f', 'buziness:2001', NULL),
	(2303, '2026-02-22 10:04:18.434868+00', 'Ott leszek a csütörtöki futáson!', 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01', 'post:2202', NULL),
	(2304, '2026-02-22 12:04:18.434868+00', 'Lehet viszek plusz vizet a csapatnak.', 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e', 'post:2202', NULL);


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: eventResponses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."messages" ("id", "created_at", "author", "text", "to") VALUES
	(3001, '2026-02-22 20:04:18.434868+00', 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01', 'Szia Marci! Láttam a futó klubos posztod. Mikor lesz a következő futás?', 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e'),
	(3002, '2026-02-22 20:34:18.434868+00', 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e', 'Hej Luna! Csütörtökön 19:00-kor a Duna-parton. Gyere el! 😊', 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01'),
	(3003, '2026-02-22 21:04:18.434868+00', 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01', 'Szuper! Ott leszek. Milyen tempóban szoktatok futni?', 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e'),
	(3004, '2026-02-22 21:34:18.434868+00', 'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f', 'Szia! Nagyon tetszik a kézműves műhelyed! Van valami új kerámia?', 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01'),
	(3005, '2026-02-22 21:49:18.434868+00', 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01', 'Köszönöm Zsofi! Igen, most készültek új bögrék. Hétvégén jöhetsz megnézni őket! 🏺', 'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f');


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."posts" ("id", "created_at", "categories", "text", "author", "location") VALUES
	(2201, '2026-02-19 22:04:18.434868+00', 'help,tech', 'Laptop javítási tipp kellene a XIII. kerületben.', 'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01', '0101000020E61000003333333333133340C3F5285C8FC24740'),
	(2202, '2026-02-21 22:04:18.434868+00', 'sport,run', 'Csütörtök esti futás 19:00, csatlakozik valaki?', 'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e', '0101000020E6100000C520B0726811334054E3A59BC4C04740'),
	(2203, '2026-02-22 16:04:18.434868+00', 'food,market', 'Hol a legjobb termelői piac a hétvégén?', 'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f', '0101000020E6100000022B8716D90E3340E3A59BC420C04740');


--
-- Data for Name: profileRecommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: email_log_id_seq; Type: SEQUENCE SET; Schema: private; Owner: postgres
--

SELECT pg_catalog.setval('"private"."email_log_id_seq"', 1, false);


--
-- Name: keys_id_seq; Type: SEQUENCE SET; Schema: private; Owner: postgres
--

SELECT pg_catalog.setval('"private"."keys_id_seq"', 1, false);


--
-- Name: buzinessRecommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."buzinessRecommendations_id_seq"', 2103, true);


--
-- Name: buziness_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."buziness_id_seq"', 2005, true);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."comments_id_seq"', 2304, true);


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."contacts_id_seq"', 1006, true);


--
-- Name: eventResponses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."eventResponses_id_seq"', 1, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."events_id_seq"', 1, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."messages_id_seq"', 3005, true);


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."posts_id_seq"', 2203, true);


--
-- Name: profileRecommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."profileRecommendations_id_seq"', 1, true);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."reports_id_seq"', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
