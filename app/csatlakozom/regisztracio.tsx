import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { makeRedirectUri } from "expo-auth-session";
import { Link, Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { View } from "react-native";
import { Button, Divider } from "react-native-paper";
import { useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";

export default function Index() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);

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

  if (uid) return <Redirect href="/" />;
  return (
    <ThemedView style={{ flex: 1, padding: Spacing.lg }}>
      <View style={{ justifyContent: "center", marginBottom: Spacing.lg }}>
        <ThemedText type="title" style={{ textAlign: "left" }}>
          Szuper vagy!
        </ThemedText>
        <ThemedText>Válaszd ki hogy akarsz csatlakozni:</ThemedText>
      </View>
      <View
        style={{
          maxWidth: 400,
          width: "100%",
          gap: Spacing.sm,
          flex: 3,
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
        <Divider style={{ marginVertical: Spacing.lg }} />
        <Link href="/csatlakozom/email-regisztracio" asChild>
          <Button mode="contained">E-mail és Jelszó regisztráció</Button>
        </Link>
      </View>
    </ThemedView>
  );
}
