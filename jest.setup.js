/* eslint-env jest */

// `lib/supabase/supabase.ts` builds its client at import time and throws
// without these, so keep them defined even for the rare test that unmocks it.
process.env.EXPO_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";

// No unit test should reach the network. Tests that need to drive Supabase
// import the same double and set up its `jest.fn()`s — see
// `test-utils/mocks/supabase.ts`.
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));

// Importing `redux/store.ts` (for `rootReducer`) would otherwise boot the real
// persistor, which rehydrates on a timer and keeps Jest alive after the run.
jest.mock("redux-persist", () => ({
  ...jest.requireActual("redux-persist"),
  persistReducer: (_config, reducer) => reducer,
  persistStore: () => ({
    persist: jest.fn(),
    purge: jest.fn(),
    flush: jest.fn(),
    pause: jest.fn(),
  }),
}));

// Leaf native modules the registration screens touch. They have no behaviour
// worth exercising in a unit test, but they do need to exist.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: "opened" })),
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: "success" })),
  dismissBrowser: jest.fn(),
}));

jest.mock("expo-auth-session", () => ({
  makeRedirectUri: jest.fn(({ path } = {}) => `fife://${String(path ?? "").replace(/^\//, "")}`),
}));

// The screens log progress and errors on purpose; keep the test output readable
// while still letting a test assert on them if it wants to.
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});
