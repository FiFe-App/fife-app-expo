import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import {
  setName,
  setUserData,
  login as sliceLogin,
} from "@/lib/redux/reducers/userReducer";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { DarkTheme } from "@react-navigation/native";
import { User } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import { Redirect, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import {
  Button,
  DefaultTheme,
  Divider,
  MD3LightTheme,
  Text,
  TextInput,
} from "react-native-paper";
import { lightBlueA100 } from "react-native-paper/lib/typescript/styles/themes/v2/colors";
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
  const color = useThemeColor(
    { light: DarkTheme.colors.text, dark: "black" },
    "text",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const disabledSubmit = password.length < 6;

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
      router.navigate("/csatlakozom/elso-lepesek");
    }
  };

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
        <Button
          mode="contained"
          loading={loading}
          onPress={createUser}
          disabled={disabledSubmit}
          textColor={color}
        >
          <ThemedText lightColor={"white"} darkColor="black">
            Regisztrálok
          </ThemedText>
        </Button>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    </ThemedView>
  );
}
