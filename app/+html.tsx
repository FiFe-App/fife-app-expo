import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

import { SITE_URL } from "@/lib/siteUrl";

const DESCRIPTION =
  "A FiFe App egy közösség, ahol megtalálod a környékbeliek bizniszeit: azt, ki mihez ért, és kihez fordulhatsz, ha segítség kell.";

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="hu">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no"
        />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        {/* Link preview for the app itself. Every URL of the site is served
            this same document, so these are what Facebook, Messenger, WhatsApp
            or Slack show for any fifeapp.hu link. A link to one particular
            biznisz gets its own title and picture instead: the edge function in
            netlify/edge-functions/social-preview.ts swaps these out before the
            HTML leaves the CDN, which is also why they are written here as
            plain tags rather than assembled at runtime. */}
        <title>FiFe App</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:site_name" content="FiFe App" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="FiFe App" />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:locale" content="hu_HU" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FiFe App" />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
