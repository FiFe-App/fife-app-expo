import BuzinessItem from "@/components/buziness/BuzinessItem";
import { useMyLocation } from "@/hooks/useMyLocation";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import axios, { AxiosResponse } from "axios";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Icon,
  Text,
  TextInput,
} from "react-native-paper";
import { useSelector } from "react-redux";

export interface BuzinessItemInterface {
  id: string;
  uid: string;
  name: string;
  description: string;
  page: {
    distance: number;
  }[];
}

export default function Index() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const [list, setList] = useState<BuzinessItemInterface[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const take = 10;
  const [skip, setSkip] = useState(0);
  const { myLocation, error: locationError } = useMyLocation();

  const load = ({ skip }: { skip?: number }) => {
    setLoading(true);

    supabase
      .rpc("nearby_buziness", {
        lat: 40.807313,
        lng: -73.946713,
      })
      .then(({ data, error }) => {
        console.log(data, error);
      });
    return;
    supabase.from("buziness").select().order("location");
    axios
      .get("buziness", {
        params: {
          search,
          take,
          skip,
          location: [myLocation?.coords.latitude, myLocation?.coords.longitude],
        },
      })
      .then((res: AxiosResponse<BuzinessItemInterface[]>) => {
        setLoading(false);
        setList(res.data);
        console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };
  useFocusEffect(
    useCallback(() => {
      if (!list.length && (myLocation || locationError)) {
        load({});
        console.log("MyLocationLoaded");
      }
    }, [myLocation, locationError]),
  );

  const loadNext = () => {
    setSkip(skip + 5);
    load({ skip: skip + 5 });
  };
  if (uid)
    return (
      <ScrollView>
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load({})}
          placeholder="Keress a bizniszek közt..."
          right={<TextInput.Icon icon="magnify" onPress={load} />}
        />
        <View>
          {!!locationError && (
            <Text>
              <Icon size={16} source="map-marker-question" />
              {locationError}
            </Text>
          )}
          {!!myLocation && (
            <Text>
              <Icon size={16} source="map-marker" />
              Keresés jelenlegi helyzeted alapján.
            </Text>
          )}
        </View>
        <ScrollView contentContainerStyle={{ gap: 8 }}>
          {loading && <ActivityIndicator />}
          {list.map((buzinessItem) => (
            <BuzinessItem data={buzinessItem} key={buzinessItem.id} />
          ))}
          {!!list.length && (
            <Button onPress={loadNext}>További bizniszek</Button>
          )}
        </ScrollView>
      </ScrollView>
    );
}
