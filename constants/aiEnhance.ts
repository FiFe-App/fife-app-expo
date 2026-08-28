/**
 * Copy for the "AI-s megtalálhatóság" setting.
 *
 * The switch appears in three places — biznisz szerkesztés, a keresés
 * finomítása, és a profil beállításai — but it is one global preference
 * (`user_settings.ai_enhance`). Sharing the wording keeps a privacy control
 * from meaning three slightly different things depending on where it is read.
 */
export const AI_ENHANCE_LABEL = "AI-s megtalálhatóság";

export const AI_ENHANCE_DESCRIPTION =
  "A bizniszeid szövegét és a kereséseidet egy külső AI szolgáltatás (OpenAI) " +
  "dolgozza fel, hogy pontosabban megtaláljanak. Kikapcsolva csak kulcsszavas " +
  "keresés működik.";

/** Reminder that the switch is not local to the screen it is shown on. */
export const AI_ENHANCE_GLOBAL_NOTE =
  "Minden bizniszedre és keresésedre érvényes.";

export const AI_ENHANCE_ICON = "creation";
