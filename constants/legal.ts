/**
 * The app's legal documents, served as static pages from `public/`.
 *
 * Listed in Profil → Beállítások and linked from the registration flow. One
 * place for the URLs, so a moved document does not have to be found by grep —
 * and so the same document is not called two different things in two screens.
 */
export const TERMS_URL = "https://fifeapp.hu/terms.html";
export const PRIVACY_URL = "https://fifeapp.hu/privacy.html";
export const CSAE_URL = "https://fifeapp.hu/CSAE.html";
/**
 * Public account/data deletion page required by Google Play (and referenced by
 * Apple) for apps with account creation. Must work without installing the app
 * or logging in, so it lives in public/ next to the other static legal pages.
 */
export const DELETE_ACCOUNT_URL = "https://fifeapp.hu/fiok-torlese.html";

export interface LegalDocument {
  label: string;
  url: string;
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  { label: "Felhasználási feltételek", url: TERMS_URL },
  { label: "Adatkezelési tájékoztató", url: PRIVACY_URL },
  { label: "Gyermekvédelmi irányelvek (CSAE)", url: CSAE_URL },
];
