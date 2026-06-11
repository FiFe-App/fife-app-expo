import { ThemedView } from "@/components/ThemedView";
import { fetchUserProfile } from "@/lib/auth/fetchUserProfile";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { User } from "@supabase/auth-js";
import { Link, Redirect, router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Divider, Text, TextInput } from "react-native-paper";
import { Spacing } from "@/constants/spacing";
import { useDispatch, useSelector } from "react-redux";

import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "@/components/Button";
import { useAppTheme } from "@/assets/theme";
import { ThemedText } from "@/components/ThemedText";
import { Image } from "expo-image";
import Smiley from "@/components/Smiley";

export default function Index() {
  const navigation = useNavigation();
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { "#": hash, redirected_from } = useLocalSearchParams<{ "#": string; redirected_from?: string }>();
  const token_data = hash
    ? Object.fromEntries(hash.split("&").map((e) => e.split("=")))
    : null;
  WebBrowser.maybeCompleteAuthSession(); // required for web only
  const redirectTo = makeRedirectUri();

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
      console.log(error.code);

      switch (error.code) {
        case "email_not_confirmed":
          AsyncStorage.setItem("email", email);
          router.navigate("/csatlakozom/email-ellenorzes");
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
      const isValidInternal =
        typeof redirected_from === "string" &&
        redirected_from.startsWith("/") &&
        !redirected_from.startsWith("//") &&
        !redirected_from.includes(":");
      router.replace(isValidInternal ? (redirected_from as `/${string}`) : "/");
    }
  };

  if (uid)
    return <Redirect href="/" />;

  return (
    <ThemedView style={{ flex: 1, alignItems:"center", justifyContent:"center" }} type="default">
      <View style={{ maxWidth: 300, width: "80%", gap: Spacing.sm, marginTop: Spacing.xxxl }}>
        <View style={{width:"100%",alignItems:"center"}}>
          <Smiley style={{width:100,height:100}} />
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
        />
        <TextInput
          mode="outlined"
          onChangeText={setPassword}
          value={password}
          label="Jelszó"
          secureTextEntry={!showPassword}
          autoComplete="current-password"
          textContentType="password"
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
          style={{marginTop: Spacing.md}}
          mode="contained"
          disabled={!password || !email}
          type="secondary"
        >
          Bejelentkezés
        </Button>
        <View style={{minHeight:60}}>
          {!!error && <ThemedView style={{margin:6, alignItems:"center"}} type="error">
            <ThemedText type="error">{error}</ThemedText>
          </ThemedView>}
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Link href="/csatlakozom" asChild>
            <Button>Még nincs fiókom</Button>
          </Link>
          <Link href="/user/password-reset" asChild>
            <Button>Elfelejtettem a jelszavam</Button>
          </Link>
        </View>
        </View>
      </View>
    </ThemedView>
  );
}
