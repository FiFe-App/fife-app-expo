import EventItem from "@/components/events/EventItem";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { Redirect, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator } from "react-native-paper";
import { useSelector } from "react-redux";

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
      {events.map((event, index) => (
        <EventItem key={index + "event"} event={event} />
      ))}
    </ThemedView>
  );
}
