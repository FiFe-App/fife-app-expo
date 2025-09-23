import "@expo/match-media"; // enables window.matchMedia across platforms
import InfoLayer from "@/components/InfoLayer";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { clearOptions } from "@/redux/reducers/infoReducer";
import { persistor, RootState, store } from "@/redux/store";
import { Link, Stack, useNavigation, usePathname, useSegments } from "expo-router";
import React, { ReactNode } from "react";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { useWindowDimensions, View, ViewStyle } from "react-native";
import { Appbar, Menu, PaperProvider } from "react-native-paper";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemedView } from "@/components/ThemedView";
import { theme } from "@/assets/theme";
import Piazzolla from "@/assets/fonts/Piazzolla.ttf";
import RedHatText from "@/assets/fonts/RedHatText.ttf";
import PiazzollaExtraBold from "@/assets/fonts/Piazzolla-ExtraBold.ttf";
import { Image } from "expo-image";
import Smiley from "@/components/Smiley";

export default function RootLayout() {
  const pathname = usePathname();
  const [loaded] = useFonts({
    Piazzolla,
    RedHatText,
    "Piazzolla-ExtraBold": PiazzollaExtraBold,
  });

  if (loaded)
    return (
      <ThemedView type="card" style={{width:"100%",flex:1,alignContent:"center",backgroundColor:theme.colors.backdrop}}>
        <View style={pathname=="/" ? {flex:1} : {maxWidth:600,width:"100%",flex:1,alignSelf:"center"}}>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <PaperProvider theme={theme}>
                <InfoLayer />
                <Stack
                  screenOptions={{ header: () => <MyAppbar  /> }}
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
            </PersistGate>
          </Provider>
        </View>
      </ThemedView>
    );
}

export const MyAppbar = ({ center, style }: { center?: ReactNode, style?: ViewStyle }) => {
  const navigation = useNavigation();
  const { options } = useSelector((state: RootState) => state.info);
  const [showMenu, setShowMenu] = useState(false);
  const { width } = useWindowDimensions();
  const dispatch = useDispatch();
  const segments = useSegments();
  const pathname = usePathname();

  useEffect(() => {
    dispatch(clearOptions());
  }, [dispatch, segments]);

  return (
    <Appbar.Header
      mode="center-aligned"
      style={[{
        backgroundColor: theme.colors.background,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        borderBottomColor: "rgba(0,0,0,0.06)",
        borderBottomWidth: 0.5,
        alignItems: "center",
        width: "100%"
      }, style]}
    >
      {navigation.canGoBack() && pathname !== "/home" && pathname !== "/" ? <Appbar.BackAction onPress={navigation.goBack} /> : <View style={{ width: 48 }} />}
      {center || <Link href="/" style={{ flex: 1 }} asChild>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}><Smiley />
          <Image
            source={require("../assets/Logo.png")}
            style={{ width: 180, height: 30, zIndex: 20 }}
            contentFit="contain"
          /></View>
      </Link>}
      {options.length > 0 ?
        <> {options?.length === 1 && <Appbar.Action {...options[0]} />}
          {options?.length > 1 && (
            <>
              <Appbar.Action
                icon="dots-vertical"
                onPress={() => setShowMenu(true)}
              />
              <Menu
                anchor={{ x: width, y: 0 }}
                visible={showMenu}
                onDismiss={() => setShowMenu(false)}
              >
                {options.map((option, ind) => (
                  <Menu.Item
                    key={"option" + ind}
                    onPress={option.onPress}
                    title={option.title}
                    disabled={option.disabled}
                    leadingIcon={option.icon}
                  />
                ))}
              </Menu>
            </>
          )}
        </> : <View style={{ width: 48 }} />}
    </Appbar.Header>
  );
};
