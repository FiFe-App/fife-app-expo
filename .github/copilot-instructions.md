# Copilot Instructions for FiFe App (Expo + Supabase)

This repo is an Expo (React Native) app using expo-router, React Native Paper, Redux (persisted), and Supabase. Follow these rules to be productive and consistent.

## Run and Build

- Env: copy `example.env` to `.env` and set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Dev: `npm install` then `npm start` (Metro). Platform: `npm run android` / `npm run ios` / `npm run web`.
- Web export: `npm run build` (static to `dist/`, Netlify config in `netlify.toml`).
- EAS: profiles in `eas.json`. Build with `eas build -p android|ios --profile production`. OTA updates via `eas update`.

## Architecture

- Navigation: expo-router with file-based routes in `app/`. Root stack and header lives in `app/_layout.tsx`.
  - Bottom bar: `components/navigation/BottomNavigation.tsx` shows on most routes (hidden on `/`, `/login`, `/csatlakozom`).
- State: Redux in `redux/` with persisted store (`redux/store.ts`). UI options, dialogs, loading handled via `infoReducer` and `components/InfoLayer`.
- Backend: Supabase client in `lib/supabase/supabase.ts` using generated types in `database.types.ts`. Edge Functions under `supabase/functions/` are invoked from the app.
- UI: Prefer React Native Paper components. Themed wrappers `components/ThemedText` and `components/ThemedView` are used across the app.
- Maps: Use the wrapper from `components/mapView/mapView` (exports `MapView`, `Marker`, `Circle`), not `react-native-maps` directly; for selection use `components/MapSelector/MapSelector`.

## Data patterns (Supabase)

- Always import the typed client from `lib/supabase/supabase`. Table types come from `Database` in `database.types.ts`.
- Locations are stored/consumed as WKT strings: `POINT(<lon> <lat>)`. Use `locationToCoords` to parse; when writing build the `POINT` string from coordinates.
- Edge workflows: creating/updating a biznisz uses `supabase.functions.invoke("create-buziness", { body: { ... }})` (see `components/buziness/BuzinessEditScreen.tsx`). Images are uploaded first, then table row updated with `images` JSON strings (`getImagesUrlFromSupabase` helps reading them).
- Contacts: when building payloads (e.g., save in `ContactEditScreen.tsx`), ensure server-generated columns (like `id`) are not null on upsert; let the DB generate `id` and avoid sending `null`.

## Navigation and header actions

- To add header actions, dispatch `setOptions([...])` from `infoReducer`. `app/_layout.tsx` reads these and renders Paper `Appbar` actions. Example: `BuzinessEditScreen` sets a "Mentés" action that calls `save()` while showing global loading via `showLoading`/`hideLoading`.
- For deep links and navigation in UI, use `Link` from `expo-router`. On Android, wrap touch targets in `Pressable`/`TouchableRipple` and use `Link asChild` to ensure presses register.

## Maps and search UX

- Use `MapSelector` for picking a location. When adding search, debounce input (see `components/MapSelector/MapSelector.tsx` guidance) and update `setData` with `{ location: { latitude, longitude }, radius? }`.

## Conventions

- TypeScript everywhere. Keep UI styles inline or colocated as in current files; reuse `constants/Styles.ts` and `constants/Colors.ts` when applicable.
- Images: some views use `expo-image` (`Image` from `expo-image`); elsewhere RN `Image`. Follow existing import in the file.
- Keep `patch-package` patches (e.g., `patches/wkx+0.5.0.patch`) intact; postinstall runs automatically.

## Platform gotchas

- Node polyfills: `wkx` requires `util`. We alias/polyfill via `util` dependency and `metro.config.ts`. Don’t import Node core modules directly elsewhere.
- Android build:
  - Package/bundle IDs are `com.fife.app` (see `app.json`).
  - If autolinking errors mention package name, verify `app.json` and Android `namespace`/`applicationId` are consistent.
  - Gradle warnings may appear; prefer SDK 33+ configuration as set by Expo SDK 52.

## Key files to read

- Navigation: `app/_layout.tsx`, `components/navigation/BottomNavigation.tsx`.
- Biznisz flow: `components/buziness/BuzinessEditScreen.tsx`, `components/buziness/BuzinessList.tsx`, `components/buziness/BuzinessItem.tsx`.
- Map selection: `components/MapSelector/MapSelector.tsx`, `components/mapView/mapView.tsx`.
- Global UI: `components/InfoLayer.tsx`, `redux/reducers/infoReducer.ts`.
- Supabase client: `lib/supabase/supabase.ts`; types: `database.types.ts`.

If any of the above feels out of date (e.g., routes, reducers, or build profiles), ask to confirm and I’ll update this guide.
