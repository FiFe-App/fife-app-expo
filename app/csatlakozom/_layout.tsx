import { theme } from "@/assets/theme";
import { ThemedView } from "@/components/ThemedView";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import {
  Link,
  Redirect,
  Stack,
  useGlobalSearchParams,
  usePathname,
} from "expo-router";
import { ScrollView, View } from "react-native";
import Dots from "react-native-dots-pagination";
import { Button } from "react-native-paper";
import { useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";

export default function RootLayout() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const policiesAccepted = useSelector((state: RootState) => state.info.policiesAccepted);
  const pages = [
    "/csatlakozom/",
    "/csatlakozom/iranyelvek",
    "/csatlakozom/helyzet",
    "/csatlakozom/ertesitesek",
    "/csatlakozom/email-regisztracio",
    "/csatlakozom/email-ellenorzes",
    "/csatlakozom/elso-lepesek",
  ] as const;
  type JoinPage = (typeof pages)[number];
  const canGoNext = useGlobalSearchParams().canGoNext === "true";

  const path = usePathname().split("#")[0];

  const index = pages.findIndex((page) => {
    return page === path;
  });

  const current = index < 0 ? 0 : index;

  const prev: JoinPage = pages[current - 1] ?? pages[0];
  const next: JoinPage = pages[current + 1] ?? pages[0];


  if (uid && path === "/csatlakozom") return <Redirect href="/user" />;

  return (
    <ThemedView type="default" style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flex: 1 }}>
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

        <View
          style={{
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexDirection: "row",
            width: "100%",
            padding: Spacing.lg,
          }}
        >
          <Link href={current === 0 ? "/" : prev} asChild>
            <Button
              disabled={
                ((!prev || path === "/csatlakozom/elso-lepesek") && current !== 0)
              }
              mode="contained"
            >
              Vissza
            </Button>
          </Link>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", height: 48 }}>
            <Dots
              length={pages.length}
              active={current}
              marginHorizontal={4}
              passiveColor={theme.colors.backdrop}
              activeColor={theme.colors.surface}
            />
          </View>
          <Link href={next} asChild
            disabled={
              (path === "/csatlakozom/iranyelvek" && !canGoNext) ||
              path === "/csatlakozom/regisztracio" ||
              path === "/csatlakozom/email-regisztracio" ||
              path === "/csatlakozom/email-ellenorzes"
            }
            style={{
              opacity: (
                path === "/csatlakozom/regisztracio" ||
                path === "/csatlakozom/email-regisztracio" ||
                path === "/csatlakozom/email-ellenorzes"
              ) ? 0 : 1,
            }}>
            <Button mode="contained">Tovább</Button>
          </Link>
        </View>
      </ThemedView>
    </ThemedView>
  );
}
