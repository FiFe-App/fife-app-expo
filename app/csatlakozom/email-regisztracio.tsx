import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { supabase } from "@/lib/supabase/supabase";
import { login, setUserData } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { UserState, CircleType } from "@/redux/store.type";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { openBrowserAsync } from "expo-web-browser";
import { useEffect, useState } from "react";
import { AppState, View } from "react-native";

import { addSnack } from "@/redux/reducers/infoReducer";
import { makeRedirectUri } from "expo-auth-session";
import { Button, Checkbox, HelperText, Icon, TextInput } from "react-native-paper";
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

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

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
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  const isPasswordWeak = !passwordRegex.exec(password)?.length;

  const { uid, userData, notificationPrefs }: UserState = useSelector((state: RootState) => state.user);
  const policiesAccepted = useSelector((state: RootState) => state.info.policiesAccepted);
  const userLocation = userData?.location;
  WebBrowser.maybeCompleteAuthSession(); // required for web only
  const redirectTo = makeRedirectUri({ path: "/csatlakozom/elso-lepesek" });

  const createUser = async () => {
    setLoading(true);
    
    // Ensure we have required fields
    if (!email.trim() || !name.trim()) {
      setError("Email és név megadása kötelező");
      setLoading(false);
      return;
    }

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
    if (data.user) {
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
          router.navigate("/home");
        }
      }
    }
    if (error) {
      setError(error.message);
    }
    console.log(data, error);

    setLoading(false);
  };

  useEffect(() => {
    AsyncStorage.setItem("email", email);
  }, [email]);

  if (uid) return <Redirect href="/" />;
  return (
    <ThemedView style={{ flex: 1, padding: Spacing.lg, paddingTop: Spacing.xxxl }}>
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
          <TextInput
            mode="outlined"
            onChangeText={setName}
            value={name}
            label="Neved*"
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            autoCorrect={false}
          />
          <HelperText type="info">A neved látható lesz mindenki számára, aki tag.</HelperText>
        </View>
        <UsernameInput
          value={username}
          onChangeText={setUsername}
          onAvailabilityChange={setUsernameAvailable}
          label="Felhasználónév"
          style={{ marginTop: Spacing.sm }}
        />
        <TextInput
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
        />
        <TextInput
          mode="outlined"
          onChangeText={setPassword}
          value={password}
          label="Jelszó*"
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          textContentType="newPassword"
          right={
            <TextInput.Icon
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
        <TextInput
          mode="outlined"
          onChangeText={setPasswordAgain}
          value={passwordAgain}
          secureTextEntry
          disabled={isPasswordWeak}
          label="Jelszó még egyszer*"
          autoComplete="new-password"
          textContentType="newPassword"
          right={
            <TextInput.Icon
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
          disabled={
            isPasswordWeak || !name || password !== passwordAgain || !acceptConditions ||
            (username.trim().length > 0 && usernameAvailable === false)
          }
        >
          Regisztrálok
        </Button>
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      </View>
    </ThemedView>
  );
}
