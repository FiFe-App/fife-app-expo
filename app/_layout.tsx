import InfoLayer from "@/components/InfoLayer";
import FirebaseProvider from "@/lib/firebase/firebase";
import { persistor, RootState, store } from "@/lib/redux/store";
import { NativeStackHeaderProps } from "@react-navigation/native-stack/lib/typescript/src/types";
import { router, Stack, useNavigation, usePathname } from "expo-router";
import { Appbar, Menu, PaperProvider } from "react-native-paper";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { clearOptions } from "@/lib/redux/reducers/infoReducer";
import { useWindowDimensions } from "react-native";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <FirebaseProvider>
          <PaperProvider>
            <InfoLayer />
            <Stack
              screenOptions={{ header: (props) => <MyAppbar {...props} /> }}
            >
              <Stack.Screen name="index" options={{ title: "FiFe app" }} />
              <Stack.Screen
                name="login/index"
                options={{ title: "Bejelentkezés" }}
              />
              <Stack.Screen
                name="csatlakozom/index"
                options={{ title: "Mi ez?" }}
              />
              <Stack.Screen
                name="csatlakozom/csatlakozom"
                options={{ title: "Csatlakozom" }}
              />
              <Stack.Screen
                name="csatlakozom/regisztracio"
                options={{ title: "Regisztráció" }}
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
                name="user/[uid]"
                options={{ title: "FiFe Profil" }}
              />
              <Stack.Screen
                name="user/edit"
                options={{ title: "Profil Szerkesztése" }}
              />
              <Stack.Screen
                name="contact-edit"
                options={{ title: "Új Elérhetőség" }}
              />
              <Stack.Screen
                name="contact-edit/[editId]"
                options={{ title: "Elérhetőség Szerkesztése" }}
              />
            </Stack>
          </PaperProvider>
        </FirebaseProvider>
      </PersistGate>
    </Provider>
  );
}

const MyAppbar = (props: NativeStackHeaderProps) => {
  const navigation = useNavigation();
  const pathname = usePathname();
  const { options } = useSelector((state: RootState) => state.info);
  const [showMenu, setShowMenu] = useState(false);
  const { width } = useWindowDimensions();
  const dispatch = useDispatch();
  const segments = useSegments();

  useEffect(() => {
    console.log(segments);

    dispatch(clearOptions());
  }, [dispatch, segments]);

  return (
    <Appbar.Header mode="center-aligned">
      {navigation.canGoBack() ? (
        <Appbar.BackAction onPress={navigation.goBack} />
      ) : (
        pathname !== "/" && (
          <Appbar.BackAction onPress={() => router.replace("/")} />
        )
      )}
      <Appbar.Content title={props.options.title} />
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
            {options.map((option) => (
              <Menu.Item
                onPress={option.onPress}
                title={option.title}
                leadingIcon={option.icon}
              />
            ))}
          </Menu>
        </>
      )}
    </Appbar.Header>
  );
};
