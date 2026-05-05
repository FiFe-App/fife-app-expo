import InfoLayer from "@/components/InfoLayer";
import { SplashAnimation } from "@/components/SplashAnimation";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { persistor, store } from "@/redux/store";
import { Stack, usePathname } from "expo-router";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { View, StatusBar, useColorScheme, Platform } from "react-native";
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
import BuzinessSearchInput from "@/components/BuzinessSearchInput";
import { storeBuzinesses } from "@/redux/reducers/buzinessReducer";
import { router } from "expo-router";
import { RootState } from "@/redux/store";
import { setLocation } from "@/redux/reducers/userReducer";
import { supabase } from "@/lib/supabase/supabase";
import { registerForPushNotificationsAsync } from "@/lib/notifications/registerForPushNotifications";

function HomeHeader() {
  const dispatch = useDispatch();
  return (
    <MyAppbar
      center={
        <BuzinessSearchInput
          onSearch={() => {
            dispatch(storeBuzinesses([]));
            router.push("/biznisz");
          }}
        />
      }
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
  const hasInitialized = React.useRef(false);

  // On first load only, mark as initialized
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
    }
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
      NavigationBar.setBackgroundColorAsync(theme.colors.background);
      NavigationBar.setButtonStyleAsync(isDarkMode ? "light" : "dark");
    }
  }, [isDarkMode, theme.colors.background]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["left", "right", "bottom"]}>
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

              </Stack.Protected>
            </Stack>
            {pathname !== "/" && !pathname.includes("projekt") &&
              !pathname.includes("login") &&
              !pathname.includes("password") &&
              !pathname.includes("csatlakozom") && <BottomNavigation />}
          </View>
        </ThemedView>
      </SafeAreaView>
    </PaperProvider>
  );
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = React.useState(false);
  const colorScheme = useColorScheme(); 
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
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colorScheme == "dark" ? "#232323" : "#fff5e0" }}>
        <SafeAreaProvider>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <RootContent />
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
        {!splashDone && (
          <SplashAnimation onFinished={() => setSplashDone(true)} />
        )}
      </GestureHandlerRootView>
    );
}
