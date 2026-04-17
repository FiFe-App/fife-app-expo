import InfoLayer from "@/components/InfoLayer";
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
import { getTheme, DEFAULT_THEME_PREFERENCE } from "@/assets/theme";
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
import { RootState } from "@/redux/store";
import { setThemePreference } from "@/redux/reducers/userReducer";

function RootContent() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const deviceColorScheme = useColorScheme(); // Auto-detect device theme
  const userThemePreference = useSelector((state: RootState) => state.user.themePreference);
  const hasInitialized = React.useRef(false);

  // On first load only, mark as initialized
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
    }
  }, []);

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

  return (<>
    <StatusBar
      barStyle={isDarkMode ? "light-content" : "dark-content"}
      backgroundColor={theme.colors.background}
    />
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["left", "right","bottom"]}>
      <ThemedView type="card" style={{ width: "100%", flex: 1, alignContent: "center", backgroundColor: theme.colors.background }}>
        <View style={pathname == "/" ? { flex: 1 } : { maxWidth: 600, width: "100%", flex: 1, alignSelf: "center" }}>
          <PaperProvider theme={theme}>
            <InfoLayer />
            <Stack
              screenOptions={{ header: () => <MyAppbar /> }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen
                name="login/index"
                options={{ title: "Bejelentkezés" }}
              />
              <Stack.Screen
                name="biznisz/index"
                options={{ title: "Biznisz" }}
              />
              <Stack.Screen
                name="csatlakozom"
                options={{ headerShown: false, animation: "slide_from_right" }}
              />
              <Stack.Screen
                name="(protected)/biznisz/new"
                options={{ title: "Új Biznisz" }}
              />
              <Stack.Screen
                name="(protected)/biznisz/[id]"
                options={{ title: "FiFe Biznisz" }}
              />
              <Stack.Screen
                name="(protected)/biznisz/edit/[editId]"
                options={{ title: "FiFe Biznisz" }}
              />
              <Stack.Screen
                name="(protected)/user/[uid]"
                options={{ title: "FiFe Profil" }}
              />
              <Stack.Screen
                name="(protected)/user/edit"
                options={{ title: "Profil Szerkesztése" }}
              />
              <Stack.Screen
                name="user/password-reset"
                options={{ title: "Jelszó visszaállítás" }}
              />
            </Stack>
            {pathname !== "/" && !pathname.includes("projekt") &&
              !pathname.includes("login") &&
              !pathname.includes("password") &&
              !pathname.includes("csatlakozom") && <BottomNavigation />}
          </PaperProvider>
        </View>
      </ThemedView>
    </SafeAreaView>
  </>);
}

export default function RootLayout() {
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <RootContent />
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
}
