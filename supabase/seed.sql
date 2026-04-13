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
        'macos.acos@gmail.com',
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
-- ============================================================
-- Additional users (5 more, password: Password123!)
-- ============================================================
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
        'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'bence@example.com',
        extensions.crypt('Password123!', extensions.gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Bence Toth","avatar_url":"https://picsum.photos/seed/bence/200"}',
        false,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ),
    (
        'f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'anna@example.com',
        extensions.crypt('Password123!', extensions.gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Anna Fekete","avatar_url":"https://picsum.photos/seed/anna/200"}',
        false,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ),
    (
        '11223344-5566-4778-8990-aabbccddee00',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'peter@example.com',
        extensions.crypt('Password123!', extensions.gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Peter Molnar","avatar_url":"https://picsum.photos/seed/peter/200"}',
        false,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ),
    (
        '22334455-6677-4889-9001-bbccddeeff11',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'reka@example.com',
        extensions.crypt('Password123!', extensions.gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Reka Varga","avatar_url":"https://picsum.photos/seed/reka/200"}',
        false,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ),
    (
        '33445566-7788-4990-a112-ccddeeff0022',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'david@example.com',
        extensions.crypt('Password123!', extensions.gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"David Simon","avatar_url":"https://picsum.photos/seed/david/200"}',
        false,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );
-- Additional profiles
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
        'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e',
        'bence',
        'Bence Toth',
        'https://picsum.photos/seed/bence/200',
        'https://bence.example.com',
        NOW(),
        ARRAY ['map'],
        ST_GeogFromText('SRID=4326;POINT(19.0835 47.5005)')
    ),
    (
        'f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f',
        'anna',
        'Anna Fekete',
        'https://picsum.photos/seed/anna/200',
        NULL,
        NOW(),
        ARRAY ['create-buziness','profile'],
        ST_GeogFromText('SRID=4326;POINT(18.9985 47.4970)')
    ),
    (
        '11223344-5566-4778-8990-aabbccddee00',
        'peter',
        'Peter Molnar',
        'https://picsum.photos/seed/peter/200',
        'https://peter.dev',
        NOW(),
        ARRAY ['map','comments'],
        ST_GeogFromText('SRID=4326;POINT(19.0370 47.5400)')
    ),
    (
        '22334455-6677-4889-9001-bbccddeeff11',
        'reka',
        'Reka Varga',
        'https://picsum.photos/seed/reka/200',
        NULL,
        NOW(),
        ARRAY ['create-buziness'],
        ST_GeogFromText('SRID=4326;POINT(19.0780 47.4880)')
    ),
    (
        '33445566-7788-4990-a112-ccddeeff0022',
        'david',
        'David Simon',
        'https://picsum.photos/seed/david/200',
        'https://david.example.com',
        NOW(),
        ARRAY ['map'],
        ST_GeogFromText('SRID=4326;POINT(19.1050 47.5160)')
    );
-- Additional contacts
INSERT INTO public.contacts (id, type, data, title, public, author)
VALUES (
        1005,
        'TEL',
        '+36 20 987 6543',
        'Telefon',
        true,
        'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e'
    ),
    (
        1006,
        'EMAIL',
        'hello@annafekete.hu',
        'E-mail',
        true,
        'f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f'
    ),
    (
        1007,
        'INSTAGRAM',
        'anna.fekete.yoga',
        'Instagram',
        true,
        'f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f'
    ),
    (
        1008,
        'WEB',
        'https://peter.dev',
        'Web',
        true,
        '11223344-5566-4778-8990-aabbccddee00'
    ),
    (
        1009,
        'TEL',
        '+36 70 111 2222',
        'Telefon',
        true,
        '22334455-6677-4889-9001-bbccddeeff11'
    ),
    (
        1010,
        'EMAIL',
        'david@example.com',
        'E-mail',
        true,
        '33445566-7788-4990-a112-ccddeeff0022'
    ),
    (
        1011,
        'FACEBOOK',
        'DavidSimonLanguages',
        'Facebook',
        true,
        '33445566-7788-4990-a112-ccddeeff0022'
    );
-- Additional buziness entries
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
        3001,
        'Anna Jóga Stúdió',
        'Heti jóga és meditáció órák minden szinten.',
        'f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f',
        ARRAY ['https://picsum.photos/seed/yoga1/400','https://picsum.photos/seed/yoga2/400'],
        ST_GeogFromText('SRID=4326;POINT(18.9990 47.4975)'),
        200,
        1006,
        'jóga, meditáció, sport, wellness',
        NOW() - INTERVAL '5 days'
    ),
    (
        3002,
        'Bence Kerékpár Műhely',
        'Kerékpár javítás, szerelés, alkatrész csere.',
        'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e',
        ARRAY ['https://picsum.photos/seed/bike1/400'],
        ST_GeogFromText('SRID=4326;POINT(19.0840 47.5010)'),
        150,
        1005,
        'kerékpár, javítás, bicikli',
        NOW() - INTERVAL '2 days'
    ),
    (
        3003,
        'Péter Könyvesbolt',
        'Antikvár és használt könyvek, helyi szerzők polca.',
        '11223344-5566-4778-8990-aabbccddee00',
        ARRAY ['https://picsum.photos/seed/books1/400','https://picsum.photos/seed/books2/400'],
        ST_GeogFromText('SRID=4326;POINT(19.0380 47.5410)'),
        100,
        1008,
        'könyv, antikvár, irodalom',
        NOW() - INTERVAL '8 days'
    ),
    (
        3004,
        'Réka Galéria',
        'Helyi alkotók képei és szobrászat kiállítása.',
        '22334455-6677-4889-9001-bbccddeeff11',
        ARRAY ['https://picsum.photos/seed/art1/400','https://picsum.photos/seed/art2/400'],
        ST_GeogFromText('SRID=4326;POINT(19.0785 47.4885)'),
        250,
        1009,
        'galéria, művészet, kiállítás',
        NOW() - INTERVAL '4 days'
    ),
    (
        3005,
        'David Nyelviskola',
        'Angol és spanyol oktatás kis csoportokban és egyénileg.',
        '33445566-7788-4990-a112-ccddeeff0022',
        ARRAY ['https://picsum.photos/seed/teach1/400'],
        ST_GeogFromText('SRID=4326;POINT(19.1055 47.5165)'),
        300,
        1010,
        'nyelvtanulás, angol, spanyol, oktatás',
        NOW() - INTERVAL '6 hours'
    );
-- Additional buziness recommendations (author ≠ buziness author)
INSERT INTO public."buzinessRecommendations" (id, author, buziness_id, created_at)
VALUES (
        2104,
        'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e',
        2003,
        NOW() - INTERVAL '3 days'
    ),
    -- bence → Zöld Piac (author: zsofi)
    (
        2105,
        'f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f',
        2001,
        NOW() - INTERVAL '2 days'
    ),
    -- anna → Helyi Pékseg (author: luna)
    (
        2106,
        '11223344-5566-4778-8990-aabbccddee00',
        2002,
        NOW() - INTERVAL '1 day'
    ),
    -- peter → Kávé Sarki (author: marci)
    (
        2107,
        '22334455-6677-4889-9001-bbccddeeff11',
        2005,
        NOW() - INTERVAL '18 hours'
    ),
    -- reka → Futó Klub (author: marci)
    (
        2108,
        '33445566-7788-4990-a112-ccddeeff0022',
        2004,
        NOW() - INTERVAL '8 hours'
    ),
    -- david → Kézműves Műhely (author: luna)
    (
        2109,
        'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
        3001,
        NOW() - INTERVAL '1 day'
    ),
    -- marci → Anna Jóga Stúdió
    (
        2110,
        'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f',
        3002,
        NOW() - INTERVAL '12 hours'
    ),
    -- zsofi → Bence Kerékpár Műhely
    (
        2111,
        'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01',
        3005,
        NOW() - INTERVAL '4 hours'
    ),
    -- luna → David Nyelviskola
    (
        2112,
        'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e',
        3004,
        NOW() - INTERVAL '2 hours'
    ),
    -- bence → Réka Galéria
    (
        2113,
        'd1e2f3a4-b5c6-4d7e-8f90-a1b2c3d4e5f6',
        3003,
        NOW() - INTERVAL '1 hour'
    );
-- tesztfife → Péter Könyvesbol
-- Profile recommendations (pajtások / buddies)
INSERT INTO public."profileRecommendations" (id, author, profile_id, created_at)
VALUES (
        3101,
        'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01',
        'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
        NOW() - INTERVAL '5 days'
    ),
    -- luna → marci
    (
        3102,
        'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
        'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01',
        NOW() - INTERVAL '4 days'
    ),
    -- marci → luna
    (
        3103,
        'c7e8f9a0-1b2c-3d4e-5f60-7a8b9c0d1e2f',
        'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01',
        NOW() - INTERVAL '3 days'
    ),
    -- zsofi → luna
    (
        3104,
        'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e',
        'f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f',
        NOW() - INTERVAL '2 days'
    ),
    -- bence → anna
    (
        3105,
        'f1f2f3f4-f5f6-4f7f-8f9f-0f1f2f3f4f5f',
        'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e',
        NOW() - INTERVAL '2 days'
    ),
    -- anna → bence
    (
        3106,
        '11223344-5566-4778-8990-aabbccddee00',
        '22334455-6677-4889-9001-bbccddeeff11',
        NOW() - INTERVAL '1 day'
    ),
    -- peter → reka
    (
        3107,
        '22334455-6677-4889-9001-bbccddeeff11',
        'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01',
        NOW() - INTERVAL '12 hours'
    ),
    -- reka → luna
    (
        3108,
        '33445566-7788-4990-a112-ccddeeff0022',
        'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
        NOW() - INTERVAL '6 hours'
    );
-- david → marci
-- ============================================================
-- Batch 3: 8 more users, profiles, contacts, buzinesses, recommendations
-- ============================================================
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
        '44556677-8899-4aab-bcc0-ddeeff001133',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'eszter@example.com',
        extensions.crypt('Password123!', extensions.gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Eszter Horvath","avatar_url":"https://picsum.photos/seed/eszter/200"}',
        false,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ),
    (
        '55667788-99aa-4bbc-cdd1-eeff00112244',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'gabor@example.com',
        extensions.crypt('Password123!', extensions.gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Gabor Kiss","avatar_url":"https://picsum.photos/seed/gabor/200"}',
        false,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ),
    (
        '66778899-aabb-4ccd-dee2-ff0011223355',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'nora@example.com',
        extensions.crypt('Password123!', extensions.gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Nora Balogh","avatar_url":"https://picsum.photos/seed/nora/200"}',
        false,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ),
    (
        '7788aabb-bbcc-4dde-eff3-001122334466',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'adam@example.com',
        extensions.crypt('Password123!', extensions.gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Adam Papp","avatar_url":"https://picsum.photos/seed/adam/200"}',
        false,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ),
    (
        '8899bbcc-ccdd-4eef-f004-112233445577',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'klara@example.com',
        extensions.crypt('Password123!', extensions.gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Klara Nemeth","avatar_url":"https://picsum.photos/seed/klara/200"}',
        false,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ),
    (
        '99aaccdd-ddee-4ff0-0115-223344556688',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'tamas@example.com',
        extensions.crypt('Password123!', extensions.gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Tamas Farkas","avatar_url":"https://picsum.photos/seed/tamas/200"}',
        false,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ),
    (
        'aabbddee-eeff-4001-1226-334455667799',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'judit@example.com',
        extensions.crypt('Password123!', extensions.gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Judit Szucs","avatar_url":"https://picsum.photos/seed/judit/200"}',
        false,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ),
    (
        'bbcceeff-ff00-4112-2337-445566778800',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'balazs@example.com',
        extensions.crypt('Password123!', extensions.gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Balazs Orban","avatar_url":"https://picsum.photos/seed/balazs/200"}',
        false,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );
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
        '44556677-8899-4aab-bcc0-ddeeff001133',
        'eszter',
        'Eszter Horvath',
        'https://picsum.photos/seed/eszter/200',
        NULL,
        NOW(),
        ARRAY ['map'],
        ST_GeogFromText('SRID=4326;POINT(19.0210 47.5080)')
    ),
    (
        '55667788-99aa-4bbc-cdd1-eeff00112244',
        'gabor',
        'Gabor Kiss',
        'https://picsum.photos/seed/gabor/200',
        'https://gaborkiss.dev',
        NOW(),
        ARRAY ['create-buziness','profile'],
        ST_GeogFromText('SRID=4326;POINT(19.0650 47.5250)')
    ),
    (
        '66778899-aabb-4ccd-dee2-ff0011223355',
        'nora',
        'Nora Balogh',
        'https://picsum.photos/seed/nora/200',
        NULL,
        NOW(),
        ARRAY ['map','comments'],
        ST_GeogFromText('SRID=4326;POINT(18.9700 47.4850)')
    ),
    (
        '7788aabb-bbcc-4dde-eff3-001122334466',
        'adam',
        'Adam Papp',
        'https://picsum.photos/seed/adam/200',
        NULL,
        NOW(),
        ARRAY ['profile'],
        ST_GeogFromText('SRID=4326;POINT(19.1200 47.4780)')
    ),
    (
        '8899bbcc-ccdd-4eef-f004-112233445577',
        'klara',
        'Klara Nemeth',
        'https://picsum.photos/seed/klara/200',
        'https://klaranemeth.art',
        NOW(),
        ARRAY ['create-buziness'],
        ST_GeogFromText('SRID=4326;POINT(19.0450 47.4600)')
    ),
    (
        '99aaccdd-ddee-4ff0-0115-223344556688',
        'tamas',
        'Tamas Farkas',
        'https://picsum.photos/seed/tamas/200',
        NULL,
        NOW(),
        ARRAY ['map'],
        ST_GeogFromText('SRID=4326;POINT(19.0900 47.5350)')
    ),
    (
        'aabbddee-eeff-4001-1226-334455667799',
        'judit',
        'Judit Szucs',
        'https://picsum.photos/seed/judit/200',
        NULL,
        NOW(),
        ARRAY ['comments','profile'],
        ST_GeogFromText('SRID=4326;POINT(18.9850 47.5120)')
    ),
    (
        'bbcceeff-ff00-4112-2337-445566778800',
        'balazs',
        'Balazs Orban',
        'https://picsum.photos/seed/balazs/200',
        'https://balazs.example.com',
        NOW(),
        ARRAY ['map','create-buziness'],
        ST_GeogFromText('SRID=4326;POINT(19.0580 47.4720)')
    );
-- Contacts for batch 3 users
INSERT INTO public.contacts (id, type, data, title, public, author)
VALUES (
        1012,
        'TEL',
        '+36 30 555 0101',
        'Telefon',
        true,
        '44556677-8899-4aab-bcc0-ddeeff001133'
    ),
    (
        1013,
        'INSTAGRAM',
        'eszter.horvath_',
        'Instagram',
        true,
        '44556677-8899-4aab-bcc0-ddeeff001133'
    ),
    (
        1014,
        'WEB',
        'https://gaborkiss.dev',
        'Web',
        true,
        '55667788-99aa-4bbc-cdd1-eeff00112244'
    ),
    (
        1015,
        'EMAIL',
        'nora@balogh.hu',
        'E-mail',
        true,
        '66778899-aabb-4ccd-dee2-ff0011223355'
    ),
    (
        1016,
        'TEL',
        '+36 20 444 7777',
        'Telefon',
        true,
        '7788aabb-bbcc-4dde-eff3-001122334466'
    ),
    (
        1017,
        'WEB',
        'https://klaranemeth.art',
        'Web',
        true,
        '8899bbcc-ccdd-4eef-f004-112233445577'
    ),
    (
        1018,
        'EMAIL',
        'tamas@farkas.hu',
        'E-mail',
        true,
        '99aaccdd-ddee-4ff0-0115-223344556688'
    ),
    (
        1019,
        'FACEBOOK',
        'JuditSzucsEvents',
        'Facebook',
        true,
        'aabbddee-eeff-4001-1226-334455667799'
    ),
    (
        1020,
        'TEL',
        '+36 70 888 3344',
        'Telefon',
        true,
        'bbcceeff-ff00-4112-2337-445566778800'
    ),
    (
        1021,
        'INSTAGRAM',
        'balazs.orban',
        'Instagram',
        true,
        'bbcceeff-ff00-4112-2337-445566778800'
    );
-- Buziness entries for batch 3
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
        4001,
        'Eszter Masszázs',
        'Svéd és sportmasszázs előjegyzéssel, otthon is.',
        '44556677-8899-4aab-bcc0-ddeeff001133',
        ARRAY ['https://picsum.photos/seed/massage1/400'],
        ST_GeogFromText('SRID=4326;POINT(19.0215 47.5085)'),
        180,
        1012,
        'masszázs, wellness, sport',
        NOW() - INTERVAL '3 days'
    ),
    (
        4002,
        'Gabor IT Tanácsadó',
        'Web fejlesztés és IT tanácsadás kis vállalkozásoknak.',
        '55667788-99aa-4bbc-cdd1-eeff00112244',
        ARRAY ['https://picsum.photos/seed/it1/400','https://picsum.photos/seed/it2/400'],
        ST_GeogFromText('SRID=4326;POINT(19.0655 47.5255)'),
        100,
        1014,
        'webfejlesztés, IT, tanácsadás',
        NOW() - INTERVAL '1 day'
    ),
    (
        4003,
        'Nora Otthoni Sütiző',
        'Rendelésre készült kézműves torták és sütemények.',
        '66778899-aabb-4ccd-dee2-ff0011223355',
        ARRAY ['https://picsum.photos/seed/cake1/400','https://picsum.photos/seed/cake2/400'],
        ST_GeogFromText('SRID=4326;POINT(18.9705 47.4855)'),
        50,
        1015,
        'sütemény, torta, kézműves, rendelés',
        NOW() - INTERVAL '9 days'
    ),
    (
        4004,
        'Klara Festészet',
        'Akvarell festmények és egyedi képek megrendelésre.',
        '8899bbcc-ccdd-4eef-f004-112233445577',
        ARRAY ['https://picsum.photos/seed/paint1/400','https://picsum.photos/seed/paint2/400'],
        ST_GeogFromText('SRID=4326;POINT(19.0455 47.4605)'),
        200,
        1017,
        'festészet, akvarell, művészet, egyedi',
        NOW() - INTERVAL '6 days'
    ),
    (
        4005,
        'Balazs Autószerelő',
        'Személyautók javítása és karbantartása garanciával.',
        'bbcceeff-ff00-4112-2337-445566778800',
        ARRAY ['https://picsum.photos/seed/car1/400'],
        ST_GeogFromText('SRID=4326;POINT(19.0585 47.4725)'),
        500,
        1020,
        'autó, szerelő, javítás, karbantartás',
        NOW() - INTERVAL '11 days'
    );
-- Buziness recommendations for batch 3 (author ≠ buziness author)
INSERT INTO public."buzinessRecommendations" (id, author, buziness_id, created_at)
VALUES (
        2114,
        '55667788-99aa-4bbc-cdd1-eeff00112244',
        4001,
        NOW() - INTERVAL '2 days'
    ),
    -- gabor → Eszter Masszázs
    (
        2115,
        '44556677-8899-4aab-bcc0-ddeeff001133',
        4002,
        NOW() - INTERVAL '6 hours'
    ),
    -- eszter → Gabor IT
    (
        2116,
        '7788aabb-bbcc-4dde-eff3-001122334466',
        4003,
        NOW() - INTERVAL '1 day'
    ),
    -- adam → Nora Sütiző
    (
        2117,
        'aabbddee-eeff-4001-1226-334455667799',
        4003,
        NOW() - INTERVAL '3 hours'
    ),
    -- judit → Nora Sütiző
    (
        2118,
        '99aaccdd-ddee-4ff0-0115-223344556688',
        4004,
        NOW() - INTERVAL '5 hours'
    ),
    -- tamas → Klara Festészet
    (
        2119,
        '66778899-aabb-4ccd-dee2-ff0011223355',
        4005,
        NOW() - INTERVAL '4 hours'
    ),
    -- nora → Balazs Autószerelő
    (
        2120,
        'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01',
        4002,
        NOW() - INTERVAL '2 hours'
    ),
    -- luna → Gabor IT
    (
        2121,
        'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
        4004,
        NOW() - INTERVAL '1 hour'
    ),
    -- marci → Klara Festészet
    (
        2122,
        'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e',
        4003,
        NOW() - INTERVAL '30 minutes'
    ),
    -- bence → Nora Sütiző
    (
        2123,
        '33445566-7788-4990-a112-ccddeeff0022',
        4001,
        NOW() - INTERVAL '15 minutes'
    );
-- david → Eszter Masszázs
-- Profile recommendations for batch 3
INSERT INTO public."profileRecommendations" (id, author, profile_id, created_at)
VALUES (
        3109,
        '44556677-8899-4aab-bcc0-ddeeff001133',
        '55667788-99aa-4bbc-cdd1-eeff00112244',
        NOW() - INTERVAL '3 days'
    ),
    -- eszter → gabor
    (
        3110,
        '55667788-99aa-4bbc-cdd1-eeff00112244',
        '44556677-8899-4aab-bcc0-ddeeff001133',
        NOW() - INTERVAL '3 days'
    ),
    -- gabor → eszter
    (
        3111,
        '66778899-aabb-4ccd-dee2-ff0011223355',
        '8899bbcc-ccdd-4eef-f004-112233445577',
        NOW() - INTERVAL '2 days'
    ),
    -- nora → klara
    (
        3112,
        '8899bbcc-ccdd-4eef-f004-112233445577',
        '66778899-aabb-4ccd-dee2-ff0011223355',
        NOW() - INTERVAL '2 days'
    ),
    -- klara → nora
    (
        3113,
        '99aaccdd-ddee-4ff0-0115-223344556688',
        '7788aabb-bbcc-4dde-eff3-001122334466',
        NOW() - INTERVAL '1 day'
    ),
    -- tamas → adam
    (
        3114,
        'aabbddee-eeff-4001-1226-334455667799',
        'bbcceeff-ff00-4112-2337-445566778800',
        NOW() - INTERVAL '18 hours'
    ),
    -- judit → balazs
    (
        3115,
        'bbcceeff-ff00-4112-2337-445566778800',
        'aabbddee-eeff-4001-1226-334455667799',
        NOW() - INTERVAL '12 hours'
    ),
    -- balazs → judit
    (
        3116,
        '7788aabb-bbcc-4dde-eff3-001122334466',
        '55667788-99aa-4bbc-cdd1-eeff00112244',
        NOW() - INTERVAL '6 hours'
    ),
    -- adam → gabor
    (
        3117,
        'a3f8b9f2-3b1a-4a49-9a27-3e7f0e9d1c01',
        '44556677-8899-4aab-bcc0-ddeeff001133',
        NOW() - INTERVAL '4 hours'
    ),
    -- luna → eszter
    (
        3118,
        'b6d1e2c3-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
        '99aaccdd-ddee-4ff0-0115-223344556688',
        NOW() - INTERVAL '2 hours'
    );
-- marci → tamas
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