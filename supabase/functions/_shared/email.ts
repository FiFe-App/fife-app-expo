// Shared FiFe email templates for transactional notifications.
// All styles are inline — <style> blocks are stripped by Gmail.

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

const SMILEY_URL =
  "https://fifeapp.hu/assets/assets/smiley.ec294625349fa120ceb0817a5315f76b.gif";
const LOGO_URL =
  "https://fifeapp.hu/assets/assets/Logo.ea4a6ed5a7dfa3155fffdbfc5a6f1cae.png";
const HOME_URL = "https://fifeapp.hu";

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const COLOR = {
  headerBg:    "#ffedc8",  // yellow header bar
  bodyBg:      "#fffdf5",  // warm white card
  outerBg:     "#f2f2f2",  // page background
  text:        "#1e1b16",  // primary text
  textMuted:   "#555555",  // secondary text
  textFooter:  "#a1a1a1",  // footer text
  cta:         "#df442e",  // red CTA button
  ctaText:     "#ffffff",
} as const;

// ---------------------------------------------------------------------------
// Copy / i18n
// ---------------------------------------------------------------------------

const COPY = {
  greeting:        (name: string | null) => name ? `Szia ${name}!` : "Szia!",
  goodbye:         "Legyen szép napod! :)",
  sender:          "Kristóf Ákos, a FiFe Apptól",
  pageTitle:       "FiFe értesítés",

  buzinessRec: {
    message:  (authorName: string, buzinessTitle: string) =>
      `<strong>${authorName}</strong> ajánlja a <strong>${buzinessTitle}</strong> bizniszedet!`,
    subtext:  "Nézd meg a bizniszedet, és köszönd meg az ajánlást!",
    cta:      "Biznisz megtekintése",
    ctaUrl:   (id: number | string) => `${HOME_URL}/biznisz/${id}`,
  },

  profileRec: {
    message:  (authorName: string) =>
      `<strong>${authorName}</strong> megbízhatónak jelölt téged!`,
    subtext:  "Nézd meg a profilját, és viszonozd, ha te is megbízol benne.",
    cta:      "Profil megtekintése",
    ctaUrl:   (authorId: string) => `${HOME_URL}/user/${authorId}`,
  },

  comment: {
    message:  (authorName: string, buzinessTitle: string) =>
      `<strong>${authorName}</strong> kommentet írt a <strong>${buzinessTitle}</strong> bizniszedhez!`,
    subtext:  "Nézd meg és válaszolj neki!",
    cta:      "Biznisz megtekintése",
    ctaUrl:   (id: number | string) => `${HOME_URL}/biznisz/${id}`,
  },

  message: {
    message:  (senderName: string) =>
      `<strong>${senderName}</strong> üzenetet küldött neked!`,
    subtext:  (preview: string) => preview ? `„${preview}"` : "Nézd meg és válaszolj neki!",
    cta:      "Válasz",
    ctaUrl:   (senderUid: string) => `${HOME_URL}/user/${senderUid}`,
  },

  newsletter: {
    unsubscribeIntro: "Ezt a levelet azért kaptad, mert feliratkoztál a FiFe hírlevélre.",
    unsubscribe:      "Leiratkozás",
  },
} as const;

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function header(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.headerBg};box-shadow:0 2px 4px rgba(0,0,0,0.06);">
      <tr>
        <td align="center" style="padding:12px 0;">
          <a href="${HOME_URL}" style="text-decoration:none;display:inline-block;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:8px;vertical-align:middle;">
                  <img src="${SMILEY_URL}" alt="FiFe" width="40" height="40" style="display:block;border-radius:6px;" />
                </td>
                <td style="vertical-align:middle;">
                  <img src="${LOGO_URL}" alt="FiFe App" height="30" style="display:block;" />
                </td>
              </tr>
            </table>
          </a>
        </td>
      </tr>
    </table>`;
}

function footer(unsubscribeUrl?: string): string {
  const unsubscribe = unsubscribeUrl
    ? `
          <br/>
          <span style="font-size:12px;">
            ${COPY.newsletter.unsubscribeIntro}<br/>
            <a href="${unsubscribeUrl}" style="color:${COLOR.textFooter};text-decoration:underline;">${COPY.newsletter.unsubscribe}</a>
          </span>`
    : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:24px 0 32px;color:${COLOR.textFooter};font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
          ${COPY.goodbye}<br/>
          ${COPY.sender}<br/>
          <img src="${SMILEY_URL}" alt="FiFe" width="32" height="32" style="display:inline-block;margin-top:8px;" />${unsubscribe}
        </td>
      </tr>
    </table>`;
}

