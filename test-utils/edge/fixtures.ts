/**
 * Test data for the edge-function suites, and the bookkeeping that gets it out
 * of the database again.
 *
 * Every row these tests create is either owned by a test auth user — and so
 * cascades away when that user is deleted (see
 * `20260526120000_fix_cascade_delete_for_user_deletion.sql`) — or is tracked
 * explicitly here. `cleanup()` runs in each suite's `afterAll`, and
 * `sweepTestArtifacts()` runs before and after the whole run as a backstop for
 * anything a crashed test left behind.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { adminClient, anonClient } from "./clients";

/**
 * `.invalid` can never resolve (RFC 2606), so a stray test user can never
 * receive mail, and the domain doubles as the marker the sweep looks for.
 */
export const TEST_EMAIL_DOMAIN = "fife-edge-test.invalid";
/** Prefix on every string these tests write, so leftovers are recognisable. */
export const TEST_MARKER = "edge-test-";

const TEST_PASSWORD = "edge-test-password-123";

export interface TestUser {
  id: string;
  email: string;
  /** A real user JWT — what the app puts in the Authorization header. */
  accessToken: string;
}

/** Everything one suite created, in the order it has to be removed. */
export class TestData {
  readonly userIds: string[] = [];
  readonly buzinessIds: number[] = [];
  readonly cacheQueryTexts: string[] = [];
  readonly unsubscribedEmails: string[] = [];
  readonly storageObjects: { bucket: string; path: string }[] = [];

  private readonly admin: SupabaseClient;

  constructor(admin: SupabaseClient = adminClient()) {
    this.admin = admin;
  }

