import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { supabase } from "@/lib/supabase/supabase";
import { login, setUserData } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { openBrowserAsync } from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { addSnack } from "@/redux/reducers/infoReducer";
import { makeRedirectUri } from "expo-auth-session";
import { Button, Checkbox, HelperText, Icon, TextInput as PaperTextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import UsernameInput from "@/components/UsernameInput";
import { Spacing } from "@/constants/spacing";
import { useAppTheme } from "@/assets/theme";

// Type for signup metadata
interface SignupMetadata {
  full_name: string;
  username: string;
  location?: string; // PostGIS POINT string format
  location_radius_m?: number;
  notify_push?: boolean;
  notify_email?: boolean;
  newsletter?: boolean;
  bad_boy?: boolean;
}

export default function Index() {
  const theme = useAppTheme();
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [acceptConditions, setAcceptConditions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showPassword, setShowPassword] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const nameRef = useRef<{ focus: () => void } | null>(null);
  const usernameRef = useRef<{ focus: () => void } | null>(null);
  const emailRef = useRef<{ focus: () => void } | null>(null);
  const passwordRef = useRef<{ focus: () => void } | null>(null);
  const passwordAgainRef = useRef<{ focus: () => void } | null>(null);
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  const isPasswordWeak = !passwordRegex.exec(password)?.length;
  const canSubmit =
    !loading && !isPasswordWeak && !!name && password === passwordAgain && acceptConditions &&
    !(username.trim().length > 0 && usernameAvailable === false);

  const { uid, userData, notificationPrefs }: UserState = useSelector((state: RootState) => state.user);
  const policiesAccepted = useSelector((state: RootState) => state.info.policiesAccepted);
  const userLocation = userData?.location;
  WebBrowser.maybeCompleteAuthSession(); // required for web only
  const redirectTo = makeRedirectUri({ path: "/csatlakozom/elso-lepesek" });

  const focusNextInput = (nextRef: React.RefObject<{ focus: () => void } | null>) => {
    requestAnimationFrame(() => nextRef.current?.focus?.());
  };

  const createUser = async () => {
    setLoading(true);
    
    // Ensure we have required fields
    if (!email.trim() || !name.trim()) {
      setError("Email és név megadása kötelező");
      setLoading(false);
      return;
    }

    try {
      // Prepare metadata with proper typing
      const metadata: SignupMetadata = {
        full_name: name.trim(),
        username: username.trim(),
      };

      // Add location if available and properly structured
      if (userLocation &&
          typeof userLocation.lat === "number" &&
          typeof userLocation.lng === "number") {
        // Format as PostGIS POINT string
        metadata.location = `POINT(${userLocation.lng} ${userLocation.lat})`;
        if (typeof userLocation.radius === "number") {
          metadata.location_radius_m = userLocation.radius;
        }
      }

      // Add notification preferences from onboarding
      if (notificationPrefs) {
        metadata.notify_push = notificationPrefs.notifyPush;
        metadata.notify_email = notificationPrefs.notifyEmail;
        metadata.newsletter = notificationPrefs.newsletter;
      }

      metadata.bad_boy = !policiesAccepted;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata,
          emailRedirectTo: redirectTo,
        },
      });
      if (error) {
        // Surface the error even if a user object also came back (e.g. the
        // account was created but the confirmation email failed to send) —
        // don't silently navigate away and hide the failure.
        console.log(error.code, error.message);
        if (error.code === "over_email_send_rate_limit") {
          setError("Túl sok próbálkozás. Kérlek várj egy kicsit, majd próbáld újra.");
        } else {
          setError(error.message);
        }
      } else if (data.user) {
        if (data?.user.identities && data.user.identities.length > 0) {
          console.log("Sign-up successful!");
          AsyncStorage.setItem("email", email);
          router.navigate("/csatlakozom/email-ellenorzes");
        } else {
          console.log("Email address is already taken.");
          const signInResponse = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInResponse.error) {
            console.error(
              "An error occurred during sign-in:",
              signInResponse.error.message,
            );
            console.log(signInResponse.error.code);
            if (signInResponse.error.code === "invalid_credentials") {
              setError("Ez az email már foglalt");
            } else {
              setError(signInResponse.error.message);
            }
          } else {
            console.log("Successfully signed in existing user!");
            dispatch(login(signInResponse.data.user.id));
            dispatch(setUserData(signInResponse.data.user));
            dispatch(addSnack({ title: "Bejelentkeztél!" }));
            router.navigate("/me");
          }
        }
      }
      console.log(data, error);
    } catch (e) {
      // A thrown (not returned) error — network failure, timeout, request
      // aborted, etc. Without this, the function would exit here silently:
      // no error shown, loading spinner stuck forever, and nothing to find
      // server-side since the request never completed a round trip.
      console.error("Unexpected error during registration:", e);
      setError("Váratlan hiba történt. Ellenőrizd az internetkapcsolatod, és próbáld újra.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    AsyncStorage.setItem("email", email);
  }, [email]);

  if (uid) return <Redirect href="/" />;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, minHeight: 0 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ThemedView style={{ flex: 1, minHeight: 0, padding: Spacing.lg, paddingTop: Spacing.xxxl }}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: Spacing.xl }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: Spacing.lg }}></View>
          <View
            style={{
              maxWidth: 400,
              width: "100%",
              gap: Spacing.sm,
              flex: 3,
            }}
          >
            <ThemedText type="title" style={{ textAlign: "left" }}>
              Juhé!
            </ThemedText>
            <ThemedText>Már csak a fiókodat kell létrehozni:</ThemedText>
            <View>
              <PaperTextInput
                ref={nameRef as never}
                mode="outlined"
                onChangeText={setName}
                value={name}
                label="Neved*"
                autoComplete="name"
                textContentType="name"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                submitBehavior="submit"
                onFocus={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
                onSubmitEditing={() => focusNextInput(usernameRef)}
              />
              <HelperText type="info">A neved látható lesz mindenki számára, aki tag.</HelperText>
            </View>
            <UsernameInput
              inputRef={usernameRef}
              value={username}
              onChangeText={setUsername}
              onAvailabilityChange={setUsernameAvailable}
              label="Felhasználónév"
              style={{ marginTop: Spacing.sm }}
              returnKeyType="next"
              onFocus={() => scrollViewRef.current?.scrollTo({ y: 80, animated: true })}
              onSubmitEditing={() => focusNextInput(emailRef)}
            />
            <PaperTextInput
              ref={emailRef as never}
              mode="outlined"
              onChangeText={setEmail}
              value={email}
              label="E-mail*"
              autoComplete="email"
              textContentType="emailAddress"
              inputMode="email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              submitBehavior="submit"
              onFocus={() => scrollViewRef.current?.scrollTo({ y: 180, animated: true })}
              onSubmitEditing={() => focusNextInput(passwordRef)}
            />
            <PaperTextInput
              ref={passwordRef as never}
              mode="outlined"
              onChangeText={setPassword}
              value={password}
              label="Jelszó*"
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              submitBehavior="submit"
              onFocus={() => scrollViewRef.current?.scrollTo({ y: 280, animated: true })}
              onSubmitEditing={() => focusNextInput(passwordAgainRef)}
              right={
                <PaperTextInput.Icon
                  icon={showPassword ? "eye" : "eye-off"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            <View style={{ flexDirection: "row" }}>
              <View style={{ marginRight: Spacing.xs, justifyContent: "center" }}>
                <Icon
                  source={isPasswordWeak ? "check-circle-outline" : "check-circle"}
                  color={theme.colors.onSurface}
                  size={18}
                />
              </View>
              <ThemedText type="label">
                Tartalmazzon kis- és nagybetűt, valamint számot is.
              </ThemedText>
            </View>
            <PaperTextInput
              ref={passwordAgainRef as never}
              mode="outlined"
              onChangeText={setPasswordAgain}
              value={passwordAgain}
              secureTextEntry
              disabled={isPasswordWeak}
              label="Jelszó még egyszer*"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onFocus={() => scrollViewRef.current?.scrollTo({ y: 360, animated: true })}
              onSubmitEditing={() => canSubmit && createUser()}
              right={
                <PaperTextInput.Icon
                  icon={
                    password !== passwordAgain
                      ? "check-circle-outline"
                      : "check-circle"
                  }
                />
              }
            />
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: Spacing.lg }}>
              <Checkbox
                onPress={() => setAcceptConditions(!acceptConditions)}
                status={acceptConditions ? "checked" : "unchecked"}
              />
              <ThemedText variant="labelLarge" style={{ flex: 1, flexWrap: "wrap" }} onPress={() => setAcceptConditions(!acceptConditions)}>
                {"Elolvastam és elfogadom a "}
                <ThemedText
                  variant="labelLarge"
                  type="link"
                  onPress={(e) => { e.stopPropagation?.(); openBrowserAsync("https://fifeapp.hu/terms.html"); }}
                >
                  Felhasználási feltételeket
                </ThemedText>
                {" és az "}
                <ThemedText
                  variant="labelLarge"
                  type="link"
                  onPress={(e) => { e.stopPropagation?.(); openBrowserAsync("https://fifeapp.hu/privacy.html"); }}
                >
                  Adatkezelési tájékoztatót
                </ThemedText>
                {"."}          
              </ThemedText>
            </View>
            <Button
              mode="contained"
              style={{marginTop:Spacing.lg}}
              loading={loading}
              onPress={createUser}
              disabled={!canSubmit}
            >
              Regisztrálok
            </Button>
            {!!error && <ThemedView style={{margin:6, alignItems:"center"}} type="error">
              <ThemedText type="error">{error}</ThemedText>
            </ThemedView>}
          </View>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}
