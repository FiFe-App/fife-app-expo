// Public unsubscribe endpoint for newsletter emails.
//
// GET  /newsletter-unsubscribe?email=...&token=...  → confirmation page (link click)
// POST /newsletter-unsubscribe?email=...&token=...  → RFC 8058 one-click, from Gmail/Outlook
//
// verify_jwt = false (see config.toml): people click this straight from an
// email client, with no session. The HMAC token in the link is the auth.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { normalizeEmail, verifyUnsubscribeToken } from "../_shared/unsubscribe.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ||
  Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const HOME_URL = "https://fifeapp.hu";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function page(title: string, message: string, status: number): Response {
  return new Response(
    `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:Arial,sans-serif;color:#1e1b16;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fffdf5;border-radius:12px;box-shadow:0 2px 8px rgba(54,48,36,0.08);">
          <tr>
            <td align="center" style="background:#ffedc8;padding:16px;">
              <a href="${HOME_URL}" style="font-size:20px;font-weight:bold;color:#1e1b16;text-decoration:none;">FiFe App</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:32px 24px;">
              <p style="font-size:20px;font-weight:bold;margin:0 0 12px 0;">${title}</p>
              <p style="font-size:16px;line-height:1.6;color:#555555;margin:0 0 24px 0;">${message}</p>
              <a href="${HOME_URL}" style="display:inline-block;padding:12px 28px;background:#df442e;color:#ffffff;font-weight:bold;text-decoration:none;border-radius:12px;">Vissza a FiFe Appra</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const email = normalizeEmail(url.searchParams.get("email") || "");
  const token = url.searchParams.get("token") || "";

  if (!email || !token || !(await verifyUnsubscribeToken(email, token))) {
    console.warn("Invalid unsubscribe token for", email);
    return page(
      "Érvénytelen leiratkozási link",
      "Ez a link hibás vagy lejárt. A leiratkozást a FiFe Appban, a profilod beállításai között is elvégezheted.",
      400,
    );
  }

  if (!supabaseServiceRoleKey) {
    console.error("Missing service role key");
    return page(
      "Hoppá, valami hiba történt",
      "Most nem sikerült leiratkoztatni. Kérlek próbáld meg később.",
      500,
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { error } = await supabase.rpc("newsletter_unsubscribe", { p_email: email });

  if (error) {
    console.error("Unsubscribe failed:", error);
    return page(
      "Hoppá, valami hiba történt",
      "Most nem sikerült leiratkoztatni. Kérlek próbáld meg később.",
      500,
    );
  }

  console.log("Unsubscribed", email);

  // One-click unsubscribe (RFC 8058): the mail client wants a bare 200, not a page.
  if (req.method === "POST") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return page(
    "Sikeresen leiratkoztál",
    `A <strong>${escapeHtml(email)}</strong> címre nem küldünk több hírlevelet. Ha meggondolod magad, a profilod beállításai között bármikor újra feliratkozhatsz.`,
    200,
  );
});
