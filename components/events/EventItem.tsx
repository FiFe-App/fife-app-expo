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
  const sumPeople =
    event?.eventResponses?.reduce((e, c) => {
      if (c.value) return e + c.value / 10;
      return e;
    }, 0) || 0;
  const [defaultValue, setDefaultValue] = useState(sumPeople);

  return (
    <Card
      onPress={(e) => {
        e.stopPropagation();
      }}
    >
      <Card.Content>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <ThemedText
            type="defaultSemiBold"
            style={{ flex: 1, marginHorizontal: 4 }}
          >
            {event.title}
          </ThemedText>
          <Link
            asChild
            style={{ margin: 0 }}
            href={{ pathname: "/events/[id]", params: { id: event.id } }}
          >
            <IconButton icon="arrow-right" />
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
            <Text style={{ marginHorizontal: 4 }}>
              {date.toLocaleString("hu-HU")}
            </Text>
          </ThemedText>
          <ThemedText>
            <Text style={{ marginHorizontal: 4 }}>{event.duration}</Text>
            <Icon source="clock" size={16} />
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
            <Icon source="map-marker" size={16} />
            <Text style={{ marginHorizontal: 4 }}>{event.locationName}</Text>
          </ThemedText>
          <ThemedText>
            <Text style={{ marginHorizontal: 4 }}>
              {Math.round(sumPeople - defaultValue + value)} fő
            </Text>
            <Icon source="account-multiple" size={16} />
          </ThemedText>
        </View>
        {!defaultValue && (
          <GoingInput
            eventId={event.id}
            value={value}
            onOuterValueChange={setValue}
          />
        )}
      </Card.Content>
    </Card>
  );
};

export default EventItem;
