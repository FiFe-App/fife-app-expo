export default {
  name: "Fife App",
  slug: "fife-app-blodqy3cwbfgnkjv24has",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/images/Slimey.png",
  scheme: "com.fife.app",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#fff5e0"
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.fife.app",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#fff5e0"
    }
  },
  android: {
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#fff5e0"
    },
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#fff5e0"
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    },
    package: "com.fife.app"
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    [
      "expo-font",
      {
        fonts: [
          "assets/fonts/Piazzolla.ttf",
          "assets/fonts/Piazzolla-Regular.ttf",
          "assets/fonts/Piazzolla-Light.ttf",
          "assets/fonts/Piazzolla-Medium.ttf",
          "assets/fonts/Piazzolla-ExtraBold.ttf",
          "assets/fonts/RedHatText.ttf",
          "assets/fonts/RedHatText-Regular.ttf",
          "assets/fonts/RedHatText-Light.ttf",
          "assets/fonts/RedHatText-Medium.ttf",
          "assets/fonts/RedHatText-Bold.ttf"
        ]
      }
    ],
    [
      "expo-build-properties",
      {
        "android": {
          "compileSdkVersion": 36,
          "targetSdkVersion": 36,
          "minSdkVersion": 24
        },
        "ios": {
          "useFrameworks": "static"
        }
      }
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true
  },
  extra: {
    router: {
      origin: false
    },
    eas: {
      projectId: "2e78cdad-443d-4685-942d-bfc5e223927b"
    }
  },
  owner: "kristofakos"
};