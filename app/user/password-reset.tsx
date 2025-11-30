import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/supabase/supabase";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { TextInput, Text, Card } from "react-native-paper";
import { Link, useLocalSearchParams } from "expo-router";
import { theme } from "@/assets/theme";
import { Image } from "expo-image";

// Flow:
// 1. User enters email -> send reset link (supabase.auth.resetPasswordForEmail)
// 2. Supabase sends magic link with type=recovery; user opens app (redirect)
// 3. On load, if hash params contain access_token we call setSession and show new password form
// 4. Submit new password -> supabase.auth.updateUser({ password })

export default function PasswordResetScreen() {
  const { "#": hash } = useLocalSearchParams<{ "#"?: string }>();
  const tokenParams = hash
    ? Object.fromEntries(hash.split("&").map((p) => p.split("=")))
    : null;

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [stage, setStage] = useState<"request" | "reset">("request");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If link opened with tokens, establish session then move to reset stage
  useEffect(() => {
    if (tokenParams?.access_token && tokenParams.refresh_token) {
      supabase.auth
        .setSession({
          access_token: tokenParams.access_token,
          refresh_token: tokenParams.refresh_token,
        })
        .then(({ error }) => {
          if (error) setError(error.message);
          else setStage("reset");
        });
    }
  }, [tokenParams]);

  const sendEmail = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/user/password-reset`,
    });
    if (error) setError(error.message);
    else {
      setSent(true);
      setMessage("Ha létezik ilyen fiók, küldtünk e-mailt a jelszó visszaállításához.");
    }
    setLoading(false);
  };

  const updatePassword = async () => {
    if (password.length < 6) {
      setError("A jelszó legyen legalább 6 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("A jelszavak nem egyeznek.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else setMessage("Jelszó frissítve. Jelentkezz be az új jelszóval.");
    setLoading(false);
  };

  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <View
        style={{
          maxWidth: 420,
          width: "100%",
          marginHorizontal: "auto",
          gap: 16,
        }}
      >
        {stage === "request" && (
          <>
            <Text variant="headlineSmall">Elfelejtett jelszó</Text>
            <Text >Add meg azt e-mail-t, amivel regisztráltál korábban!</Text>
            <TextInput
              mode="outlined"
              label="E-mail"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Button
              mode="contained"
              onPress={sendEmail}
              loading={loading}
              disabled={!email}
            >
              Visszaállító email küldése
            </Button>
          </>
        )}
        {stage === "reset" && (
          <>
            <Text variant="headlineSmall">Új jelszó beállítása</Text>
            <TextInput
              mode="outlined"
              label="Új jelszó"
              secureTextEntry={!showPw}
              value={password}
              onChangeText={setPassword}
              right={
                <TextInput.Icon
                  icon={showPw ? "eye" : "eye-off"}
                  onPress={() => setShowPw((s) => !s)}
                />
              }
            />
            <TextInput
              mode="outlined"
              label="Jelszó megerősítése"
              secureTextEntry={!showPw}
              value={confirm}
              onChangeText={setConfirm}
            />
            <Button
              mode="contained"
              onPress={updatePassword}
              loading={loading}
              disabled={!password || !confirm || !!(message && stage == "reset")}
            >
              Jelszó mentése
            </Button>
          </>
        )}
        {(sent || error || message) && (
          <Card style={{ padding: 20 }} contentStyle={{ gap: 12 }}>
            {error && <Text style={{ color: theme.colors.error }}>{error}</Text>}
            {message && (
              <Text style={{ color: stage === "reset" ? theme.colors.tertiary : undefined }}>
                {message}
              </Text>
            )}
            {stage === "reset" && message && !error && (
              <Link href="/login" asChild>
                <Button mode="contained">Bejelentkezés</Button>
              </Link>
            )}
          </Card>
        )}
        <View
          style={{ alignItems: "center", justifyContent: "center", margin: 24 }}
        >
          <Image
            source={require("@/assets/images/Phone.png")}
            style={{ width: "80%", aspectRatio: 1 / 1, resizeMode: "cover" }}
            contentFit="cover"
          />
        </View>
      </View>
    </ThemedView>
  );
}
