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
import { useSelector } from "react-redux";
import OneSignal from "react-onesignal";
import { View } from "react-native";

export interface EventWithRes extends Tables<"events"> {
  eventResponses?:
    | {
        value: number | null;
      }[]
    | null;
}

export default function Index() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const [events, setEvents] = useState<EventWithRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>();
  const oneSignalAppId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
  const pushToken = OneSignal.User.PushSubscription.token;

  useEffect(() => {
    if (pushToken) {
    }
  }, [pushToken]);

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

  const initializeOneSignal = async () => {
    if (!uid || !oneSignalAppId) return;
    if (pushToken) {
      //return;
    }
    await OneSignal.init({
      appId: oneSignalAppId,
      notifyButton: {
        enable: true,
      },

      allowLocalhostAsSecureOrigin: true,
    });

    await OneSignal.login(uid)
      .then((res) => {
        console.log(res);
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
      {!pushToken && (
        <Button onPress={initializeOneSignal}>
          Engedélyezd az értesítéseket
        </Button>
      )}
    </ThemedView>
  );
}
