export default {
  name: "Fife App",
  slug: "fife-app-blodqy3cwbfgnkjv24has",
  version: "1.3.0",
  orientation: "portrait",
  icon: "./assets/images/Slimey.png",
  scheme: "com.fife.app",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/Slimey.png",
    resizeMode: "contain",
    backgroundColor: "#fff5e0"
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.fife.app",
    associatedDomains: [
      "applinks:fifeapp.hu",
      "webcredentials:fifeapp.hu"
    ],
    splash: {
      image: "./assets/images/Slimey.png",
      resizeMode: "contain",
      backgroundColor: "#fff5e0"
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    softwareKeyboardLayoutMode: "resize",
    splash: {
      image: "./assets/images/Slimey.png",
      resizeMode: "contain",
      backgroundColor: "#fff5e0"
    },
    adaptiveIcon: {
      foregroundImage: "./assets/images/Slimey-adaptive.png",
      backgroundColor: "#fff5e0"
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID
      }
    },
    package: "com.fife.app",
    googleServicesFile: "./google-services.json",
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "fifeapp.hu"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/Slimey.png"
  },
  plugins: [
    [
      "react-native-maps",
      {
        "androidGoogleMapsApiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID
      }
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/Slimey.png",
        color: "#fff5e0"
      }
    ],
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
          "minSdkVersion": 24,
          "enableMinifyInReleaseBuilds": true,
          "enableShrinkResourcesInReleaseBuilds": true
        },
        "ios": {
          "useFrameworks": "static"
        }
      }
    ],
    [
        "expo-splash-screen",
        {
          "backgroundColor": "#fff5e0",
          "image": "./assets/simple.png",
          "dark": {
            "image": "./assets/simple.png",
            "backgroundColor": "#1e1b16"
          },
          "imageWidth": 80
        }
      ],
    "expo-secure-store"
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