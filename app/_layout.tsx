import "@expo/match-media"; // enables window.matchMedia across platforms
import InfoLayer from "@/components/InfoLayer";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { persistor, store } from "@/redux/store";
import { Stack, usePathname } from "expo-router";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemedView } from "@/components/ThemedView";
import { theme } from "@/assets/theme";
import Piazzolla from "@/assets/fonts/Piazzolla.ttf";
import RedHatText from "@/assets/fonts/RedHatText.ttf";
import PiazzollaExtraBold from "@/assets/fonts/Piazzolla-ExtraBold.ttf";
import { MyAppbar } from "@/components/MyAppBar";
import "@/i18n";
import { useTranslation } from "react-i18next";
import { RootState } from "@/redux/store";

function AppContent() {
  const pathname = usePathname();
  const { i18n, t } = useTranslation();
  const language = useSelector((state: RootState) => state.language.language);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  return (
    <ThemedView type="card" style={{ width: "100%", flex: 1, alignContent: "center", backgroundColor: theme.colors.backdrop }}>
      <View style={pathname == "/" ? { flex: 1 } : { maxWidth: 600, width: "100%", flex: 1, alignSelf: "center" }}>
        <InfoLayer />
        <Stack
          screenOptions={{ header: () => <MyAppbar /> }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="login/index"
            options={{ title: t("navigation.login") }}
          />
          <Stack.Screen
            name="biznisz/index"
            options={{ title: t("navigation.biznisz") }}
          />
          <Stack.Screen
            name="csatlakozom"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="biznisz/new"
            options={{ title: t("navigation.newBiznisz") }}
          />
          <Stack.Screen
            name="biznisz/[id]"
            options={{ title: t("navigation.fifeBiznisz") }}
          />
          <Stack.Screen
            name="biznisz/edit/[id]"
            options={{ title: t("navigation.fifeBiznisz") }}
          />
          <Stack.Screen
            name="user/[uid]"
            options={{ title: t("navigation.fifeProfile") }}
          />
          <Stack.Screen
            name="user/edit"
            options={{ title: t("navigation.editProfile") }}
          />
          <Stack.Screen
            name="user/password-reset"
            options={{ title: t("navigation.passwordReset") }}
          />
        </Stack>
        {pathname !== "/" && !pathname.includes("projekt") &&
          !pathname.includes("login") &&
          !pathname.includes("password") &&
          !pathname.includes("csatlakozom") && <BottomNavigation />}
      </View>
    </ThemedView>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Piazzolla,
    RedHatText,
    "Piazzolla-ExtraBold": PiazzollaExtraBold,
  });

  if (loaded)
    return (
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <PaperProvider theme={theme}>
            <AppContent />
          </PaperProvider>
        </PersistGate>
      </Provider>
    );
}
