import { ThemedView } from "@/components/ThemedView";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import {
  Href,
  Link,
  Redirect,
  Stack,
  useGlobalSearchParams,
  usePathname,
} from "expo-router";
import { View } from "react-native";
import Dots from "react-native-dots-pagination";
import { Button, MD3DarkTheme } from "react-native-paper";
import { useSelector } from "react-redux";

export default function RootLayout() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const pages: Href<string>[] = [
    "/csatlakozom/",
    "/csatlakozom/iranyelvek",
    "/csatlakozom/regisztracio",
    "/csatlakozom/elso-lepesek",
  ];
  const canGoNext = !!useGlobalSearchParams().canGoNext;

  const path = usePathname().split("#")[0];
  console.log(path);

  const index = pages.findIndex((page) => {
    return page === path;
  });

  const current = index < 0 ? 0 : index;

  const prev: Href<string> = pages[current - 1 || 0] || "";
  const next: Href<string> = pages[current + 1 || 0] || "";

  if (uid && path === "/csatlakozom") return <Redirect href="/user" />;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="iranyelvek" options={{ headerShown: false }} />
        <Stack.Screen name="regisztracio" options={{ title: "Regisztráció" }} />
        <Stack.Screen name="elso-lepesek" options={{ title: "Regisztráció" }} />
      </Stack>
      <ThemedView style={{ alignItems: "center", width: "100%" }}>
        <Dots
          length={pages.length}
          active={current}
          activeColor={MD3DarkTheme.colors.onPrimary}
        />
        <View
          style={{
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexDirection: "row",
            width: "100%",
            padding: 16,
          }}
        >
          <Link href={current === 0 ? "/" : prev} asChild>
            <Button
              disabled={(!prev || current === 3) && current !== 0}
              mode="contained"
            >
              Vissza
            </Button>
          </Link>
          <Link href={next} asChild>
            <Button
              disabled={!next || (current === 1 && !canGoNext) || current === 2}
              mode="contained"
            >
              Tovább
            </Button>
          </Link>
        </View>
      </ThemedView>
    </>
  );
}
