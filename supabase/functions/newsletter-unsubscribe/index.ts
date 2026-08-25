// Public unsubscribe endpoint for newsletter emails.
//
// GET  /newsletter-unsubscribe?email=...&token=...  → redirects to fifeapp.hu (link click)
// POST /newsletter-unsubscribe?email=...&token=...  → RFC 8058 one-click, from Gmail/Outlook
//
// verify_jwt = false (see config.toml): people click this straight from an
// email client, with no session. The HMAC token in the link is the auth.
//
// GET redirects to a page on fifeapp.hu instead of rendering HTML directly:
// Supabase's *.supabase.co gateway rewrites an edge function's text/html
// responses to text/plain (only a paid custom domain avoids this), so a page
// rendered here never actually renders in the browser.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { normalizeEmail, verifyUnsubscribeToken } from "../_shared/unsubscribe.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ||
  Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const CONFIRMATION_URL = "https://fifeapp.hu/leiratkozas";

function redirectToConfirmation(status: "ok" | "invalid" | "error", email?: string): Response {
  const params = new URLSearchParams({ status });
  if (email) params.set("email", email);
  return new Response(null, {
    status: 302,
    headers: { Location: `${CONFIRMATION_URL}?${params.toString()}` },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const email = normalizeEmail(url.searchParams.get("email") || "");
  const token = url.searchParams.get("token") || "";
  const isGet = req.method === "GET";

  if (!email || !token || !(await verifyUnsubscribeToken(email, token))) {
    console.warn("Invalid unsubscribe token for", email);
    return isGet
      ? redirectToConfirmation("invalid")
      : new Response("Invalid token", { status: 400 });
  }

  if (!supabaseServiceRoleKey) {
    console.error("Missing service role key");
    return isGet
      ? redirectToConfirmation("error")
      : new Response("Server error", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { error } = await supabase.rpc("newsletter_unsubscribe", { p_email: email });

  if (error) {
    console.error("Unsubscribe failed:", error);
    return isGet
      ? redirectToConfirmation("error")
      : new Response("Server error", { status: 500 });
  }

  console.log("Unsubscribed", email);

  // One-click unsubscribe (RFC 8058): the mail client wants a bare 200, not a redirect.
  if (!isGet) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return redirectToConfirmation("ok", email);
});
