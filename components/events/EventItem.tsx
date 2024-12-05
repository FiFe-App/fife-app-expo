import { Card, Icon, IconButton, Surface, Text } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import Slider from "@react-native-community/slider";
import { View } from "react-native";
import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { SetStateAction, useEffect, useState } from "react";
import { UserState } from "@/redux/store.type";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { EventWithRes } from "@/app/home";
import { ThemedView } from "../ThemedView";
import { Link, router } from "expo-router";
import GoingInput from "./GoingInput";

interface EventItemProps {
  event: EventWithRes;
}

const EventItem = ({ event }: EventItemProps) => {
  const date = new Date(event.date);
  const [value, setValue] = useState<number>(0);
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(true);
  const [defaultValue, setDefaultValue] = useState(0);

  console.log(event);

  const sumPeople =
    event?.eventResponses?.reduce((e, c) => {
      if (c.value) return e + c.value / 10;
      return e;
    }, 0) || 0;

  return (
    <Card
      onPress={(e) => {
        e.stopPropagation();
      }}
    >
      <Card.Content>
        <View style={{ flexDirection: "row" }}>
          <ThemedText type="defaultSemiBold">{event.title}</ThemedText>
          <Link
            asChild
            style={{ flex: 1, padding: 8 }}
            href={{ pathname: "/events/[id]", params: { id: event.id } }}
          >
            <IconButton icon="arrow" />
          </Link>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <ThemedText style={{ flex: 1 }}>
            <Icon source="calendar" size={16} />
            {date.toLocaleString("hu-HU")}
          </ThemedText>
          <ThemedText>
            <Icon source="clock" size={16} />
            {event.duration}
          </ThemedText>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <ThemedText style={{ flexGrow: 1 }}>
            <Icon source="account-multiple" size={16} />
            {Math.round(sumPeople - defaultValue + value)} fő
          </ThemedText>
          <ThemedText>
            <Icon source="map-marker" size={16} />
            {event.locationName}
          </ThemedText>
        </View>
        <GoingInput
          eventId={event.id}
          value={value}
          onOuterValueChange={setValue}
        />
      </Card.Content>
    </Card>
  );
};

export default EventItem;
