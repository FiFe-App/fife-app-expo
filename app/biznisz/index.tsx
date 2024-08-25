import BuzinessItem from "@/components/buziness/BuzinessItem";
import MapSelector from "@/components/MapSelector/MapSelector";
import { MapCircleType } from "@/components/MapSelector/MapSelector.types";
import { useMyLocation } from "@/hooks/useMyLocation";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Icon,
  Portal,
  Text,
  TextInput,
  Modal,
} from "react-native-paper";
import { useSelector } from "react-redux";

export interface BuzinessItemInterface {
  id: number;
  title: string;
  description: string;
  author: string;
  lat: number;
  long: number;
  dist_meters: number;
}

export default function Index() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const [list, setList] = useState<BuzinessItemInterface[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [skip, setSkip] = useState(0);
  const { myLocation, error: locationError } = useMyLocation();
  const [visible, setVisible] = useState(false);
  const [circle, setCircle] = useState<MapCircleType | undefined>(undefined);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const containerStyle = {
    backgroundColor: "white",
    padding: 20,
    margin: 30,
    height: 500,
  };
  useEffect(() => {
    if (circle) {
      setVisible(false);
    }
  }, [circle]);

  const load = ({ skip }: { skip?: number }) => {
    setLoading(true);

    const searchLocation = circle
      ? {
          lat: circle?.position.latitude,
          long: circle?.position.longitude,
          search,
        }
      : myLocation
        ? {
            lat: myLocation?.coords.latitude,
            long: myLocation?.coords.longitude,
            search,
          }
        : null;
    if (searchLocation)
      supabase.rpc("nearby_buziness", searchLocation).then((res) => {
        setLoading(false);
        if (res.data) {
          setList(res.data);
        }
        if (res.error) {
          console.log(res.error);
        }
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

        <Portal>
          <Modal
            visible={visible}
            onDismiss={hideModal}
            contentContainerStyle={containerStyle}
          >
            <MapSelector data={circle} setData={setCircle} searchEnabled />
          </Modal>
        </Portal>
        <View style={{ flexDirection: "row" }}>
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
          <Button onPress={showModal}>Válassz környéket</Button>
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
