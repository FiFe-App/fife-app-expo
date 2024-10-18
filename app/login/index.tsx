import { ThemedView } from "@/components/ThemedView";
import {
  logout,
  setName,
  setUserData,
  login as sliceLogin,
} from "@/lib/redux/reducers/userReducer";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { Link, useLocalSearchParams } from "expo-router";
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
  const token_data = Object.fromEntries(
    hash.split("&").map((e) => e.split("=")),
  );

  useEffect(() => {
    if (token_data) {
      console.log(token_data);

      supabase.auth
        .signInWithIdToken({
          provider: "facebook",
          token: token_data?.access_token,
        })
        .then(({ data, error }) => {
          console.log(data, error);
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
      const { data: profile, error: pError } = await supabase
        .from("profiles")
        .select()
        .eq("id", data.user.id)
        .single();
      dispatch(sliceLogin(data.user.id));
      dispatch(setName(profile?.full_name));
      dispatch(setUserData({ ...data, ...profile }));
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
      dispatch(sliceLogin(data.user.id));
      dispatch(setName(data.user.email));
      dispatch(setUserData(data.user));
    }
    setLoading(false);
  }

  const startFacebookLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `http://localhost:8081/user/edit`,
      },
    });
  };
  const startLogout = () => {
    dispatch(logout());
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
