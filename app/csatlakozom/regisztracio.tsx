import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { makeRedirectUri } from "expo-auth-session";
import { Link, Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { AppState, View } from "react-native";
import { Button, Divider } from "react-native-paper";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Index() {
  const { t } = useTranslation();
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
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <View style={{ justifyContent: "center", marginBottom: 16 }}>
        <ThemedText type="title" style={{ textAlign: "left" }}>
          {t("csatlakozom.greatYouAre")}
        </ThemedText>
        <ThemedText>{t("csatlakozom.chooseMethod")}</ThemedText>
      </View>
      <View
        style={{
          maxWidth: 400,
          width: "100%",
          gap: 8,
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
          {t("csatlakozom.facebookJoin")}
        </Button>
        <Button mode="contained" icon="google" disabled>
          {t("csatlakozom.googleJoin")}
        </Button>
        <Divider style={{ marginVertical: 16 }} />
        <Link href="/csatlakozom/email-regisztracio" asChild>
          <Button mode="contained">{t("csatlakozom.emailRegister")}</Button>
        </Link>
      </View>
    </ThemedView>
  );
}
