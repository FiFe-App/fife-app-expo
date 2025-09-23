import { theme } from "@/assets/theme";
import { useBreakpoint } from "@/components/layout/ResponsiveLayout";
import { ThemedView } from "@/components/ThemedView";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import {
  Href,
  Link,
  Redirect,
  Stack,
  useGlobalSearchParams,
  usePathname,
} from "expo-router";
import { ScrollView, View } from "react-native";
import Dots from "react-native-dots-pagination";
import { Button, MD3DarkTheme } from "react-native-paper";
import { useSelector } from "react-redux";

export default function RootLayout() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const pages: Href<string>[] = [
    "/csatlakozom/",
    "/csatlakozom/megbizhatosag",
    "/csatlakozom/email-regisztracio",
    "/csatlakozom/email-ellenorzes",
    "/csatlakozom/elso-lepesek",
  ];
  const canGoNext = useGlobalSearchParams().canGoNext === "true";
  const { screenPadding } = useBreakpoint();

  const path = usePathname().split("#")[0];
  console.log(path);

  const index = pages.findIndex((page) => {
    return page === path;
  });

  const current = index < 0 ? 0 : index;

  const prev: Href<string> = pages[current - 1 || 0] || "";
  const next: Href<string> = pages[current + 1 || 0] || "";
  console.log(path == "/csatlakozom/megbizhatosag" && canGoNext);


  if (uid && path === "/csatlakozom") return <Redirect href="/user" />;

  return (
    <ThemedView type="default" style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flex: 1, padding: screenPadding }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="iranyelvek" options={{ headerShown: false }} />
          <Stack.Screen
            name="regisztracio"
            options={{ title: "Regisztráció" }}
          />
          <Stack.Screen
            name="email-regisztracio"
            options={{ title: "Regisztráció" }}
          />
          <Stack.Screen
            name="elso-lepesek"
            options={{ title: "Regisztráció" }}
          />
        </Stack>
      </ScrollView>
      <ThemedView style={{ alignItems: "center", width: "100%", position: "absolute", bottom: 0, backgroundColor: "transparent" }}>
        <Dots
          length={pages.length}
          active={current}
          passiveColor={theme.colors.backdrop}
          activeColor={theme.colors.onBackground}
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
              disabled={
                (!prev || path === "/csatlakozom/elso-lepesek") && current !== 0
              }
              mode="contained"
            >
              Vissza
            </Button>
          </Link>
          {!(
            path === "/csatlakozom/regisztracio" ||
            path === "/csatlakozom/email-regisztracio" ||
            path === "/csatlakozom/elso-lepesek" ||
            path === "/csatlakozom/email-ellenorzes"
          ) && (
            <Link href={next} asChild
              disabled={path === "/csatlakozom/megbizhatosag" && !canGoNext}>
              <Button mode="contained">Tovább</Button>
            </Link>
          )}
        </View>
      </ThemedView>
    </ThemedView>
  );
}
