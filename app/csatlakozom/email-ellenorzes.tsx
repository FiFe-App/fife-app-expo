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
import { useTranslation } from "react-i18next";

export default function Index() {
  const { t } = useTranslation();
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
                setRes(t('csatlakozom.waitBeforeResend'));
              else if (err.code === "validation_failed")
                setRes(t('csatlakozom.invalidEmail'));
              else setRes(err.message);
              return;
            }

            if (res.data)
              setRes(t('csatlakozom.emailResent'));
          })
          .catch((err) => {
            console.error("asd", err);
            setRes(t('csatlakozom.errorOccurred'));
          });
      })
      .catch((err) => {
        console.log("err", err);
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
              setRes(t('csatlakozom.userNotFound'));
            throw new Error(res.error.message);
          }
        });
    }
    return null;
  };

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
          alignSelf:"center",
          alignItems:"center"
        }}
      >
        <ThemedText type="title">
          {t('csatlakozom.verifyEmail')}
        </ThemedText>
        <View style={{ gap: 16, width:"100%" }}>
          <ThemedText>{t('csatlakozom.emailSent')}</ThemedText>
          {!edit ? (
            <ThemedText style={{ textAlign: "center" }}>{email}</ThemedText>
          ) : (
            <>
              <TextInput
                style={{
                  textAlign: "center",
                  borderRadius: 8,
                  padding: 0,
                  marginBottom: 16
                }}
                placeholder={t('csatlakozom.newEmailPlaceholder')}
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
            {t('csatlakozom.resendEmail')}
          </Button>
          {res && <ThemedText type="subtitle">{res}</ThemedText>}
          {edit ? <Button onPress={()=>setEdit(false)}>{t('csatlakozom.cancel')}</Button> :
            <Button onPress={() => setEdit(true)}>{t('csatlakozom.wrongEmail')}</Button>}
        </View>
      </View>
    </ThemedView>
  );
}
