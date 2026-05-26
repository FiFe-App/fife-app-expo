import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL") || "http://127.0.0.1:54321";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const payload = await req.json().catch(() => ({}));
    // For DELETE events, record may be null and old_record contains the deleted row
    const oldRecord = payload?.old_record || payload?.record;
    const userId = oldRecord?.id;

    if (!userId) {
      console.warn("No user id in webhook payload", payload);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: files, error: listError } = await supabaseAdmin
      .storage
      .from("avatars")
      .list(userId, { limit: 1000 });

    if (listError) {
      console.error("Error listing avatar files:", listError);
    } else if (files && files.length) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      const { error: removeError } = await supabaseAdmin
        .storage
        .from("avatars")
        .remove(paths);
      if (removeError) {
        console.error("Error removing avatar files:", removeError);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error in on-profile-delete:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
