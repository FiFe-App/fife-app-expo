// iOS 27 asserts at launch unless the app adopts the UIScene life cycle.
// expo ships ExpoAppSceneDelegate for this, but the SDK 57 template doesn't wire it up yet:
// register it in Info.plist and let it (instead of AppDelegate) create the window.
const { withInfoPlist, withAppDelegate } = require("expo/config-plugins");

const withSceneManifest = (config) =>
  withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: "Default Configuration",
            UISceneDelegateClassName: "EXExpoAppSceneDelegate",
          },
        ],
      },
    };
    return config;
  });

const withSceneAppDelegate = (config) =>
  withAppDelegate(config, (config) => {
    if (config.modResults.language !== "swift") {
      throw new Error("withSceneLifecycle only supports a Swift AppDelegate");
    }
    let src = config.modResults.contents;

    if (!src.includes("ExpoReactNativeFactoryProvider")) {
      src = src.replace(
        /class AppDelegate: ExpoAppDelegate \{/,
        "class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {",
      );
    }

    // The scene delegate creates the window and starts React Native into it.
    src = src.replace(
      /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/,
      "\n",
    );

    if (!src.includes("ExpoReactNativeFactoryProvider") || src.includes("UIScreen.main.bounds")) {
      throw new Error("withSceneLifecycle: AppDelegate template changed, update the plugin");
    }
    config.modResults.contents = src;
    return config;
  });

module.exports = (config) => withSceneAppDelegate(withSceneManifest(config));
