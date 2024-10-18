import { ThemedView } from "@/components/ThemedView";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { useState } from "react";
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
    console.log(data, error);
  };

  async function signInWithFacebook() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `http://localhost:8081/login`,
      },
    });
    console.log(data, error);
  }

  if (!uid)
    return (
      <ThemedView style={{ flex: 1, padding: 16 }}>
        <View style={{ maxWidth: 400, width: "100%", gap: 8, margin: "auto" }}>
          <Button mode="contained" icon="facebook" onPress={signInWithFacebook}>
            Csatlakozom Facebook-al
          </Button>
          <Button mode="contained" icon="google" background={{ color: "#f00" }}>
            Csatlakozom Google-lel
          </Button>
          <Divider style={{ marginVertical: 16 }} />
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
          <Button loading={loading} onPress={createUser}>
            <Text>Regisztrálok</Text>
          </Button>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      </ThemedView>
    );
}
