import InfoLayer from "@/components/InfoLayer";
import { SplashAnimation } from "@/components/SplashAnimation";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { persistor, store } from "@/redux/store";
import { Stack, usePathname } from "expo-router";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { View, StatusBar, useColorScheme, Platform, AppState } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { PaperProvider } from "react-native-paper";
import { Provider, useSelector, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemedView } from "@/components/ThemedView";
import { getTheme } from "@/assets/theme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Piazzolla from "@/assets/fonts/Piazzolla.ttf";
import PiazzollaRegular from "@/assets/fonts/Piazzolla-Regular.ttf";
import PiazzollaLight from "@/assets/fonts/Piazzolla-Light.ttf";
import PiazzollaMedium from "@/assets/fonts/Piazzolla-Medium.ttf";
import PiazzollaExtraBold from "@/assets/fonts/Piazzolla-ExtraBold.ttf";
import RedHatText from "@/assets/fonts/RedHatText.ttf";
import RedHatTextRegular from "@/assets/fonts/RedHatText-Regular.ttf";
import RedHatTextLight from "@/assets/fonts/RedHatText-Light.ttf";
import RedHatTextMedium from "@/assets/fonts/RedHatText-Medium.ttf";
import RedHatTextBold from "@/assets/fonts/RedHatText-Bold.ttf";
import { MyAppbar } from "@/components/MyAppBar";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import FakeSearchInput from "@/components/FakeSearchInput";
import { RootState } from "@/redux/store";
import { setLocation, logout } from "@/redux/reducers/userReducer";
import { supabase } from "@/lib/supabase/supabase";
import { registerForPushNotificationsAsync } from "@/lib/notifications/registerForPushNotifications";
import { setStatusBarColor } from "@/redux/reducers/infoReducer";

// Resets on hard reload (new JS execution), survives React remounts within the same page load
let splashAlreadyShown = false;

function HomeHeader() {
  return (
    <MyAppbar
      center={<FakeSearchInput />}
      style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }}
    />
  );
}

