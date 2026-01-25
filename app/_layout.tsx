import "@expo/match-media"; // enables window.matchMedia across platforms
import InfoLayer from "@/components/InfoLayer";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { persistor, store } from "@/redux/store";
import { Stack, usePathname } from "expo-router";
import React from "react";
import { useFonts } from "expo-font";
import { View, StatusBar } from "react-native";
import { PaperProvider } from "react-native-paper";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemedView } from "@/components/ThemedView";
import { getTheme } from "@/assets/theme";
import Piazzolla from "@/assets/fonts/Piazzolla.ttf";
import RedHatText from "@/assets/fonts/RedHatText.ttf";
import PiazzollaExtraBold from "@/assets/fonts/Piazzolla-ExtraBold.ttf";
import { MyAppbar } from "@/components/MyAppBar";
import { RootState } from "@/redux/store";

function RootContent() {
  const pathname = usePathname();
  const themePreference = useSelector((state: RootState) => state.user.themePreference) || "light";
  const theme = getTheme(themePreference);

  return (
    <>
      <StatusBar 
        barStyle={themePreference === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />
      <ThemedView type="card" style={{ width: "100%", flex: 1, alignContent: "center", backgroundColor: theme.colors.backdrop }}>
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
                name="biznisz/new"
                options={{ title: "Új Biznisz" }}
              />
              <Stack.Screen
                name="biznisz/[id]"
                options={{ title: "FiFe Biznisz" }}
              />
              <Stack.Screen
                name="biznisz/edit/[id]"
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
    </>
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
          <RootContent />
        </PersistGate>
      </Provider>
    );
}
