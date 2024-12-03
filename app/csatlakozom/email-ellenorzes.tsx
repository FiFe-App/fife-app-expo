import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { supabase } from "@/lib/supabase/supabase";
import { login, setUserData } from "@/redux/reducers/userReducer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useDispatch } from "react-redux";

export default function Index() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(false);
  const [res, setRes] = useState<null | string>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      console.log(data, error);

      if (data.session?.user.confirmed_at) {
        dispatch(setUserData({ ...data.session.user }));
        dispatch(login(data.session.user.id));
        router.push("/csatlakozom/elso-lepesek");
      }
    });
  }, [dispatch, res]);

  const send = () => {
    console.log("sending");
    update()
      .then(() => {
        supabase.auth
          .resend({
            type: "signup",
            email,
            options: {
              emailRedirectTo: "http://localhost:8081/csatlakozom/elso-lepesek",
            },
          })
          .then((res) => {
            console.log(res);
            if (res.error) {
              const err = res.error;
              console.log(err);
              if (err.code === "over_email_send_rate_limit")
                setRes(
                  "Kérlek várj még egy kicsit mielőtt újabb email-t kérsz.",
                );
              else if (err.code === "validation_failed")
                setRes("Nem megfelelő email-cím");
              else setRes(err.message);
              return;
            }

            if (res.data)
              setRes("Email elküldve! Nézd meg a spam mappában is!");
          })
          .catch((err) => {
            console.error("asd", err);
            setRes("A túróba. Valami hiba történt, próbáld meg újra!");
          });
      })
      .catch((err) => {
        console.log("err");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const update = async () => {
    if (edit) {
      return await supabase.auth
        .updateUser({
          email,
        })
        .then((res) => {
          console.log(res);

          if (res.error) {
            if (res.error?.code === "user_not_found")
              setRes("Nem létezik ez a felhasználó");
            throw new Error(res.error.message);
          }
        });
    }
    return null;
  };

  useEffect(() => {
    if (edit) setEmail("");
  }, [edit]);
  useEffect(() => {
    AsyncStorage.getItem("email").then((res) => {
      if (res) setEmail(res);
    });
  }, []);

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
        <ThemedText type="title">
          Kérlek igazold vissza az email-címedet
        </ThemedText>
        <View style={{}}>
          <ThemedText>Küldtünk egy email-t erre a címre:</ThemedText>
          {!edit ? (
            <ThemedText style={{ textAlign: "center" }}>{email}</ThemedText>
          ) : (
            <>
              <TextInput
                style={{
                  textAlign: "center",
                  borderRadius: 8,
                  margin: 5,
                }}
                placeholder="Az új email-címed"
                value={email}
                onChangeText={setEmail}
              />
            </>
          )}
          <Button
            onPress={send}
            loading={loading}
            disabled={!email}
            mode={edit ? "contained" : "contained-tonal"}
          >
            Email újra-küldése
          </Button>
          {res && <ThemedText type="subtitle">{res}</ThemedText>}
          <Button onPress={() => setEdit(true)}>Elírtad az email-címed?</Button>
        </View>
      </View>
    </ThemedView>
  );
}
