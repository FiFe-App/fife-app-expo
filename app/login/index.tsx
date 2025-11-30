import { ThemedView } from "@/components/ThemedView";
import {
  setName,
  setUserData,
  login as sliceLogin,
} from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { User } from "@supabase/auth-js";
import { Link, Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { Divider, Text, TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { loadViewedFunctions } from "@/redux/reducers/tutorialReducer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "@/components/Button";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Index() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { "#": hash } = useLocalSearchParams<{ "#": string }>();
  const token_data = hash
    ? Object.fromEntries(hash.split("&").map((e) => e.split("=")))
    : null;
  WebBrowser.maybeCompleteAuthSession(); // required for web only
  const redirectTo = makeRedirectUri();

  useEffect(() => {
    if (token_data) {
      console.log(token_data);

      supabase.auth
        .setSession({
          refresh_token: token_data.refresh_token,
          access_token: token_data?.access_token,
        })
        .then(({ data, error }) => {
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

      if (error.code === "email_not_confirmed") {
        AsyncStorage.setItem("email", email);
        router.navigate("/csatlakozom/email-ellenorzes");
      }
      setError(error.message);
    } else {
      getUserData(data.user);
    }
    setLoading(false);
  }

  async function signInWithGoogle() {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${redirectTo}/login`,
      },
    });
  }

  async function autoLogin() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "test@fife.hu",
      password: "fifewok42",
    });

    if (error) {
      setError(error.message);
    } else {
      getUserData(data.user);
    }
    setLoading(false);
  }

  const startFacebookLogin = async () => {
    console.log("hello");

    console.log({
      redirectTo: `${redirectTo}/login`,
    });

    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${redirectTo}/login`,
      },
    });
  };

  const getUserData = async (userData: User) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select()
      .eq("id", userData.id)
      .maybeSingle();
    if (error) {
      console.log(error);
    }
    if (profile) {
      console.log("profile", profile);

      dispatch(sliceLogin(profile?.id));
      dispatch(setName(profile?.full_name));
      console.log("user-data", { ...userData, ...profile });

      dispatch(setUserData({ ...userData, ...profile }));
      if (profile?.viewed_functions)
        dispatch(loadViewedFunctions(profile?.viewed_functions));
    }
  };

  if (!uid)
    return (
      <ThemedView style={{ flex: 1 }} type="default">
        <View style={{ maxWidth: 300, width: "100%", gap: 8, margin: "auto" }}>
          <Button onPress={autoLogin} mode="contained">
            Próba felhasználó
          </Button>
          <Button
            mode="contained"
            icon="facebook"
            disabled
            onPress={startFacebookLogin}
          >
            Facebook bejelentkezés
          </Button>
          <Button
            mode="contained"
            icon="google"
            disabled
            onPress={signInWithGoogle}
          >
            Google bejelentkezés
          </Button>
          <Divider style={{ marginVertical: 16 }} />
          <TextInput
            mode="outlined"
            onChangeText={setEmail}
            value={email}
            label="E-mail"
          />
          <TextInput
            mode="outlined"
            onChangeText={setPassword}
            value={password}
            label="Jelszó"
            secureTextEntry={!showPassword}
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
            mode="contained"
            type="secondary"
          >
            Bejelentkezés
          </Button>
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Link href="/csatlakozom" asChild>
              <Button>Még nincs fiókom</Button>
            </Link>
            <Link href="/user/password-reset" asChild>
              <Button>Elfelejtettem a jelszavam</Button>
            </Link>
          </View>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      </ThemedView>
    );
  return (
    <ThemedView
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      <Redirect href="/" />
    </ThemedView>
  );
}
