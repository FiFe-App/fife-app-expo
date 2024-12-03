import { Card, Icon, Text } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import Slider from "@react-native-community/slider";
import { View } from "react-native";
import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { useEffect, useState } from "react";
import { UserState } from "@/redux/store.type";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { EventWithRes } from "@/app/home";

interface EventItemProps {
  event: EventWithRes;
}

const EventItem = ({ event }: EventItemProps) => {
  const date = new Date(event.date);
  const [value, setValue] = useState<number>(0);
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(true);

  console.log(event);

  const sumPeople = event?.eventResponses?.reduce((e, c) => {
    if (c.value) return e + c.value / 10;
    return e;
  }, 0);

  useEffect(() => {
    if (event.id && uid)
      supabase
        .from("eventResponses")
        .select("*")
        .eq("user_id", uid)
        .eq("event_id", event.id)
        .single()
        .then((res) => {
          if (res.data?.value) setValue(res.data?.value / 10);
          setLoading(false);
        });
  }, [event.id, uid]);
  const onValueChange = (value: number) => {
    console.log("cahgne");

    supabase
      .from("eventResponses")
      .upsert(
        {
          event_id: event.id,
          value: value * 10,
        },
        { onConflict: "event" },
      )
      .then((res) => {
        console.log(res);
      });
  };

  return (
    <Card mode="elevated">
      <Card.Title
        title={date.toLocaleString("hu-HU") + " - " + event.duration}
      />

      <Card.Content>
        <ThemedText>{event.title}</ThemedText>

        <Text>
          <ThemedText style={{ flexGrow: 1 }}>
            <Icon source="account-multiple" size={16} />
            {sumPeople} fő
          </ThemedText>
          <ThemedText>a</ThemedText>
        </Text>
        <ThemedText>Mennyire valószínű, hogy itt leszel?</ThemedText>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#6750a4"
            maximumTrackTintColor="#e4e4e4"
            thumbTintColor="#6750a4"
            value={value}
            onValueChange={onValueChange}
            step={0.1}
            disabled={loading}
          />
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={{ flex: 1 }}>Nem megyek</Text>
          <Text>Elmegyek</Text>
        </View>
      </Card.Content>
    </Card>
  );
};

export default EventItem;
