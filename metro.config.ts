// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Prevent Node-only modules pulled in by @supabase/realtime-js (ws)
// from being bundled on native — React Native has a built-in WebSocket.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform !== "web" &&
    (moduleName === "ws" || moduleName === "stream")
  ) {
    return { type: "empty" };
  }
  // wkx (used by locationToCoords.ts) imports @craftzdog/react-native-buffer,
  // which was removed to fix the Android 16 KB page size rejection. Alias it
  // to the pure-JS "buffer" polyfill (no native code, same API) instead.
  if (moduleName === "@craftzdog/react-native-buffer") {
    return context.resolveRequest(context, "buffer", platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
