-- Example seed for FiFe (public schema only)
-- Safe to run locally; starts by disabling triggers (FKs/RLS) for inserts
SET session_replication_role = replica;
-- Create auth users for demo profiles (password: Password123!)
-- Uses pgcrypto from extensions schema for bcrypt
INSERT INTO auth.users (
		id,
		instance_id,
		aud,
		role,
		email,
		encrypted_password,
		email_confirmed_at,
		raw_app_meta_data,
		raw_user_meta_data,
		is_super_admin,
		created_at,
		updated_at,
		confirmation_token,
		recovery_token,
		email_change_token_new,
		email_change
	)
VALUES (
		'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01',
		'00000000-0000-0000-0000-000000000000',
		'authenticated',
		'authenticated',
		'luna@example.com',
		extensions.crypt('Password123!', extensions.gen_salt('bf')),
		NOW(),
		'{"provider":"email","providers":["email"]}',
		'{"full_name":"Luna Kovacs","avatar_url":"https://picsum.photos/seed/luna/200"}',
		false,
		NOW(),
		NOW(),
		'',
		'',
		'',
		''
	),
	(
		'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
		'00000000-0000-0000-0000-000000000000',
		'authenticated',
		'authenticated',
		'marci@example.com',
		extensions.crypt('Password123!', extensions.gen_salt('bf')),
		NOW(),
		'{"provider":"email","providers":["email"]}',
		'{"full_name":"Marci Nagy","avatar_url":"https://picsum.photos/seed/marci/200"}',
		false,
		NOW(),
		NOW(),
		'',
		'',
		'',
		''
	),
	(
		'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f',
		'00000000-0000-0000-0000-000000000000',
		'authenticated',
		'authenticated',
		'zsofi@example.com',
		extensions.crypt('Password123!', extensions.gen_salt('bf')),
		NOW(),
		'{"provider":"email","providers":["email"]}',
		'{"full_name":"Zsofi Szabo","avatar_url":"https://picsum.photos/seed/zsofi/200"}',
		false,
		NOW(),
		NOW(),
		'',
		'',
		'',
		''
	),
	(
		'd1e2f3a4-b5c6-4d7e-8f90-a1b2c3d4e5f6',
		'00000000-0000-0000-0000-000000000000',
		'authenticated',
		'authenticated',
		'test@fife.hu',
		extensions.crypt('fifewok42', extensions.gen_salt('bf')),
		NOW(),
		'{"provider":"email","providers":["email"]}',
		'{"full_name":"Teszt Fife","avatar_url":"https://picsum.photos/seed/teszt/200"}',
		false,
		NOW(),
		NOW(),
		'',
		'',
		'',
		''
	);
-- Optional cleanup (uncomment to wipe existing data before seeding)
-- TRUNCATE TABLE
--   public."profileRecommendations",
--   public."eventResponses",
--   public."events",
--   public."comments",
--   public."posts",
--   public."buzinessRecommendations",
--   public."buziness",
--   public."contacts",
--   public."profiles"
-- RESTART IDENTITY CASCADE;
-- Random, example UUIDs for demo users (also used as authors)
-- Note: profiles.id normally references auth.users.id, but triggers are disabled for this seed.
INSERT INTO public.profiles (
		id,
		username,
		full_name,
		avatar_url,
		website,
		created_at,
		viewed_functions,
		location
	)
VALUES (
		'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01',
		'luna',
		'Luna Kovacs',
		'https://picsum.photos/seed/luna/200',
		'https://example-luna.dev',
		NOW(),
		ARRAY ['create-buziness','map'],
		ST_GeogFromText('SRID=4326;POINT(19.0402 47.4979)')
	),
	(
		'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
		'marci',
		'Marci Nagy',
		'https://picsum.photos/seed/marci/200',
		'https://marci.example.com',
		NOW(),
		ARRAY ['comments'],
		ST_GeogFromText('SRID=4326;POINT(19.0745 47.4974)')
	),
	(
		'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f',
		'zsofi',
		'Zsofi Szabo',
		'https://picsum.photos/seed/zsofi/200',
		NULL,
		NOW(),
		ARRAY ['profile'],
		ST_GeogFromText('SRID=4326;POINT(19.0550 47.5150)')
	),
	(
		'd1e2f3a4-b5c6-4d7e-8f90-a1b2c3d4e5f6',
		'tesztfife',
		'Teszt Fife',
		'https://picsum.photos/seed/teszt/200',
		NULL,
		NOW(),
		ARRAY ['map','comments'],
		ST_GeogFromText('SRID=4326;POINT(19.0400 47.5000)')
	);
-- Contacts (linked to authors via the same UUIDs as profiles)
INSERT INTO public.contacts (id, type, data, title, public, author)
VALUES (
		1001,
		'TEL',
		'+36 30 123 4567',
		'Telefon',
		true,
		'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01'
	),
	(
		1002,
		'EMAIL',
		'hello@luna.dev',
		'E-mail',
		true,
		'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01'
	),
	(
		1003,
		'WEB',
		'https://luna.dev',
		'Web',
		true,
		'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01'
	),
	(
		1004,
		'EMAIL',
		'contact@marci.example.com',
		'E-mail',
		true,
		'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e'
	);
-- Buziness entries (geography; images are text[]). embedding left NULL intentionally
INSERT INTO public.buziness (
		id,
		title,
		description,
		author,
		images,
		location,
		radius,
		"defaultContact",
		embedding_text,
		created_at
	)
