/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // `expo-modules-core` only exists inside `expo`'s own nested node_modules here
  // (npm nests it because its `react-native-worklets` peer range does not match
  // the version pinned at the root). jest-expo's setup file requires it by bare
  // specifier, so Jest needs that directory in its module search path too.
  moduleDirectories: ["node_modules", "node_modules/expo/node_modules"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/.expo/"],
  // jest-expo's default list, plus `react-redux`, which resolves to an ESM
  // build under the "react-native" export condition and has to be transformed.
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|react-redux))",
    "/node_modules/react-native-reanimated/plugin/",
  ],
};
