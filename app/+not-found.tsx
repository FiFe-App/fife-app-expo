import { Link, Stack } from "expo-router";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "react-native-paper";
import { useTranslation } from "react-i18next";

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t("navigation.notFound") }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">{t("notFound.lostInBits")}</ThemedText>
        <Link href="/" style={styles.link} asChild>
          <Button mode="contained-tonal">{t("notFound.backToHome")}</Button>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
  },
});
