export default {
  name: "Fife App",
  slug: "fife-app-blodqy3cwbfgnkjv24has",
  version: "1.4.1",
  orientation: "portrait",
  icon: "./assets/images/Slimey.png",
  scheme: "com.fife.app",
  userInterfaceStyle: "automatic",
  // OTA updates (expo-updates). The fingerprint policy derives the runtime
  // version from the native project, so an update is only ever delivered to
  // binaries with the same native code — anything that adds or changes a
  // native module (or a config plugin) needs a new store build, not `eas update`.
  runtimeVersion: {
    policy: "fingerprint"
  },
  updates: {
    url: "https://u.expo.dev/2e78cdad-443d-4685-942d-bfc5e223927b",
    // Start straight from the cached bundle; a new update downloads in the
    // background and is applied on the next cold start.
    fallbackToCacheTimeout: 0
  },
  splash: {
    image: "./assets/images/Slimey.png",
    resizeMode: "contain",
    backgroundColor: "#fff5e0"
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.fife.app",
    appleTeamId: "BRWA92BF9J",
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
    ["expo-location", {
      locationWhenInUsePermission:
        "A FiFe a helyzeted alapján mutatja a környékbeli embereket és bizniszeket, és így jelölheted ki a környékedet a térképen. A pontos helyed más felhasználók nem látják.",
      locationAlwaysAndWhenInUsePermission: false,
      locationAlwaysPermission: false,
      isIosBackgroundLocationEnabled: false
    }],
    ["expo-image-picker", {
      photosPermission:
        "A FiFe a kiválasztott fotókhoz fér hozzá, hogy profilképet, kommenthez- vagy a bizniszedhez tartozó képeket tölthess fel.",
      cameraPermission: false,
      microphonePermission: false
    }],
    ["expo-audio", { enableBackgroundPlayback: false, recordAudioAndroid: false }],
    "expo-secure-store",
    "expo-image",
    "expo-router",
    "expo-status-bar",
    "expo-video",
    "expo-web-browser",
    "expo-asset"
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