import type { SupabaseClient, Session } from '@supabase/supabase-js';
import { createAdminClient, createFreshAnonClient } from './adminClient';
import type { TestResult } from './types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const DEFAULT_LAT = 47.4979;
const DEFAULT_LONG = 19.0402;

function timed<T>(fn: () => Promise<T>) {
  const start = Date.now();
  return fn().then(
    (data) => ({ ok: true as const, data, durationMs: Date.now() - start }),
    (err) => ({ ok: false as const, error: String(err?.message ?? err), durationMs: Date.now() - start }),
  );
}

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

async function loginTestClient(email: string, password: string) {
  const client = createFreshAnonClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`Test account login failed: ${error?.message ?? 'no session'}`);
  return { client, session: data.session };
}

// ────────────────────────────────────────────────
// TEST 1: business-search (interactive)
// ────────────────────────────────────────────────

export interface BusinessSearchParams {
  query: string;
  lat?: number;
  long?: number;
  take?: number;
  matchThreshold?: number;
}

export async function testBusinessSearch(
  session: Session,
  params: BusinessSearchParams,
): Promise<TestResult> {
  const result = await timed(async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/business-search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: params.query,
        lat: params.lat ?? DEFAULT_LAT,
        long: params.long ?? DEFAULT_LONG,
        take: params.take ?? 5,
        match_threshold: params.matchThreshold ?? 0.5,
        debug: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    return data;
  });
  if (!result.ok) return { status: 'fail', durationMs: result.durationMs, error: result.error };
  const results = result.data?.results ?? result.data;
  if (!Array.isArray(results)) return { status: 'fail', durationMs: result.durationMs, error: 'Expected array in response', response: result.data };
  return { status: 'pass', durationMs: result.durationMs, response: result.data };
}

// ────────────────────────────────────────────────
// TEST 2: nearest_profiles (interactive)
// ────────────────────────────────────────────────

export interface NearestProfilesParams {
  lat?: number;
  long?: number;
  distance?: number;
  take?: number;
}

export async function testNearestProfiles(
  supabase: SupabaseClient,
  params: NearestProfilesParams,
): Promise<TestResult> {
  const result = await timed(() =>
    supabase.rpc('nearest_profiles', {
      lat: params.lat ?? DEFAULT_LAT,
      long: params.long ?? DEFAULT_LONG,
      distance: params.distance ?? 50000,
      take: params.take ?? 6,
      skip: 0,
    }),
  );
  if (!result.ok) return { status: 'fail', durationMs: result.durationMs, error: result.error };
  const { data, error } = result.data as { data: unknown; error: unknown };
  if (error) {
    const msg = (error as { message?: string })?.message ?? String(error);
    return { status: 'fail', durationMs: result.durationMs, error: msg };
  }
  return { status: 'pass', durationMs: result.durationMs, response: data };
}

// ────────────────────────────────────────────────
// TEST 3a: create-buziness WITHOUT contact → expects 400
// ────────────────────────────────────────────────

