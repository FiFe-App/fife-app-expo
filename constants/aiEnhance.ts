/**
 * Copy for the "AI-s megtalálhatóság" setting.
 *
 * The switch appears in three places — biznisz szerkesztés, a keresés
 * finomítása, és a profil beállításai — but it is one global preference
 * (`user_settings.ai_enhance`). Sharing the wording keeps a privacy control
 * from meaning three slightly different things depending on where it is read.
 */
export const AI_ENHANCE_LABEL = "Egyszerűbb keresés és megtalálhatóság";

export const AI_ENHANCE_DESCRIPTION =
  "Példa: \"állat\" keresésre megtalálják/megtalálod a kutyás bizniszedet.\n\nNem mindenki kedvence, ezért rád bízom. " +
  "\nFigyelem! A kereséseid és a bizniszed címe, leírása mentésekor el lesz küldve az OpenAI-nak.";

/** Reminder that the switch is not local to the screen it is shown on. */
export const AI_ENHANCE_GLOBAL_NOTE =
  "Minden bizniszedre és keresésedre érvényes.";

export const AI_ENHANCE_ICON = "briefcase-search-outline";