export function ctaButton(label: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
      <tr>
        <td align="center" bgcolor="${COLOR.cta}" style="border-radius:12px;box-shadow:0 2px 4px rgba(54,48,36,0.12);">
          <a href="${url}"
             style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;color:${COLOR.ctaText};text-decoration:none;border-radius:12px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

// ---------------------------------------------------------------------------
// Layout wrapper
// ---------------------------------------------------------------------------

export function layout(
  recipientName: string | null,
  bodyHtml: string,
  options: { unsubscribeUrl?: string; pageTitle?: string } = {},
): string {
  const greeting = COPY.greeting(recipientName);
  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${options.pageTitle ?? COPY.pageTitle}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.outerBg};font-family:Arial,sans-serif;color:${COLOR.text};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.outerBg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${COLOR.bodyBg};border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(54,48,36,0.08);">
          <tr><td>${header()}</td></tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="font-size:22px;font-weight:bold;color:${COLOR.text};margin:0 0 24px 0;">${greeting}</p>
              ${bodyHtml}
            </td>
          </tr>
          <tr><td>${footer(options.unsubscribeUrl)}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Per-event templates
// ---------------------------------------------------------------------------

export function buzinessRecommendationHtml(
  recipientName: string | null,
  authorName: string,
  buzinessTitle: string,
  buzinessId: number | string,
): string {
  const body = `
    <p style="font-size:18px;color:${COLOR.text};margin:0 0 8px 0;">
      ${COPY.buzinessRec.message(authorName, buzinessTitle)}
    </p>
    <p style="font-size:15px;color:${COLOR.textMuted};margin:0 0 24px 0;">
      ${COPY.buzinessRec.subtext}
    </p>
    ${ctaButton(COPY.buzinessRec.cta, COPY.buzinessRec.ctaUrl(buzinessId))}`;
  return layout(recipientName, body);
}

export function profileRecommendationHtml(
  recipientName: string | null,
  authorName: string,
  authorId: string,
): string {
  const body = `
    <p style="font-size:18px;color:${COLOR.text};margin:0 0 8px 0;">
      ${COPY.profileRec.message(authorName)}
    </p>
    <p style="font-size:15px;color:${COLOR.textMuted};margin:0 0 24px 0;">
      ${COPY.profileRec.subtext}
    </p>
    ${ctaButton(COPY.profileRec.cta, COPY.profileRec.ctaUrl(authorId))}`;
  return layout(recipientName, body);
}

export function commentHtml(
  recipientName: string | null,
  authorName: string,
  buzinessTitle: string,
  buzinessId: number | string,
): string {
  const body = `
    <p style="font-size:18px;color:${COLOR.text};margin:0 0 8px 0;">
      ${COPY.comment.message(authorName, buzinessTitle)}
    </p>
    <p style="font-size:15px;color:${COLOR.textMuted};margin:0 0 24px 0;">
      ${COPY.comment.subtext}
    </p>
    ${ctaButton(COPY.comment.cta, COPY.comment.ctaUrl(buzinessId))}`;
  return layout(recipientName, body);
}

export function newsletterHtml(
  recipientName: string | null,
  newsletter: {
    subject: string;
    title?: string | null;
    body: string;
    cta_label?: string | null;
    cta_url?: string | null;
  },
  unsubscribeUrl: string,
): string {
  const heading = newsletter.title || newsletter.subject;
  const cta = newsletter.cta_label && newsletter.cta_url
    ? ctaButton(newsletter.cta_label, newsletter.cta_url)
    : "";
  const body = `
    ${heading ? `<p style="font-size:18px;font-weight:bold;color:${COLOR.text};margin:0 0 12px 0;">${heading}</p>` : ""}
    <div style="font-size:16px;line-height:1.6;color:${COLOR.text};">
      ${newsletter.body}
    </div>
    ${cta}`;
  return layout(recipientName, body, {
    unsubscribeUrl,
    pageTitle: newsletter.subject,
  });
}

export function messageHtml(
  recipientName: string | null,
  senderName: string,
  senderUid: string,
  messagePreview: string,
): string {
  const body = `
    <p style="font-size:18px;color:${COLOR.text};margin:0 0 8px 0;">
      ${COPY.message.message(senderName)}
    </p>
    <p style="font-size:15px;color:${COLOR.textMuted};margin:0 0 24px 0;font-style:italic;">
      ${COPY.message.subtext(messagePreview)}
    </p>
    ${ctaButton(COPY.message.cta, COPY.message.ctaUrl(senderUid))}`;
  return layout(recipientName, body);
}

// ---------------------------------------------------------------------------
// Plain-text alternative
// ---------------------------------------------------------------------------

/**
 * Best-effort text/plain rendering of one of the templates above.
 *
 * Every mail here is built as HTML, and an HTML-only bulk mail with no
 * multipart/alternative part is a well-known spam signal — worth avoiding for
 * something posted to a whole subscriber list at once. Links are kept as
 * "label (url)" so an unsubscribe link survives into the text part.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, url, label) => {
      const text = label.replace(/<[^>]+>/g, "").trim();
      if (!url) return text;
      return text && text !== url ? `${text} (${url})` : url;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6]|table)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