VALUES (
		2001,
		'Helyi Pékseg',
		'Kovászos kenyér és péksütik minden nap.',
		'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01',
		ARRAY ['https://picsum.photos/seed/bread1/400','https://picsum.photos/seed/bread2/400'],
		ST_GeogFromText('SRID=4326;POINT(19.0405 47.4985)'),
		200,
		1001,
		'kovaszos, pékség, kenyér',
		NOW() - INTERVAL '7 days'
	),
	(
		2002,
		'Kávé Sarki',
		'Specialty kávék és sütemények.',
		'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
		ARRAY ['https://picsum.photos/seed/coffee1/400'],
		ST_GeogFromText('SRID=4326;POINT(19.0540 47.4970)'),
		150,
		1004,
		'kávé, kávézó, süti',
		NOW() - INTERVAL '3 days'
	),
	(
		2003,
		'Zöld Piac',
		'Hétvégi termelői piac helyi árusokkal.',
		'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f',
		ARRAY ['https://picsum.photos/seed/market/400'],
		ST_GeogFromText('SRID=4326;POINT(19.0600 47.5000)'),
		500,
		NULL,
		'piac, zöldség, helyi',
		NOW() - INTERVAL '10 days'
	),
	(
		2004,
		'Kézműves Műhely',
		'Egyedi kerámia és kézműves tárgyak.',
		'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01',
		ARRAY ['https://picsum.photos/seed/craft/400'],
		ST_GeogFromText('SRID=4326;POINT(19.0300 47.4950)'),
		300,
		1002,
		'kézműves, kerámia',
		NOW() - INTERVAL '1 day'
	),
	(
		2005,
		'Futó Klub',
		'Heti közösségi futások a Dunaparton.',
		'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
		ARRAY ['https://picsum.photos/seed/run/400'],
		ST_GeogFromText('SRID=4326;POINT(19.0700 47.5050)'),
		1000,
		NULL,
		'sport, futás, közösség',
		NOW() - INTERVAL '12 hours'
	);
-- Buziness recommendations (keep authors different from buziness author)
INSERT INTO public."buzinessRecommendations" (id, author, buziness_id, created_at)
VALUES (
		2101,
		'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
		2001,
		NOW() - INTERVAL '2 days'
	),
	(
		2102,
		'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f',
		2002,
		NOW() - INTERVAL '1 day'
	),
	(
		2103,
		'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01',
		2003,
		NOW() - INTERVAL '5 hours'
	);
-- Posts (geography)
INSERT INTO public.posts (
		id,
		categories,
		text,
		author,
		location,
		created_at
	)
VALUES (
		2201,
		'help,tech',
		'Laptop javítási tipp kellene a XIII. kerületben.',
		'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01',
		ST_GeogFromText('SRID=4326;POINT(19.0750 47.5200)'),
		NOW() - INTERVAL '3 days'
	),
	(
		2202,
		'sport,run',
		'Csütörtök esti futás 19:00, csatlakozik valaki?',
		'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
		ST_GeogFromText('SRID=4326;POINT(19.0680 47.5060)'),
		NOW() - INTERVAL '1 day'
	),
	(
		2203,
		'food,market',
		'Hol a legjobb termelői piac a hétvégén?',
		'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f',
		ST_GeogFromText('SRID=4326;POINT(19.0580 47.5010)'),
		NOW() - INTERVAL '6 hours'
	);
-- Comments (free-form key for threading, e.g., "buziness:2001" or "post:2202")
INSERT INTO public.comments (id, text, author, key, image, created_at)
VALUES (
		2301,
		'Nagyon ajánlom ezt a pékséget!',
		'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
		'buziness:2001',
		NULL,
		NOW() - INTERVAL '1 day'
	),
	(
		2302,
		'A fahéjas csiga kihagyhatatlan.',
		'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f',
		'buziness:2001',
		NULL,
		NOW() - INTERVAL '20 hours'
	),
	(
		2303,
		'Ott leszek a csütörtöki futáson!',
		'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01',
		'post:2202',
		NULL,
		NOW() - INTERVAL '12 hours'
	),
	(
		2304,
		'Lehet viszek plusz vizet a csapatnak.',
		'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
		'post:2202',
		NULL,
		NOW() - INTERVAL '10 hours'
	);
-- Keep sequences in sync with inserted IDs
SELECT setval(
		'public.buziness_id_seq',
		(
			SELECT COALESCE(MAX(id), 1)
			FROM public.buziness
		)
	);
SELECT setval(
		'public."buzinessRecommendations_id_seq"',
		(
			SELECT COALESCE(MAX(id), 1)
			FROM public."buzinessRecommendations"
		)
	);
SELECT setval(
		'public.comments_id_seq',
		(
			SELECT COALESCE(MAX(id), 1)
			FROM public.comments
		)
	);
SELECT setval(
		'public.contacts_id_seq',
		(
			SELECT COALESCE(MAX(id), 1)
			FROM public.contacts
		)
	);
SELECT setval(
		'public."eventResponses_id_seq"',
		(
			SELECT COALESCE(MAX(id), 1)
			FROM public."eventResponses"
		)
	);
SELECT setval(
		'public.events_id_seq',
		(
			SELECT COALESCE(MAX(id), 1)
			FROM public.events
		)
	);
SELECT setval(
		'public.posts_id_seq',
		(
			SELECT COALESCE(MAX(id), 1)
			FROM public.posts
		)
	);
SELECT setval(
		'public."profileRecommendations_id_seq"',
		(
			SELECT COALESCE(MAX(id), 1)
			FROM public."profileRecommendations"
		)
	);
-- Done. Re-enable triggers
SET session_replication_role = DEFAULT;