export async function testCreateBuzinessNoContact(
  testEmail: string,
  testPassword: string,
): Promise<TestResult> {
  let client: ReturnType<typeof createFreshAnonClient> | null = null;
  const start = Date.now();
  try {
    const auth = await loginTestClient(testEmail, testPassword);
    client = auth.client;

    // Pre-cleanup: ensure no stale contacts exist for this test user
    const adminKey = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin_srk') : null;
    if (adminKey) {
      const adminClient = createAdminClient(adminKey);
      await adminClient.from('contacts').delete().eq('author', auth.session.user.id).eq('data', '+36000000000');
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-buziness`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: '__ADMIN_HEALTH_NO_CONTACT__', author: auth.session.user.id }),
    });
    const data = await res.json();
    const durationMs = Date.now() - start;
    if (res.status === 400 && typeof data.error === 'string' && data.error.toLowerCase().includes('contact')) {
      return { status: 'pass', durationMs, response: data };
    }
    return { status: 'fail', durationMs, error: `Expected 400 with contact error, got ${res.status}: ${data.error ?? JSON.stringify(data)}`, response: data };
  } catch (e: unknown) {
    return { status: 'fail', durationMs: Date.now() - start, error: (e as Error)?.message ?? String(e) };
  } finally {
    await client?.auth.signOut().catch(() => {});
  }
}

// ────────────────────────────────────────────────
// TEST 3b: create-buziness WITH contact → expects 200, cleans up
// ────────────────────────────────────────────────

export async function testCreateBuzinessWithContact(
  testEmail: string,
  testPassword: string,
  serviceRoleKey: string,
): Promise<TestResult> {
  const adminClient = createAdminClient(serviceRoleKey);
  let client: ReturnType<typeof createFreshAnonClient> | null = null;
  let contactId: number | null = null;
  let buzinessId: number | null = null;
  const start = Date.now();

  try {
    const auth = await loginTestClient(testEmail, testPassword);
    client = auth.client;

    // Pre-cleanup: remove any leftover test data
    await adminClient.from('buziness').delete().eq('author', auth.session.user.id).like('title', '__ADMIN_HEALTH_%');

    // Setup: add temp contact
    const { data: contact, error: contactErr } = await adminClient
      .from('contacts')
      .insert({ author: auth.session.user.id, type: 'TEL', data: '+36000000000' })
      .select()
      .single();
    if (contactErr || !contact) throw new Error(`Setup failed: ${contactErr?.message}`);
    contactId = contact.id;

    // Call create-buziness
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-buziness`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '__ADMIN_HEALTH_CHECK__',
        author: auth.session.user.id,
        description: 'Admin health check — safe to delete',
      }),
    });
    const data = await res.json();
    buzinessId = data?.id ?? null;
    const durationMs = Date.now() - start;

    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    return { status: 'pass', durationMs, response: data };
  } catch (e: unknown) {
    return { status: 'fail', durationMs: Date.now() - start, error: (e as Error)?.message ?? String(e) };
  } finally {
    if (buzinessId) await adminClient.from('buziness').delete().eq('id', buzinessId).then(() => {});
    if (contactId) await adminClient.from('contacts').delete().eq('id', contactId).then(() => {});
    await client?.auth.signOut().catch(() => {});
  }
}

// ────────────────────────────────────────────────
// TEST 4: registration → creates temp user, cleans up
// ────────────────────────────────────────────────

export async function testRegistration(serviceRoleKey: string): Promise<TestResult> {
  const anonClient = createFreshAnonClient();
  const adminClient = createAdminClient(serviceRoleKey);
  const tempEmail = `test+health_${Date.now()}@fifeapp.test`;
  let userId: string | null = null;
  const start = Date.now();

  try {
    const { data, error } = await anonClient.auth.signUp({ email: tempEmail, password: 'TestPass1234!' });
    const durationMs = Date.now() - start;
    if (error) return { status: 'fail', durationMs, error: error.message };
    userId = data.user?.id ?? null;
    return { status: 'pass', durationMs, response: { userId, email: tempEmail } };
  } catch (e: unknown) {
    return { status: 'fail', durationMs: Date.now() - start, error: (e as Error)?.message ?? String(e) };
  } finally {
    if (userId) await adminClient.auth.admin.deleteUser(userId).catch(() => {});
  }
}

// ────────────────────────────────────────────────
// TEST 5: login
// ────────────────────────────────────────────────

export async function testLogin(testEmail: string, testPassword: string): Promise<TestResult> {
  const client = createFreshAnonClient();
  const start = Date.now();
  try {
    const { data, error } = await client.auth.signInWithPassword({ email: testEmail, password: testPassword });
    const durationMs = Date.now() - start;
    if (error) return { status: 'fail', durationMs, error: error.message };
    if (!data.session) return { status: 'fail', durationMs, error: 'No session returned' };
    return { status: 'pass', durationMs, response: { email: data.session.user.email } };
  } catch (e: unknown) {
    return { status: 'fail', durationMs: Date.now() - start, error: (e as Error)?.message ?? String(e) };
  } finally {
    await client.auth.signOut().catch(() => {});
  }
}
