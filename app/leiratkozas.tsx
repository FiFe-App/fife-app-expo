import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Link, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { Button, Icon, useTheme } from "react-native-paper";

// Landing page for the newsletter-unsubscribe link people click from an
// email. That link points at a Supabase edge function, which redirects here
// with ?status=... — Supabase's *.supabase.co gateway rewrites any text/html
// an edge function returns to text/plain, so the function can't render this
// confirmation itself.
const CONTENT: Record<string, { icon: string; title: string; message: (email?: string) => string }> = {
  ok: {
    icon: "email-off-outline",
    title: "Sikeresen leiratkoztál",
    message: (email) =>
      `${email ? `A ${email} címre` : "Erre a címre"} nem küldünk több hírlevelet. Ha meggondolod magad, a profilod beállításai között bármikor újra feliratkozhatsz.`,
  },
  invalid: {
    icon: "link-off",
    title: "Érvénytelen leiratkozási link",
    message: () =>
      "Ez a link hibás vagy lejárt. A leiratkozást a FiFe Appban, a profilod beállításai között is elvégezheted.",
  },
  error: {
    icon: "alert-circle-outline",
    title: "Hoppá, valami hiba történt",
    message: () => "Nem sikerült leiratkoztatni. Kérlek próbáld meg később.",
  },
};

export default function Leiratkozas() {
  const theme = useTheme();
  const { status, email } = useLocalSearchParams<{ status?: string; email?: string }>();
  const { icon, title, message } = CONTENT[status ?? ""] ?? CONTENT.error;

  return (
    <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Icon source={icon} size={80} color={theme.colors.onSurfaceVariant} />
      <View style={{ height: 16 }} />
      <ThemedText type="subtitle" style={{ textAlign: "center" }}>
        {title}
      </ThemedText>
      <View style={{ height: 8 }} />
      <ThemedText style={{ textAlign: "center", opacity: 0.8 }}>
        {message(email)}
      </ThemedText>
      <View style={{ height: 24 }} />
      <Link href="/" asChild>
        <Button mode="contained" icon="home">
          Vissza a kezdőlapra
        </Button>
      </Link>
    </ThemedView>
  );
}
