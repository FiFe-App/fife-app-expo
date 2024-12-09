import EventItem from "@/components/events/EventItem";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { Redirect, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Button } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import OneSignal from "react-onesignal";
import { View } from "react-native";
import {
  addDialog,
  addSnack,
  setNotificationToken,
} from "@/redux/reducers/infoReducer";

export interface EventWithRes extends Tables<"events"> {
  eventResponses?:
    | {
        value: number | null;
      }[]
    | null;
}

export default function Index() {
  const dispatch = useDispatch();
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const { notificationToken } = useSelector((state: RootState) => state.info);
  const [events, setEvents] = useState<EventWithRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>();
  const oneSignalAppId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
  const token = OneSignal.User.PushSubscription.token;

  useEffect(() => {
    if (token) dispatch(setNotificationToken(token));
  }, [dispatch, token]);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from("events")
        .select("*, eventResponses(*)")
        .limit(5)
        .order("date", { ascending: false })
        .then((res) => {
          if (res.error) {
            setError(res.error.message);
          } else {
            setEvents(res.data);
          }
          setLoading(false);
        });
      return () => {};
    }, []),
  );

  const showNotificationDialog = () => {
    dispatch(
      addDialog({
        title: "Kérsz értesítéseket?",
        text: "Szeretnél értesülni a FiFe app új eseményeiről?",
        onSubmit: initializeOneSignal,
        submitText: "Igen, kérek!",
      }),
    );
  };

  const initializeOneSignal = async () => {
    if (!uid || !oneSignalAppId) return;
    Notification.requestPermission();
    OneSignal.Debug.setLogLevel("");
    await OneSignal.init({
      appId: oneSignalAppId,
      autoResubscribe: true,

      allowLocalhostAsSecureOrigin: true,
    });
    await OneSignal.login(uid)
      .then((res) => {
        console.log(res);
        dispatch(addSnack({ title: "Feliratkoztál az értesítésekre!" }));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  if (!uid)
    return (
      <ThemedView style={{ flex: 1 }}>
        <Redirect href="/" />
      </ThemedView>
    );

  return (
    <ThemedView
      style={{
        flex: 1,
        padding: 16,
      }}
    >
      <ThemedText type="label" style={{ marginBottom: 8 }}>
        Közelgő események
      </ThemedText>
      {loading && <ActivityIndicator />}
      <View style={{ gap: 8 }}>
        {events.map((event, index) => (
          <EventItem key={index + "event"} event={event} />
        ))}
      </View>
      {!notificationToken && (
        <Button onPress={showNotificationDialog}>
          Engedélyezd az értesítéseket
        </Button>
      )}
    </ThemedView>
  );
}
