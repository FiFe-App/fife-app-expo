import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "http://supabase-kong:8000";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const adminSecret = Deno.env.get("ADMIN_HEALTH_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

interface TestResult {
  name: string;
  status: "pass" | "fail";
  durationMs: number;
  error?: string;
}

function timed<T>(fn: () => Promise<T>): Promise<{ ok: boolean; data?: T; error?: string; durationMs: number }> {
  const start = Date.now();
  return fn().then(
    (data) => ({ ok: true, data, durationMs: Date.now() - start }),
    (err) => ({ ok: false, error: String(err?.message ?? err), durationMs: Date.now() - start }),
  );
}

async function checkBusinessSearch(anonToken: string): Promise<TestResult> {
  const result = await timed(async () => {
    const res = await fetch(`${supabaseUrl}/functions/v1/business-search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${anonToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "kávé", lat: 47.4979, long: 19.0402, take: 3 }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) && !Array.isArray(data?.results)) throw new Error("Expected array response");
  });
  return { name: "business-search", status: result.ok ? "pass" : "fail", durationMs: result.durationMs, error: result.error };
}

async function checkNearestProfiles(anonToken: string): Promise<TestResult> {
  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
    global: { headers: { Authorization: `Bearer ${anonToken}` } },
  });
  const result = await timed(async () => {
    const { data, error } = await supabase.rpc("nearest_profiles", { lat: 47.4979, long: 19.0402, distance: 50000, take: 3, skip: 0 });
    if (error) throw new Error(error.message);
    if (!Array.isArray(data)) throw new Error("Expected array");
  });
  return { name: "nearest_profiles", status: result.ok ? "pass" : "fail", durationMs: result.durationMs, error: result.error };
}

async function checkCreateBuziness(anonToken: string, userId: string): Promise<TestResult> {
  const admin = createClient(supabaseUrl, serviceRoleKey);
  let contactId: number | null = null;
  let buzinessId: number | null = null;

  const result = await timed(async () => {
    // Setup contact
    const { data: contact, error: ce } = await admin
      .from("contacts")
      .insert({ author: userId, type: "TEL", data: "+36000000000" })
      .select()
      .single();
    if (ce || !contact) throw new Error(`Contact setup: ${ce?.message}`);
    contactId = contact.id;

    const res = await fetch(`${supabaseUrl}/functions/v1/create-buziness`, {
      method: "POST",
      headers: { Authorization: `Bearer ${anonToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "__ADMIN_HEALTH_CHECK__", author: userId }),
    });
    const data = await res.json();
    buzinessId = data?.id ?? null;
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  });

  // Cleanup
  if (buzinessId) await admin.from("buziness").delete().eq("id", buzinessId);
  if (contactId) await admin.from("contacts").delete().eq("id", contactId);

  return { name: "create-buziness", status: result.ok ? "pass" : "fail", durationMs: result.durationMs, error: result.error };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const secret = req.headers.get("x-admin-secret");
  if (adminSecret && secret !== adminSecret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
  }

  // Need a test user token to call authenticated functions
  const { test_email, test_password } = await req.json().catch(() => ({})) as { test_email?: string; test_password?: string };
  if (!test_email || !test_password) {
    return new Response(JSON.stringify({ error: "test_email and test_password required" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email: test_email, password: test_password });
  if (authErr || !authData.session) {
    return new Response(JSON.stringify({ error: `Auth failed: ${authErr?.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const token = authData.session.access_token;
  const userId = authData.session.user.id;

  const results: TestResult[] = await Promise.allSettled([
    checkBusinessSearch(token),
    checkNearestProfiles(token),
    checkCreateBuziness(token, userId),
  ]).then((settled) =>
    settled.map((s) =>
      s.status === "fulfilled"
        ? s.value
        : { name: "unknown", status: "fail" as const, durationMs: 0, error: String((s as PromiseRejectedResult).reason) },
    ),
  );

  await supabase.auth.signOut();

  return new Response(JSON.stringify({ results, timestamp: new Date().toISOString() }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
