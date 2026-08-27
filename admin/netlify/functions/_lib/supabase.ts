import { createClient } from "@supabase/supabase-js";
import ws from "ws";

// A Netlify Functions Node 18/20 runtime-ján nincs natív WebSocket, a
// supabase-js viszont a kliens létrehozásakor mindig inicializálja a
// realtime kliensét (amit itt sosem használunk) — enélkül a transport
// megadása nélkül a createClient hívás elhasal.
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY nincs beállítva a Netlify környezeti változók között.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
    realtime: { transport: ws as unknown as typeof WebSocket },
  });
}
