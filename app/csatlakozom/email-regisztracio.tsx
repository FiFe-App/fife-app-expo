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
import {
  Button,
  Checkbox,
  HelperText,
  Icon,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Index() {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
    <ThemedView style={{ flex: 1, padding: 16, alignItems:"center" }}>
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
          Juhé!
        </ThemedText>
        <ThemedText>Már csak a fiókodat kell létrehozni:</ThemedText>
        <View>
          <TextInput
            mode="outlined" onChangeText={setName} value={name} label="Neved*" />
          <HelperText type="info">A neved látható lesz mindenki számára, aki tag.</HelperText>
          
        </View><TextInput
          mode="outlined" onChangeText={setEmail} value={email} label="E-mail*" />
        <TextInput
          mode="outlined"
          onChangeText={setPassword}
          value={password}
          label="Jelszó*"
          secureTextEntry={!showPassword}
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
            Elfogadom a
            <ThemedText variant="labelLarge" type="link">
              <Link href="/csatlakozom/iranyelvek"> feltételeket</Link>
            </ThemedText>
            .
          </ThemedText>
        </View>
        <Button
          mode="contained"
          loading={loading}
          onPress={createUser}
          disabled={
            isPasswordWeak || !name || password !== passwordAgain || !acceptConditions
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
