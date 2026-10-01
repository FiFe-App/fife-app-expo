/**
 * The public web address of the app. Every link handed to somebody outside the
 * app — an invite, a shared biznisz, a link preview on Facebook — is built from
 * this, never from the app's own `com.fife.app` scheme: whoever receives it may
 * not have the app at all, and the web build serves the same routes.
 *
 * Both platforms deep-link it back into the app when it is installed (see the
 * associated domains / intent filters in app.config.js).
 */
export const SITE_URL = "https://fifeapp.hu";
