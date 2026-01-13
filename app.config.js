export default {
  name: "fife-app-blodqy3cwbfgnkjv24has",
  slug: "fife-app-blodqy3cwbfgnkjv24has",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/images/Slimey.png",
  scheme: "com.fife.app",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.fife.app"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/Slimey.png",
      backgroundColor: "#ffffff"
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    },
    package: "com.fife.app",
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION"
    ]
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "Allow FiFe app to use your location."
      }
    ],
    [
      "expo-font",
      {
        fonts: [
          "assets/fonts/Piazzolla.ttf",
          "assets/fonts/RedHatText.ttf",
          "assets/fonts/Piazzolla-ExtraBold.ttf"
        ]
      }
    ]
  ],
  experiments: {
    $1: true
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
