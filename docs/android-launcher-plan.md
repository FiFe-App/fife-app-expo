# Fife App as an Android Launcher

## Goal

Let users set Fife App as their Android Home app. Pressing the device Home
button opens Fife App, which then needs to offer the two things every
launcher needs: an **app drawer** (browse/launch installed apps) and a
**home wallpaper** (background behind the app's own home content).

## What's done in this change

- `app.config.js`: added `android.intentFilters` with `action: MAIN` +
  `category: [DEFAULT, HOME]` on the existing main activity. This is what
  makes Android list Fife App in Settings → Apps → Default apps → Home app,
  and in the "Use as Home" dialog when pressing Home. No new activity is
  needed — the existing `MainActivity` (and therefore the existing
  Expo Router stack) is reused.
- `package.json`: added the native modules needed for the two features
  (see below). Run `npm install` then `npx expo prebuild -p android` (or an
  EAS dev build) to pick up the new native code — Expo Go cannot load these.

## New modules

| Package | Why |
| --- | --- |
| `expo-android-app-list` | Expo module wrapping `PackageManager` to list installed apps (name, package, icon as base64) and read per-app metadata. Bundles its own `QUERY_ALL_PACKAGES` permission via manifest merge — no config plugin entry needed. |
| `expo-intent-launcher` | Official Expo module for firing Android intents. Used to actually launch a tapped app (`ACTION_MAIN` + the app's package name) and to open the "Set default Home app" system screen. |
| `react-native-manage-wallpaper` | Sets the system wallpaper (home/lock/both) from a local image URI. Used so a wallpaper the user picks in Fife App can also become the real Android wallpaper. |
| `expo-image-picker` (already installed) | Lets the user choose a custom wallpaper image from their gallery. |

`QUERY_ALL_PACKAGES` is a Play Store "sensitive permission" — Play Console
will ask for a declaration form once this ships (expected for any launcher
app; budget time for that review in the release checklist).

## App drawer plan

1. New route, e.g. `app/launcher/drawer.tsx`, rendered as a modal/sheet over
   the home screen (or a swipe-up panel from `app/home.tsx` once this becomes
   the Home destination).
2. `hooks/useInstalledApps.ts`: calls `AppList.getAll()` once on mount,
   caches the result (AsyncStorage or a Redux slice) since querying every
   package on the device is not cheap; refresh on `AppState` foreground or via
   a `PACKAGE_ADDED`/`PACKAGE_REMOVED` broadcast (would need a small addition
   to `expo-android-app-list`, or poll on resume as a first pass).
3. `components/launcher/AppDrawer.tsx`: grid/list of `{ icon, appName }`,
   icons loaded via `AppList.getAppIcon(packageName, size)` (base64 PNG →
   `Image source={{ uri: 'data:image/png;base64,...' }}`), with a search box
   filtering by app name (reuse `FakeSearchInput` styling patterns already in
   the app).
4. Tap handler: `IntentLauncher.startActivityAsync('android.intent.action.MAIN', { packageName, category: 'android.intent.category.LAUNCHER' })` (Expo's `IntentLauncher` already supports a `packageName` option — falls back gracefully if the app has no launchable activity).
5. Long-press: app info / uninstall shortcuts via `IntentLauncher` intents
   (`ACTION_DELETE`, `ACTION_APPLICATION_DETAILS_SETTINGS`).

## Home wallpaper plan

Two related pieces — "show the wallpaper behind Fife App's home content"
and "let the user change it":

1. **Storage**: a `wallpaperUri` field in the existing `user` (or a new
   `launcher`) Redux slice, persisted via the `redux-persist` setup already
   in `redux/store.ts`. Default to a bundled image (e.g. reuse
   `assets/images/Slimey.png`'s background color) until the user picks one.
2. **Picking**: reuse `expo-image-picker` (already a dependency) to let the
   user choose a photo; copy it into app storage with `expo-file-system` so
   it survives the picker's cache cleanup, then store that local URI in the
   slice above.
3. **Rendering**: wrap `app/home.tsx` (or whichever screen becomes the Home
   destination) in an `ImageBackground` using `wallpaperUri`, sitting behind
   the existing `ThemedView`/content with the content's background made
   transparent on that screen only.
4. **Applying to the real OS wallpaper** (optional, matches user expectation
   that "wallpaper" affects all launchers, not just Fife App): call
   `ManageWallpaper.setWallpaper({ uri: wallpaperUri }, callback, ManageWallpaper.TYPE.HOME)`
   from `react-native-manage-wallpaper` when the user taps "Apply as system
   wallpaper".
5. **Reading the current system wallpaper** (so Fife App's background
   matches whatever the user set elsewhere) isn't covered by any maintained
   RN/Expo package — it needs `WallpaperManager.getDrawable()` on the native
   side. If that's wanted, it's a small addition: a local Expo module (or a
   PR to `expo-android-app-list`/a new `modules/expo-wallpaper-reader`
   folder) exposing a single `getCurrentWallpaperBase64()` method. Flagging
   this now since it's the one piece that has no off-the-shelf module.

## Sequencing / open decisions

- Decide whether the "launcher" experience is a new top-level route or
  replaces `app/home.tsx` outright — affects whether `BottomNavigation` /
  the existing auth-gated stack in `app/_layout.tsx` needs a parallel
  "logged out, but still Home app" state (Android will still send `MAIN`+
  `HOME` intents even if the user isn't logged into Fife App).
- Decide on app drawer caching/refresh strategy (poll on resume vs. native
  package-change broadcast) before building `useInstalledApps`.
- The native modules require a custom dev client / prebuild — `expo-dev-client`
  is already a dependency, so `npx expo run:android` or an EAS development
  build is the way to test, not Expo Go.