  /**
   * Creates a confirmed auth user (and, via trigger, their profile and settings
   * row) and signs in.
   *
   * `aiEnhance` opts the user into the AI path. It is off for a new account, so
   * every suite that expects create-buziness or business-search to reach OpenAI
   * has to ask for it — which is also what makes the opposite case testable
   * without an API key at all.
   */
  async createUser(
    options: {
      fullName?: string;
      badBoy?: boolean;
      newsletter?: boolean;
      aiEnhance?: boolean;
    } = {},
  ): Promise<TestUser> {
    const email = `${TEST_MARKER}${crypto.randomUUID()}@${TEST_EMAIL_DOMAIN}`;
    const { data, error } = await this.admin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: options.fullName ?? `${TEST_MARKER}user` },
    });
    if (error || !data.user) throw new Error(`Could not create test user: ${error?.message}`);
    this.userIds.push(data.user.id);

    // Set on the rows rather than through user metadata: these have to hold
    // whatever handle_new_user() decides to default them to.
    //
    // `newsletter` is written to BOTH tables. get_newsletter_recipients reads it
    // as COALESCE(s.newsletter, p.newsletter), and user_settings.newsletter is
    // NOT NULL DEFAULT false — so the COALESCE never falls through to profiles,
    // and a profiles-only write would produce a "subscriber" that the resolver
    // does not return. Writing both also keeps the fixture honest about the
    // split the app still has.
    const profileFlags: Record<string, boolean> = {};
    const settingsFlags: Record<string, boolean> = {};
    if (options.badBoy) profileFlags.bad_boy = true;
    if (options.newsletter !== undefined) {
      profileFlags.newsletter = options.newsletter;
      settingsFlags.newsletter = options.newsletter;
    }
    if (options.aiEnhance !== undefined) settingsFlags.ai_enhance = options.aiEnhance;

    if (Object.keys(profileFlags).length) {
      const { error: flagError } = await this.admin
        .from("profiles")
        .update(profileFlags)
        .eq("id", data.user.id);
      if (flagError) throw new Error(`Could not set profile flags: ${flagError.message}`);
    }

    if (Object.keys(settingsFlags).length) {
      const { error: settingsError } = await this.admin
        .from("user_settings")
        .update(settingsFlags)
        .eq("author", data.user.id);
      if (settingsError) throw new Error(`Could not set user settings: ${settingsError.message}`);
    }

    const { data: session, error: signInError } = await anonClient().auth.signInWithPassword({
      email,
      password: TEST_PASSWORD,
    });
    if (signInError || !session.session) {
      throw new Error(`Could not sign in test user: ${signInError?.message}`);
    }

    return { id: data.user.id, email, accessToken: session.session.access_token };
  }

  /**
   * An auth user whose address was never confirmed, and who is therefore never
   * signed in — there is no session to hand back.
   *
   * The 'all' newsletter audience deliberately skips these: unconfirmed
   * sign-ups are where the dead addresses are, and a bulk send to a dormant
   * list is the worst moment to hand a pile of bounces to the receiving side.
   */
  async createUnconfirmedUser(): Promise<{ id: string; email: string }> {
    const email = `${TEST_MARKER}${crypto.randomUUID()}@${TEST_EMAIL_DOMAIN}`;
    const { data, error } = await this.admin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: false,
      user_metadata: { full_name: `${TEST_MARKER}unconfirmed` },
    });
    if (error || !data.user) {
      throw new Error(`Could not create unconfirmed test user: ${error?.message}`);
    }
    this.userIds.push(data.user.id);
    return { id: data.user.id, email };
  }

  /**
   * A contact row. create-buziness refuses callers who have none, and the
   * buziness INSERT policy requires one too.
   */
  async createContact(userId: string, data = "+3612345678"): Promise<number> {
    const { data: row, error } = await this.admin
      .from("contacts")
      .insert({ author: userId, type: "TEL", data, title: `${TEST_MARKER}contact`, public: true })
      .select("id")
      .single();
    if (error) throw new Error(`Could not create contact: ${error.message}`);
    return row.id as number;
  }

  /**
   * Writes a buziness row directly, bypassing create-buziness — the tests that
   * need an existing row (ownership checks, search results) shouldn't have to
   * spend an OpenAI call to get one.
   *
   * `location` is WKT, the same shape the editor sends ("POINT(long lat)").
   * Left out, the row has no location at all — a "Bárhol" biznisz.
   */
  async seedBuziness(
    author: string,
    overrides: Partial<{
      title: string;
      description: string;
      ingyen: boolean;
      embedding_text: string;
      location: string;
    }> = {},
  ): Promise<{ id: number; title: string }> {
    const title = overrides.title ?? `${TEST_MARKER}${crypto.randomUUID().slice(0, 8)}`;
    const { data, error } = await this.admin
      .from("buziness")
      .insert({
        author,
        title,
        description: overrides.description ?? `${TEST_MARKER}description`,
        ingyen: overrides.ingyen ?? false,
        embedding_text: overrides.embedding_text ?? title,
        ...(overrides.location ? { location: overrides.location } : {}),
      })
      .select("id, title")
      .single();
    if (error) throw new Error(`Could not seed buziness: ${error.message}`);
    this.buzinessIds.push(data.id as number);
    return { id: data.id as number, title: data.title as string };
  }

  /** Remembers a search term so its cached embedding is deleted afterwards. */
  trackCachedQuery(queryText: string): void {
    this.cacheQueryTexts.push(queryText.trim().toLowerCase());
  }

  trackUnsubscribedEmail(email: string): void {
    this.unsubscribedEmails.push(email.trim().toLowerCase());
  }

  trackBuziness(id: number): void {
    this.buzinessIds.push(id);
  }

  trackStorageObject(bucket: string, path: string): void {
    this.storageObjects.push({ bucket, path });
  }

  /**
   * Removes everything this suite created. Tolerant of rows that are already
   * gone: some tests (delete-user) remove their own user, and cleanup after a
   * failure may be running against a half-built fixture.
   */
  async cleanup(): Promise<void> {
    for (const { bucket, path } of this.storageObjects) {
      await this.admin.storage.from(bucket).remove([path]);
    }
    if (this.buzinessIds.length) {
      await this.admin.from("buziness").delete().in("id", this.buzinessIds);
    }
    if (this.cacheQueryTexts.length) {
      await this.admin.from("query_embedding_cache").delete().in("query_text", this.cacheQueryTexts);
    }
    if (this.unsubscribedEmails.length) {
      await this.admin.from("newsletter_unsubscribes").delete().in("email", this.unsubscribedEmails);
    }
    for (const userId of this.userIds) {
      // Cascades profiles, contacts, buziness, messages and recommendations.
      await this.admin.auth.admin.deleteUser(userId).catch(() => undefined);
    }
    this.storageObjects.length = 0;
    this.buzinessIds.length = 0;
    this.cacheQueryTexts.length = 0;
    this.unsubscribedEmails.length = 0;
    this.userIds.length = 0;
  }
}

/**
 * Deletes anything carrying the test marker, whoever created it. Runs before the
 * suite (so a previous crashed run doesn't skew results) and after it (so a
 * crash in this one still leaves the database clean).
 */
export async function sweepTestArtifacts(): Promise<void> {
  const admin = adminClient();

  await admin.from("buziness").delete().like("title", `${TEST_MARKER}%`);
  await admin.from("query_embedding_cache").delete().like("query_text", `${TEST_MARKER}%`);
  await admin.from("newsletter_unsubscribes").delete().like("email", `%@${TEST_EMAIL_DOMAIN}`);
  await admin.from("contacts").delete().like("title", `${TEST_MARKER}%`);

  // Auth users have no LIKE filter in the admin API, so page through and match.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data.users.length) break;
    const stale = data.users.filter((user) => user.email?.endsWith(`@${TEST_EMAIL_DOMAIN}`));
    for (const user of stale) {
      await admin.auth.admin.deleteUser(user.id).catch(() => undefined);
      await admin.storage.from("avatars").remove([`${user.id}/avatar.png`]).catch(() => undefined);
    }
    if (data.users.length < 200) break;
  }
}

/**
 * Makes sure the avatars bucket exists before a test uploads into it — a fresh
 * local stack has whatever the migrations created and nothing else.
 */
export async function ensureAvatarsBucket(): Promise<void> {
  const admin = adminClient();
  const { data } = await admin.storage.getBucket("avatars");
  if (!data) await admin.storage.createBucket("avatars", { public: true });
}
