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

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index" />
      <Stack.Screen
        name="new"
        options={{ title: "Új biznisz" }}
      />
      <Stack.Screen
        name="[id]"
      />
      <Stack.Screen
        name="edit/[id]"
      />
    </Stack>
  );
}
