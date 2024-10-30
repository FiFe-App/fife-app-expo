import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  setName,
  setUserData,
  login as sliceLogin,
} from "@/lib/redux/reducers/userReducer";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { User } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import { Redirect, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { Button, Divider, Text, TextInput } from "react-native-paper";
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

  const { uid, name }: UserState = useSelector(
    (state: RootState) => state.user,
  );

  const createUser = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      return;
    }
    if (data?.user) {
      getUserData(data.user).then((res) => {});
    }
    console.log(data, error);
  };

  const getUserData = async (userData: User) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select()
      .eq("id", userData.id)
      .single();
    if (error) {
      setError(error.message);
    }
    if (profile) {
      console.log("profile", profile);

      dispatch(sliceLogin(profile?.id));
      dispatch(setName(profile?.full_name));
      dispatch(setUserData({ ...userData, ...profile }));
    }
  };

  useEffect(() => {
    if (uid) router.navigate("/csatlakozom/elso-lepesek");
  }, [uid]);

  WebBrowser.maybeCompleteAuthSession(); // required for web only
  const redirectTo = makeRedirectUri();

  async function signInWithFacebook() {
    console.log(`${redirectTo}/csatlakozom/elso-lepesek`);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${redirectTo}/csatlakozom/elso-lepesek`,
      },
    });
    console.log(data, error);
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
        <Button
          mode="contained"
          icon="facebook"
          disabled
          onPress={signInWithFacebook}
        >
          Csatlakozom Facebook-al
        </Button>
        <Button mode="contained" icon="google" disabled>
          Csatlakozom Google-lel
        </Button>
        <Divider style={{ marginVertical: 16 }} />
        <TextInput onChangeText={setEmail} value={email} placeholder="Email" />
        <TextInput
          onChangeText={setPassword}
          value={password}
          placeholder="Jelszó"
          secureTextEntry
        />
        <Button mode="contained-tonal" loading={loading} onPress={createUser}>
          <Text>Regisztrálok</Text>
        </Button>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    </ThemedView>
  );
}
