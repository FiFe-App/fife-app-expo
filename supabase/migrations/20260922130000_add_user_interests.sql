-- Érdeklődési körök a felhasználón.
--
-- Ugyanolyan alakban tároljuk, ahogy a biznisz a címkéit adja meg: szöveglista. A
-- public.user_settings-be kerül és nem a public.profiles-ba, két okból:
--
--   1. Privát adat. Azt, hogy ki mi iránt érdeklődik, ma semmi nem mutatja meg másnak;
--      a user_settings RLS-e eleve csak a saját sorhoz enged (20260817120000).
--   2. A user_settings TÁBLASZINTŰ GRANT-tal dolgozik, tehát egy új oszlop automatikusan
--      olvasható a tulajdonosának. A profiles ezzel szemben oszlopszintű GRANT-okkal él
--      (20260304120000_make_profile_location_private.sql), ahol egy új oszlopot külön fel
--      kellene venni a listára — ezt a lépést már egyszer elfelejtettük
--      (20260427130000_fix_profiles_select_grant.sql).
--
-- FONTOS: ez az oszlop NINCS titkosítva, szemben a mantra/tasks/previousSearches mezőkkel,
-- amiket a kliens az encrypted_data blobba rejt. Azért nem lehet, mert a szerver olvassa:
-- ebből épül a Közösség oldal feedje (public.interest_buziness_feed). Tudatos döntés —
-- címkék, nem szabadszöveg, és a hooks/useUserSettings.ts kommentje is rögzíti.
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.user_settings.interests IS
  'Érdeklődési körök címkeként. Szándékosan titkosítatlan: a szerver olvassa a feedhez.';

-------------------------------------------------------------------
-- Az érdeklődési körök is beleszámítanak a címkék használati számlálójába, és ugyanúgy
-- triggerből könyvelünk, mint a biznisz oldalon — a kliens sima upsertet küld
-- (hooks/useUserSettings.ts), nem külön RPC-t, így ez az egyetlen pont, amit nem lehet
-- megkerülni.
--
-- Az "UPDATE OF interests" akkor is tüzel, ha az érték nem változott, de a
-- sync_interest_tags idempotens, tehát ilyenkor nem mozdul a számláló.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_interest_tags_from_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.sync_interest_tags(NEW.author, NEW.interests);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_settings_sync_interest_tags ON public.user_settings;
CREATE TRIGGER user_settings_sync_interest_tags
  AFTER INSERT OR UPDATE OF interests ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.sync_interest_tags_from_settings();
