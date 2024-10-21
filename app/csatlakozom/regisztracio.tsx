import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { createClient } from "@supabase/supabase-js";
import { Redirect } from "expo-router";
import { useState } from "react";
import { AppState, View } from "react-native";
import { Button, Divider, Text, TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

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

  const { uid, name }: UserState = useSelector(
    (state: RootState) => state.user,
  );

  const createUser = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    console.log(data, error);
  };
  WebBrowser.maybeCompleteAuthSession(); // required for web only
  const redirectTo = makeRedirectUri();
  async function signInWithFacebook() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${redirectTo}/csatlakozom/elso-lepesek`,
      },
    });
  }
  console.log(redirectTo);

  if (uid) return <Redirect href="/" />;
  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ThemedText type="title" style={{ textAlign: "left" }}>
          Szuper vagy!
        </ThemedText>
        <ThemedText>Már csak a fiókodat kell létrehozni:</ThemedText>
      </View>
      <View
        style={{
          maxWidth: 400,
          width: "100%",
          gap: 8,
          flex: 5,
          justifyContent: "center",
        }}
      >
        <Button mode="contained" icon="facebook" onPress={signInWithFacebook}>
          Csatlakozom Facebook-al
        </Button>
        <Button
          mode="contained"
          icon="google"
          background={{ color: "#f00" }}
          disabled
        >
          Csatlakozom Google-lel
        </Button>
        <Divider style={{ marginVertical: 16 }} />
        <TextInput
          onChangeText={setEmail}
          value={email}
          disabled
          placeholder="Email"
        />
        <TextInput
          onChangeText={setPassword}
          value={password}
          disabled
          placeholder="Jelszó"
          secureTextEntry
        />
        <Button
          mode="contained-tonal"
          disabled
          loading={loading}
          onPress={createUser}
        >
          <Text>Regisztrálok</Text>
        </Button>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    </ThemedView>
  );
}
