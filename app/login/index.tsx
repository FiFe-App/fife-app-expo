import { ThemedView } from "@/components/ThemedView";
import { FirebaseContext } from "@/lib/firebase/firebase";
import {
  setUserData,
  login as sliceLogin,
  setName,
} from "@/lib/redux/reducers/userReducer";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { Link } from "expo-router";
import { useContext, useState } from "react";
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
  const {
    api: { facebookLogin, logout },
  } = useContext(FirebaseContext);
  const [error, setError] = useState<string | undefined>();

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

  const startFacebookLogin = () => {
    facebookLogin();
  };
  const startLogout = () => {
    logout();
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
