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

// Reanimated and its worklets runtime need the native module at import time;
// gestures need gesture-handler's native module. Chat bubbles use all three
// (components/chat/SwipeToReply.tsx), so they are mocked for every test.
jest.mock("react-native-worklets", () => require("react-native-worklets/src/mock"));
// Reanimated 4.7's mock still boots the real module, whose initializer hands
// a CSS event handler to the JS fallback — which throws, by design, since CSS
// animations only exist natively. Nothing under test animates through CSS.
jest.mock("react-native-reanimated/src/css/native/proxy", () => ({
  ...jest.requireActual("react-native-reanimated/src/css/native/proxy"),
  setCSSEventHandler: () => {},
}));
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
require("react-native-gesture-handler/jestSetup");

// Native keyboard tracking; the library ships its own test double.
jest.mock("react-native-keyboard-controller", () =>
  require("react-native-keyboard-controller/jest"),
);

// Leaf native modules the registration screens touch. They have no behaviour
// worth exercising in a unit test, but they do need to exist.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Ships ESM only; analytics are a no-op in tests anyway (no app key).
jest.mock("@aptabase/react-native", () => ({
  __esModule: true,
  default: { init: jest.fn(), trackEvent: jest.fn(), trackError: jest.fn(), dispose: jest.fn() },
  init: jest.fn(),
  trackEvent: jest.fn(),
  trackError: jest.fn(),
  dispose: jest.fn(),
}));

// Not part of React Native's Jest environment, but the app uses it on native
// since React Native 0.88 removed InteractionManager (hooks/useLastRoute.ts).
global.requestIdleCallback ??= (callback) =>
  setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 1);
global.cancelIdleCallback ??= (id) => clearTimeout(id);

// jest-expo's generic native-module mock returns nothing usable from
// `addListener`, and expo-notifications 58 subscribes a default foreground
// handler at import time, then removes that subscription the moment the app
// sets its own handler (lib/notifications/registerForPushNotifications.ts).
jest.mock("expo-notifications/build/NotificationsHandlerModule", () => ({
  __esModule: true,
  default: {
    addListener: () => ({ remove: () => {} }),
    handleNotificationAsync: jest.fn(),
    removeListeners: () => {},
  },
}));

// jest-expo mocks `react-native/asset-registry`, which is where the asset
// transformer registers every required image and font. Since React Native
// 0.88, expo-asset reads `AssetRegistry` from `react-native` itself, which is
// backed by this private module instead — real and empty under Jest, so every
// icon font lookup threw "missing from the asset registry". Point it at the
// same mock so both sides agree.
jest.mock("react-native/src/private/assets/AssetRegistry", () => {
  const registry = jest.requireMock("react-native/asset-registry");
  return {
    AssetRegistry: {
      registerAsset: (asset) => registry.registerAsset(asset),
      getAssetByID: (id) => registry.getAssetByID(id),
    },
  };
});

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
