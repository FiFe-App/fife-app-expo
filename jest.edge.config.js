/**
 * Integration tests for the Supabase edge functions.
 *
 * Separate from `jest.config.js` because these talk to a real, running stack
 * (`npx supabase start`) over HTTP, while the default suite is hermetic and must
 * stay runnable anywhere. Run with `npm run test:edge`; see
 * `__tests__/edge/README.md`.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  displayName: "edge",
  testEnvironment: "node",
  rootDir: __dirname,
  testMatch: ["<rootDir>/__tests__/edge/**/*.integration.test.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  transform: { "^.+\\.[jt]sx?$": ["babel-jest", { presets: ["babel-preset-expo"] }] },
  // These suites share one database. Running them in parallel would have one
  // suite's cleanup delete another's fixtures mid-test.
  maxWorkers: 1,
  globalSetup: "<rootDir>/jest.edge.setup.js",
  globalTeardown: "<rootDir>/jest.edge.teardown.js",
  testTimeout: 30000,
};