function RootContent() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const deviceColorScheme = useColorScheme(); // Auto-detect device theme
  const userThemePreference = useSelector((state: RootState) => state.user.themePreference);
  const { uid } = useSelector((state: RootState) => state.user);
  const { statusBarColor, bottomBarColor } = useSelector((state: RootState) => state.info);
  const hasInitialized = React.useRef(false);

  // On first load only, mark as initialized
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
    }
  }, []);

  // Manage Supabase token auto-refresh based on whether app is in foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => sub.remove();
  }, []);

  // Keep Redux auth state in sync with Supabase session
  useEffect(() => {
    // On startup: if Redux has a uid but Supabase has no valid session, clear Redux
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (uid && !session) dispatch(logout());
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        // Refresh token expired or explicit sign-out — clear Redux to match
        dispatch(logout());
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user location from Supabase on mount
  useEffect(() => {
    if (!uid) return;
    supabase.rpc("get_my_profile_location").then(({ data: loc }) => {
      const myLoc = loc?.[0];
      if (!myLoc?.location_wkt) return;
      const match = myLoc.location_wkt.match(/POINT\(([\d.-]+) ([\d.-]+)\)/);
      if (match) {
        dispatch(setLocation({
          latitude: parseFloat(match[2]),
          longitude: parseFloat(match[1]),
          radius: myLoc.location_radius_m ?? 0,
        }));
      }
    });
  }, [uid, dispatch]);

  // Register push token if user opted in to push notifications
  useEffect(() => {
    if (!uid || Platform.OS === "web") return;
    supabase.rpc("get_my_notification_prefs").then(async ({ data }) => {
      if (!data?.[0]?.notify_push) return;
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await supabase.rpc("update_my_push_token", { token });
      }
    });
  }, [uid]);

  // Determine if dark mode should be active based on preference
  const isDarkMode =
    userThemePreference === "dark" ||
    (userThemePreference === "auto" && deviceColorScheme === "dark");
  const theme = getTheme(isDarkMode);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(bottomBarColor || theme.colors.background);
      NavigationBar.setButtonStyleAsync(isDarkMode ? "light" : "dark");
    }
    if (pathname.includes("csatlakozom") || pathname=="/")
      dispatch(setStatusBarColor(theme.colors.background));
    else
      dispatch(setStatusBarColor(theme.colors.surface));
  }, [isDarkMode, theme.colors.background, bottomBarColor, dispatch, pathname]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: statusBarColor || theme.colors.surface }}>
        <ThemedView type="card" style={{ width: "100%", flex: 1, alignContent: "center", backgroundColor: theme.colors.background }}>
          <View style={pathname == "/" ? { flex: 1 } : { maxWidth: 600, width: "100%", flex: 1, alignSelf: "center" }}>
            <InfoLayer />
            <Stack
              screenOptions={{ header: (props: NativeStackHeaderProps) => <MyAppbar title={props.options.title} /> }}
            >
              <Stack.Screen name="index" />
              <Stack.Protected guard={!!uid}>
                <Stack.Screen
                  name="home"
                  options={{ header: () => <HomeHeader /> }}
                />
                <Stack.Screen
                  name="biznisz/index"
                  options={{ title: "Biznisz" }}
                />

                <Stack.Screen
                  name="search"
                  options={{ headerShown: true }}
                />

                <Stack.Screen
                  name="biznisz/new"
                  options={{ title: "Új Biznisz" }}
                />
                <Stack.Screen
                  name="biznisz/[id]"
                  options={{ title: "FiFe Biznisz" }}
                />
                <Stack.Screen
                  name="biznisz/edit/[editId]"
                  options={{ title: "FiFe Biznisz" }}
                />
                <Stack.Screen
                  name="user/[uid]"
                  options={{ title: "FiFe Profil" }}
                />
                <Stack.Screen
                  name="user/edit"
                  options={{ title: "Profil Szerkesztése" }}
                />
              </Stack.Protected>

              <Stack.Protected guard={!uid}>

                <Stack.Screen
                  name="login/index"
                  options={{ title: "Bejelentkezés" }}
                />
                <Stack.Screen
                  name="csatlakozom"
                  options={{ headerShown: false, animation: "slide_from_right" }}
                />
                <Stack.Screen
                  name="user/password-reset"
                  options={{ title: "Jelszó visszaállítás" }}
                />
                <Stack.Screen
                  name="user/deleted-account"
                  options={{ headerShown: false, title: "Fiók törölve" }}
                />

              </Stack.Protected>
            </Stack>
            {pathname !== "/" && !pathname.includes("projekt") &&
              !pathname.includes("login") &&
              !pathname.includes("password") &&
              !pathname.includes("user/deleted-account") &&
              !pathname.includes("csatlakozom") &&
              pathname !== "/biznisz/new" &&
              !pathname.startsWith("/biznisz/edit") && <BottomNavigation />}
          </View>
        </ThemedView>
      </SafeAreaView>
    </PaperProvider>
  );
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = React.useState(splashAlreadyShown);
  const colorScheme = useColorScheme(); 
  const bgColor = colorScheme == "dark" ? "#1e1b16" : colorScheme == "light" ? "#fff5e0" : "transparent";
  const [loaded] = useFonts({
    Piazzolla,
    "Piazzolla-Regular": PiazzollaRegular,
    "Piazzolla-Light": PiazzollaLight,
    "Piazzolla-Medium": PiazzollaMedium,
    "Piazzolla-ExtraBold": PiazzollaExtraBold,
    RedHatText,
    "RedHatText-Regular": RedHatTextRegular,
    "RedHatText-Light": RedHatTextLight,
    "RedHatText-Medium": RedHatTextMedium,
    "RedHatText-Bold": RedHatTextBold,
  });

  if (loaded)
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: bgColor }}>
        <SafeAreaProvider>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <RootContent />
              {!splashDone && (
                <SplashAnimation onFinished={() => {
                  splashAlreadyShown = true;
                  setSplashDone(true);
                }} />
              )}
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
}
