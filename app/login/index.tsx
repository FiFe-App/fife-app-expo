import { ThemedView } from "@/components/ThemedView";
import {
  login,
  logout,
  setName,
  setUserData,
  login as sliceLogin,
} from "@/lib/redux/reducers/userReducer";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { User } from "@supabase/auth-js";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { "#": hash } = useLocalSearchParams<{ "#": string }>();
  const token_data = hash
    ? Object.fromEntries(hash.split("&").map((e) => e.split("=")))
    : null;

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
  }, []);
  const { uid, name }: UserState = useSelector(
    (state: RootState) => state.user,
  );

  async function signInWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      getUserData(data.user);
    }
    setLoading(false);
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
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `http://localhost:8081/login`,
      },
    });
  };
  const startLogout = () => {
    dispatch(logout());
  };

  const getUserData = async (userData: User) => {
    const { data: profile, error: pError } = await supabase
      .from("profiles")
      .select()
      .eq("id", userData.id)
      .single();
    if (error) {
      console.log(error);
    }
    if (profile) {
      console.log("profile", profile);

      dispatch(sliceLogin(profile?.id));
      dispatch(setName(profile?.full_name));
      dispatch(setUserData({ ...userData, ...profile }));
    }
  };

  if (!uid)
    return (
      <ThemedView style={{ flex: 1 }}>
        <View style={{ maxWidth: 400, width: "100%", gap: 8, margin: "auto" }}>
          <Button onPress={autoLogin} mode="contained">
            AUTO LOGIN
          </Button>
          <Button mode="contained" icon="facebook" onPress={startFacebookLogin}>
            Facebook bejelentkezés
          </Button>
          <TextInput
            onChangeText={setEmail}
            value={email}
            placeholder="Email"
          />
          <TextInput
            onChangeText={setPassword}
            value={password}
            placeholder="Jelszó"
            secureTextEntry
          />
          <Button onPress={signInWithEmail} loading={loading}>
            <Text>Bejelentkezés</Text>
          </Button>
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
      <Text>Bejelentkezve, mint {name}</Text>
      <Link href="/" asChild>
        <Button mode="contained">Főoldalra</Button>
      </Link>
      <Button icon="logout" onPress={startLogout}>
        Kijelentkezés
      </Button>
    </ThemedView>
  );
}
