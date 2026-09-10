import { ThemedView } from "@/components/ThemedView";
import { fetchUserProfile } from "@/lib/auth/fetchUserProfile";
import {
  getJoinHref,
  REDIRECT_PARAM,
  sanitizeRedirectTarget,
  takeAttemptedPath,
} from "@/lib/auth/loginRedirect";
import {
  clearRedirectAfterAuth,
  setRedirectAfterAuth,
} from "@/redux/reducers/appReducer";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { User } from "@supabase/auth-js";
import { Link, Redirect, router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { TextInput } from "react-native-paper";
import { Spacing } from "@/constants/spacing";
import { useDispatch, useSelector } from "react-redux";

import * as WebBrowser from "expo-web-browser";
import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import Smiley from "@/components/Smiley";
import { Logo } from "@/components/Logo";

export default function Index() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const passwordRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const { "#": hash, [REDIRECT_PARAM]: redirectedFrom } = useLocalSearchParams<{
    "#": string;
    [REDIRECT_PARAM]?: string;
  }>();
  // Either the button that sent them here named the page (the parameter), or
  // the router took the address away when it bounced them off a locked link —
  // in which case lib/auth/loginRedirect.ts caught it as the app loaded.
  // Read once, on mount: taking it is what forgets it.
  const [capturedPath] = useState(() => takeAttemptedPath());
  const redirectTarget = sanitizeRedirectTarget(redirectedFrom) ?? capturedPath;
  // Handed to the join wizard as well: somebody who taps "Még nincs fiókom"
  // is after the same page, and the e-mail confirmation restarts the app in
  // the middle of it — which no route parameter survives.
  useEffect(() => {
    if (redirectTarget) dispatch(setRedirectAfterAuth(redirectTarget));
  }, [redirectTarget, dispatch]);

  const token_data = hash
    ? Object.fromEntries(hash.split("&").map((e) => e.split("=")))
    : null;
  WebBrowser.maybeCompleteAuthSession(); // required for web only

  useEffect(() => {
    navigation.setOptions({ "title": "Bejelentkezés" });
    if (token_data) {
      console.log(token_data);

      supabase.auth
        .setSession({
          refresh_token: token_data.refresh_token,
          access_token: token_data?.access_token,
        })
        .then(({ data }) => {
          if (data.user) getUserData(data.user);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { uid }: UserState = useSelector((state: RootState) => state.user);

  async function signInWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("Error",error);

      switch (error.code) {
        case "email_not_confirmed":
          setError("Nincs megerősítve az email-címed");
          break;
        case "invalid_credentials":
        case "user_not_found":
          setError("Helytelen e-mail vagy jelszó");
          break;
        case "too_many_requests":
          setError("Túl sok próbálkozás. Próbáld később.");
          break;
        default:
          setError(error.message);
      }
    } else {
      getUserData(data.user);
    }
    setLoading(false);
  }

  const getUserData = async (userData: User) => {
    const profile = await fetchUserProfile(userData, dispatch);
    if (profile) {
      dispatch(clearRedirectAfterAuth());
      router.replace((redirectTarget ?? "/") as `/${string}`);
    }
  };

  // Already signed in — including the case where the session was restored
  // while this screen was open. The page they were after still applies.
  if (uid) return <Redirect href={(redirectTarget ?? "/") as `/${string}`} />;

  return (
    <ThemedView style={{ flex: 1 }} type="default">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 56 : 0}
        enabled
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: Spacing.xxxl }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: 300, width: "100%", gap: Spacing.sm, alignSelf: "center" }}>
            <View style={{ width: "100%", alignItems: "center", gap: Spacing.sm }}>
              <Smiley style={{ width: 100, height: 100, marginBottom:Spacing.md }} />
              <Logo style={{ width: 200, height: 35 }} />
            </View>
            <View style={{ }}>
              {!!error && <ThemedView style={{ margin: 6, alignItems: "center" }} type="error">
                <ThemedText type="error">{error}</ThemedText>
              </ThemedView>}
            </View>
            <TextInput
              mode="outlined"
              onChangeText={setEmail}
              value={email}
              label="E-mail"
              autoComplete="email"
              textContentType="emailAddress"
              inputMode="email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              submitBehavior="submit"
              onFocus={() => {
                setFocusedField("email");
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              }}
              onBlur={() => setFocusedField((value) => (value === "email" ? null : value))}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextInput
              ref={passwordRef}
              mode="outlined"
              onChangeText={setPassword}
              value={password}
              label="Jelszó"
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onFocus={() => {
                setFocusedField("password");
                scrollViewRef.current?.scrollTo({ y: 120, animated: true });
              }}
              onBlur={() => setFocusedField((value) => (value === "password" ? null : value))}
              onSubmitEditing={() => email && password && signInWithEmail()}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye" : "eye-off"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            <Button
              onPress={signInWithEmail}
              loading={loading}
              style={[{ marginTop: Spacing.md }]}
              mode="contained"
              disabled={!password || !email}
              type="secondary"
            >
              Bejelentkezés
            </Button>
            <View style={{ flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: Spacing.xs }}>
              <Link href={getJoinHref(redirectTarget)} asChild>
                <Button>Még nincs fiókom</Button>
              </Link>
              <Link href="/user/password-reset" asChild>
                <Button>Elfelejtettem a jelszavam</Button>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
