import InfoLayer from "@/components/InfoLayer";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { clearOptions } from "@/redux/reducers/infoReducer";
import { persistor, RootState, store } from "@/redux/store";
import { Stack, useNavigation, usePathname, useSegments } from "expo-router";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import React from "react";
import { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import { Appbar, Menu, PaperProvider } from "react-native-paper";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

export default function RootLayout() {
  const pathname = usePathname();
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <PaperProvider>
          <InfoLayer />
          <Stack screenOptions={{ header: (props) => <MyAppbar {...props} /> }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="login/index"
              options={{ title: "Bejelentkezés" }}
            />
            <Stack.Screen name="biznisz/index" options={{ title: "Biznisz" }} />
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
              options={{ headerShown: false, title: "FiFe Biznisz" }}
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
          </Stack>
          {pathname !== "/" &&
            !pathname.includes("login") &&
            !pathname.includes("csatlakozom") && <BottomNavigation />}
        </PaperProvider>
      </PersistGate>
    </Provider>
  );
}

const MyAppbar = (props: NativeStackHeaderProps) => {
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

  if (pathname === "/biznisz") return;
  return (
    <Appbar.Header mode="center-aligned">
      {false && <Appbar.BackAction onPress={navigation.goBack} />}
      <Appbar.Content title={props.options.title || "FiFe App"} />
      {options?.length === 1 && <Appbar.Action {...options[0]} />}
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
    </Appbar.Header>
  );
};
