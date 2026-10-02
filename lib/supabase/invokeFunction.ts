import { FunctionInvokeOptions, FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * supabase.functions.invoke, plus: a 401 signs the user out.
 *
 * When a session can no longer be refreshed, supabase-js quietly falls back to
 * the anon key. Table reads keep "working" as a logged-out visitor, but every
 * user-facing edge function answers 401 — so the login is gone either way.
 * Signing out locally fires SIGNED_OUT, which app/_layout.tsx turns into a
 * Redux logout, and the auth guard takes the user to the login screen.
 */
export async function invokeFunction<T = any>(
  functionName: string,
  options?: FunctionInvokeOptions,
) {
  const res = await supabase.functions.invoke<T>(functionName, options);
  if (res.error instanceof FunctionsHttpError && res.error.context?.status === 401) {
    await supabase.auth.signOut({ scope: "local" });
  }
  return res;
}
