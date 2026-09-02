import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/supabase/supabase";
import { makeRedirectUri } from "expo-auth-session";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthRedirectParams } from "@/hooks/useAuthRedirectParams";
import {
  describeAuthRedirectError,
  getAuthRedirectTokens,
} from "@/lib/auth/authRedirectParams";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { TextInput, Text, Card } from "react-native-paper";
import { Link } from "expo-router";
import { theme } from "@/assets/theme";
import { Image } from "expo-image";
import { Spacing } from "@/constants/spacing";

// Flow:
// 1. User enters email -> send reset link (supabase.auth.resetPasswordForEmail)
// 2. Supabase sends magic link with type=recovery; user opens app (redirect)
// 3. On load, if hash params contain access_token we call setSession and show new password form
// 4. Submit new password -> supabase.auth.updateUser({ password })

export default function PasswordResetScreen() {
  // Not `useLocalSearchParams()["#"]`: expo-router strips the fragment from
  // native deep links, so on a phone the recovery tokens never arrived and the
  // screen stayed stuck on the "request a link" stage.
  // Without this, resetPasswordForEmail falls back to Supabase's dashboard
  // "Site URL" (a plain https address), so the emailed link opens a browser
  // instead of the app — mirrors the redirect used by the sign-up flows.
  const redirectTo = makeRedirectUri({ path: "/user/password-reset" });
  const redirectParams = useAuthRedirectParams();
  const tokens = useMemo(() => getAuthRedirectTokens(redirectParams), [redirectParams]);
  const linkError = useMemo(
    () => describeAuthRedirectError(redirectParams),
    [redirectParams],
  );

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [stage, setStage] = useState<"request" | "reset">("request");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<{ focus: () => void } | null>(null);

  // If link opened with tokens, establish session then move to reset stage
  useEffect(() => {
    if (!tokens) return;

    let cancelled = false;
    supabase.auth.setSession(tokens).then(({ error }) => {
      if (cancelled) return;
      if (error) setError(error.message);
      else setStage("reset");
    });

    return () => {
      cancelled = true;
    };
  }, [tokens]);

  // A refused link carries the reason instead of tokens.
  useEffect(() => {
    if (linkError) setError(linkError);
  }, [linkError]);

  const sendEmail = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
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
    <ThemedView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              maxWidth: 420,
              width: "100%",
              marginHorizontal: "auto",
              gap: Spacing.lg,
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
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  keyboardType="email-address"
                  returnKeyType="send"
                  value={email}
                  onChangeText={setEmail}
                  onSubmitEditing={() => email && sendEmail()}
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
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  right={
                    <TextInput.Icon
                      icon={showPw ? "eye" : "eye-off"}
                      onPress={() => setShowPw((s) => !s)}
                    />
                  }
                />
                <TextInput
                  ref={confirmRef as never}
                  mode="outlined"
                  label="Jelszó megerősítése"
                  secureTextEntry={!showPw}
                  value={confirm}
                  onChangeText={setConfirm}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={() => password && confirm && updatePassword()}
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
              <Card style={{ padding: Spacing.xl }} contentStyle={{ gap: Spacing.md }}>
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
              style={{ alignItems: "center", justifyContent: "center", margin: Spacing.xxl }}
            >
              <Image
                source={require("@/assets/images/Phone.png")}
                style={{ width: "80%", aspectRatio: 1 / 1, resizeMode: "cover" }}
                contentFit="cover"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
