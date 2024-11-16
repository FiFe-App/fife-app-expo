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
import { Link, Redirect, router } from "expo-router";
import { useState } from "react";
import { AppState, View } from "react-native";

import {
  Button,
  Checkbox,
  DefaultTheme,
  Divider,
  HelperText,
  Icon,
  MD3DarkTheme,
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
  const dispatch = useDispatch();
  const theme = useTheme();
  console.log(theme);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [acceptConditions, setAcceptConditions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showPassword, setShowPassword] = useState(false);
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  const isPasswordWeak = !!!passwordRegex.exec(password)?.length;

  const { uid }: UserState = useSelector((state: RootState) => state.user);

  const createUser = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    }
    if (data?.user) {
      getUserData(data.user).then((res) => {});
    }
    console.log(data, error);
    setLoading(false);
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
    setLoading(false);
  };

  if (uid) return <Redirect href="/" />;
  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
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
        <TextInput onChangeText={setEmail} value={email} label="Email" />
        <TextInput
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
        <View style={{ flexDirection: "row" }}>
          <View style={{ marginRight: 4, justifyContent: "center" }}>
            <Icon
              source={isPasswordWeak ? "check-circle-outline" : "check-circle"}
              color={theme.colors.onSurface}
              size={18}
            />
          </View>
          <ThemedText type="label">
            Tartalmazzon kis- és nagybetűt valamint számot is.
          </ThemedText>
        </View>
        <TextInput
          onChangeText={setPasswordAgain}
          value={passwordAgain}
          secureTextEntry
          disabled={isPasswordWeak}
          label="Jelszó még egyszer"
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
        <Divider style={{ marginVertical: 16 }} />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Checkbox
            onPress={(e) => setAcceptConditions(!acceptConditions)}
            status={acceptConditions ? "checked" : "unchecked"}
          />
          <ThemedText>
            Elfogadom a
            <ThemedText type="link">
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
            isPasswordWeak || password !== passwordAgain || !acceptConditions
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
