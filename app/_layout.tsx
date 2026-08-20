import InfoLayer from "@/components/InfoLayer";
import { SplashAnimation } from "@/components/SplashAnimation";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { persistor, store } from "@/redux/store";
import { Stack, usePathname, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
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
import MessagesAppbarAction from "@/components/navigation/MessagesAppbarAction";
import { RootState } from "@/redux/store";
import { setLocation, logout, setNotificationPrefs, setMessagingEnabled } from "@/redux/reducers/userReducer";
import { fetchMessagingEnabled } from "@/lib/chat/messagingContact";
import { clearEmotionLogs } from "@/redux/reducers/emotionLogsReducer";
import { clearDrafts } from "@/redux/reducers/chatReducer";
import { supabase } from "@/lib/supabase/supabase";
import { registerForPushNotificationsAsync } from "@/lib/notifications/registerForPushNotifications";
import { scheduleDailyEmotionReminder, cancelDailyEmotionReminder } from "@/lib/notifications/scheduleDailyEmotionReminder";
import { setStatusBarColor } from "@/redux/reducers/infoReducer";
import { useEmotionLog } from "@/hooks/useEmotionLog";
import { useAppVersionGate } from "@/hooks/useAppVersionGate";
import UpdateRequiredScreen from "@/components/version/UpdateRequiredScreen";
import UpdateAvailableCard from "@/components/version/UpdateAvailableCard";
import { emotionAvailable } from "@/constants/emotionTiming";

// Resets on hard reload (new JS execution), survives React remounts within the same page load
let splashAlreadyShown = false;

function HomeHeader({ showMessages }: { showMessages?: boolean }) {
  return (
    <MyAppbar
      center={<FakeSearchInput />}
      actions={showMessages ? <MessagesAppbarAction /> : undefined}
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

  const { syncPendingLogs, loadFromServer } = useEmotionLog();
  const versionGate = useAppVersionGate();

  // Manage Supabase token auto-refresh and offline sync on foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
        if (uid && emotionAvailable) syncPendingLogs();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => sub.remove();
  }, [uid, syncPendingLogs]);

  // Keep Redux auth state in sync with Supabase session
  useEffect(() => {
    // On startup: if Redux's uid doesn't match the actual Supabase session
    // (missing, or belonging to a different account left over from a prior
    // login on this device), clear Redux so we don't show the wrong user.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (uid && (!session || session.user.id !== uid)) {
        dispatch(logout());
        dispatch(clearEmotionLogs());
        dispatch(clearDrafts());
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        // Refresh token expired or explicit sign-out — clear Redux to match
        dispatch(logout());
        dispatch(clearEmotionLogs());
        dispatch(clearDrafts());
      } else if (uid && session && session.user.id !== uid) {
        // Session belongs to a different account than Redux thinks — resync
        dispatch(logout());
        dispatch(clearEmotionLogs());
        dispatch(clearDrafts());
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

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

  // `messagingEnabled` is persisted, so a stale value decides whether the chat
  // link shows long before any screen re-checks it. Refresh it on every start.
  useEffect(() => {
    if (!uid) return;
    fetchMessagingEnabled(uid).then((enabled) => {
      if (enabled !== null) dispatch(setMessagingEnabled(enabled));
    });
  }, [uid, dispatch]);

  // Hydrate notification prefs on login, then reconcile the things that
  // live outside the database: the Expo push token (which can be
  // invalidated by a reinstall) and the scheduled local reminder.
  // The prefs themselves are only ever changed through
  // useNotificationPrefs — this effect never writes them.
  useEffect(() => {
    if (!uid) return;
    supabase.rpc("get_my_notification_prefs").then(async ({ data }) => {
      const prefs = data?.[0];
      if (!prefs) return;
      dispatch(setNotificationPrefs({
        notifyPush: prefs.notify_push ?? false,
        notifyEmail: prefs.notify_email ?? true,
        newsletter: prefs.newsletter ?? false,
        emotionDailyPrompt: prefs.emotion_daily_prompt ?? false,
        pushAskedAt: prefs.push_asked_at ?? null,
        emotionPromptAskedAt: prefs.emotion_prompt_asked_at ?? null,
        newsletterAskedAt: prefs.newsletter_asked_at ?? null,
      }));
      if (Platform.OS === "web") return;
      if (prefs.notify_push) {
        const token = await registerForPushNotificationsAsync();
        if (token) await supabase.rpc("update_my_push_token", { token });
      }
      if (emotionAvailable && prefs.emotion_daily_prompt) {
        await scheduleDailyEmotionReminder();
      } else {
        await cancelDailyEmotionReminder();
      }
    });
  }, [uid, dispatch]);

  const router = useRouter();

  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const url = data?.url;
      if (typeof url === "string" && url.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(url as any);
      }
    };

    if (Platform.OS !== "web") {
      const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response) handleResponse(response);
      }).catch(() => {});
      return () => subscription.remove();
    }
    return undefined;
  }, [router]);

  // Load and sync emotion logs on login
  useEffect(() => {
    if (!uid || !emotionAvailable) return;
    loadFromServer();
    syncPendingLogs();
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

  // A blocked build never reaches the router: an old client talking to a
  // backend it no longer matches is exactly what the gate exists to stop.
  if (versionGate.blocked) {
    return (
      <PaperProvider theme={theme}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <UpdateRequiredScreen
            status={versionGate.status}
            currentVersion={versionGate.currentVersion}
            checking={versionGate.checking}
            onRetry={versionGate.recheck}
          />
        </SafeAreaView>
      </PaperProvider>
    );
  }

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
              <Stack.Protected guard={!!uid}>
                <Stack.Screen
                  name="me"
                  options={{ header: () => <HomeHeader /> }}
                />
                <Stack.Screen
                  name="home"
                  options={{ header: () => <HomeHeader showMessages /> }}
                />
                <Stack.Screen
                  name="fifeRadar"
                  options={{ header: () => <HomeHeader /> }}
                />
                <Stack.Screen
                  name="biznisz/index"
                  options={{ title: "Bizniszek keresése" }}
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
                  options={{ title: "Biznisz" }}
                />
                <Stack.Screen
                  name="biznisz/edit/[editId]"
                  options={{ title: "Biznisz szerkesztése" }}
                />
                <Stack.Screen
                  name="user/[uid]"
                  options={{ title: "Profil" }}
                />
                <Stack.Screen
                  name="user/edit"
                  options={{ title: "Profil szerkesztése" }}
                />
                <Stack.Screen
                  name="chats"
                  options={{ title: "Üzeneteid" }}
                />
                <Stack.Screen
                  name="chat/[uid]"
                  options={{ title: "Üzenet" }}
                />
                <Stack.Screen
                  name="user/emotion-history"
                  options={{ title: "Napló" }}
                />
                <Stack.Screen
                  name="user/get-help"
                  options={{ title: "Segítség kell?" }}
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
                  name="user/deleted-account"
                  options={{ headerShown: false, title: "Fiók törölve" }}
                />

              </Stack.Protected>
              <Stack.Screen
                name="user/password-reset"
                options={{ title: "Jelszó visszaállítás" }}
              />
            </Stack>
                        {/* Only inside the app itself — the nudge has no business on the
                public landing page or in the middle of signing up. */}
            {versionGate.updateAvailable && versionGate.status && !!uid &&
              pathname !== "/" && !pathname.includes("csatlakozom") && (
              <UpdateAvailableCard
                status={versionGate.status}
                onDismiss={versionGate.dismissUpdate}
              />
            )}
            {pathname !== "/" && !pathname.includes("projekt") &&
              !pathname.includes("login") &&
              !pathname.includes("password") &&
              !pathname.includes("user/deleted-account") &&
              !pathname.includes("csatlakozom") &&
              pathname !== "/biznisz/new" &&
              !pathname.startsWith("/biznisz/edit") && <BottomNavigation />}
          </View>
        </ThemedView>
        <View style={{bottom:0,height:30,width:"100%",backgroundColor:theme.colors.elevation.level1,position:"absolute",zIndex:-1}}/>
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
