import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { supabase } from "@/lib/supabase/supabase";
import { login, setUserData } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, Redirect, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { AppState, View } from "react-native";

import { addSnack } from "@/redux/reducers/infoReducer";
import { makeRedirectUri } from "expo-auth-session";
import { Button, Checkbox, HelperText, Icon, TextInput, useTheme } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import UsernameInput from "@/components/UsernameInput";
import { useTranslation } from "react-i18next";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Index() {
  const { t } = useTranslation();
  const theme = useTheme();
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

  const { uid }: UserState = useSelector((state: RootState) => state.user);
  WebBrowser.maybeCompleteAuthSession(); // required for web only
  const redirectTo = makeRedirectUri({ path: "/csatlakozom/elso-lepesek" });

  const createUser = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          username,
        },
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
            setError(t('csatlakozom.emailAlreadyTaken'));
          } else {
            setError(signInResponse.error.message);
          }
        } else {
          console.log("Successfully signed in existing user!");
          dispatch(login(signInResponse.data.user.id));
          dispatch(setUserData(signInResponse.data.user));
          dispatch(addSnack({ title: t('csatlakozom.loggedIn') }));
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
    <ThemedView style={{ flex: 1, padding: 16, alignItems: "center" }}>
      <View style={{ justifyContent: "center", marginBottom: 16 }}></View>
      <View
        style={{
          maxWidth: 400,
          width: "100%",
          gap: 8,
          flex: 3,
          justifyContent: "center",
        }}
      >
        <ThemedText type="title" style={{ textAlign: "left" }}>
          {t('csatlakozom.yay')}
        </ThemedText>
        <ThemedText>{t('csatlakozom.createAccountPrompt')}</ThemedText>
        <View>
          <TextInput
            mode="outlined"
            onChangeText={setName}
            value={name}
            label={t('csatlakozom.nameLabel')}
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            autoCorrect={false}
          />
          <HelperText type="info">{t('csatlakozom.nameHelper')}</HelperText>
        </View>
        <UsernameInput
          value={username}
          onChangeText={setUsername}
          onAvailabilityChange={setUsernameAvailable}
          label={t('csatlakozom.usernameLabel')}
          style={{ marginTop: 8 }}
        />
        <TextInput
          mode="outlined"
          onChangeText={setEmail}
          value={email}
          label={t('csatlakozom.emailLabel')}
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
          label={t('csatlakozom.passwordLabel')}
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
          <View style={{ marginRight: 4, justifyContent: "center" }}>
            <Icon
              source={isPasswordWeak ? "check-circle-outline" : "check-circle"}
              color={theme.colors.onSurface}
              size={18}
            />
          </View>
          <ThemedText type="label">
            {t('csatlakozom.passwordRequirement')}
          </ThemedText>
        </View>
        <TextInput
          mode="outlined"
          onChangeText={setPasswordAgain}
          value={passwordAgain}
          secureTextEntry
          disabled={isPasswordWeak}
          label={t('csatlakozom.passwordAgainLabel')}
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
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
          <Checkbox
            onPress={() => setAcceptConditions(!acceptConditions)}
            status={acceptConditions ? "checked" : "unchecked"}
          />
          <ThemedText variant="labelLarge" onPress={() => setAcceptConditions(!acceptConditions)}>
            {t('csatlakozom.acceptTerms')}
            <ThemedText variant="labelLarge" type="link">
              <Link href="/csatlakozom/iranyelvek">{t('csatlakozom.terms')}</Link>
            </ThemedText>
            .
          </ThemedText>
        </View>
        <Button
          mode="contained"
          loading={loading}
          onPress={createUser}
          disabled={
            isPasswordWeak || !name || password !== passwordAgain || !acceptConditions ||
            (username.trim().length > 0 && usernameAvailable === false)
          }
        >
          {t('csatlakozom.register')}
        </Button>
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      </View>
    </ThemedView>
  );
}
