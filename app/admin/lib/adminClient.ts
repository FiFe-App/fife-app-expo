import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/database.types';

export function createAdminClient(serviceRoleKey: string) {
  return createClient<Database>(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function createFreshAnonClient() {
  return createClient<Database>(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
