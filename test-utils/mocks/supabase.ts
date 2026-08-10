/**
 * Test double for `@/lib/supabase/supabase`.
 *
 *   jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));
 *
 * Auth calls are plain `jest.fn()`s — give them results with
 * `mockResolvedValue`. Table reads go through a chainable builder that ignores
 * the filters and resolves with whatever the test registered for that table via
 * `__setTableRows` (awaiting the builder) or `__setTableRow` (`maybeSingle` /
 * `single`).
 */

type QueryResult = { data: unknown; error: unknown };

export const auth = {
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  signInWithOAuth: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  getUser: jest.fn(),
  setSession: jest.fn(),
  refreshSession: jest.fn(),
  resend: jest.fn(),
  updateUser: jest.fn(),
  onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  startAutoRefresh: jest.fn(),
  stopAutoRefresh: jest.fn(),
};

const tableRows = new Map<string, QueryResult>();
const tableRow = new Map<string, QueryResult>();

/** Result for `from(table).select(...).eq(...)` when awaited directly. */
export const __setTableRows = (table: string, result: QueryResult) => {
  tableRows.set(table, result);
};

/** Result for `from(table)....maybeSingle()` / `.single()`. */
export const __setTableRow = (table: string, result: QueryResult) => {
  tableRow.set(table, result);
};

const createQueryBuilder = (table: string) => {
  const rows = () => tableRows.get(table) ?? { data: [], error: null };
  const row = () => tableRow.get(table) ?? { data: null, error: null };

  const builder: Record<string, unknown> = {
    then: (
      onFulfilled?: (value: QueryResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(rows()).then(onFulfilled, onRejected),
    maybeSingle: jest.fn(() => Promise.resolve(row())),
    single: jest.fn(() => Promise.resolve(row())),
  };

  // Every filter/modifier is a no-op that keeps the chain going.
  for (const method of [
    "select",
    "insert",
    "update",
    "upsert",
    "delete",
    "eq",
    "neq",
    "in",
    "is",
    "not",
    "or",
    "ilike",
    "like",
    "limit",
    "order",
    "range",
  ]) {
    builder[method] = jest.fn(() => builder);
  }

  return builder;
};

export const supabase = {
  auth,
  from: jest.fn((table: string) => createQueryBuilder(table)),
  rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn(),
  })),
  removeChannel: jest.fn(),
  functions: { invoke: jest.fn(() => Promise.resolve({ data: null, error: null })) },
  storage: { from: jest.fn(() => ({ upload: jest.fn(), getPublicUrl: jest.fn() })) },
};

/** Clears recorded calls and registered table results. Call from `beforeEach`. */
export const __resetSupabase = () => {
  tableRows.clear();
  tableRow.clear();
  (Object.values(auth) as jest.Mock[]).forEach((fn) => fn.mockReset());
  auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
  supabase.from.mockClear();
  supabase.rpc.mockClear();
  supabase.rpc.mockResolvedValue({ data: null, error: null });
};
