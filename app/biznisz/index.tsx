import BuzinessItem from "@/components/buziness/BuzinessItem";
import MapSelector from "@/components/MapSelector/MapSelector";
import { MapCircleType } from "@/components/MapSelector/MapSelector.types";
import { containerStyle } from "@/components/styles";
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
  Card,
  Drawer,
  Icon,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { useSelector } from "react-redux";
import { Tables } from "@/database.types";
import { ThemedView } from "@/components/ThemedView";

export interface BuzinessItemInterface extends Tables<"buziness"> {
  lat?: number;
  long?: number;
  distance?: number;
}

export default function Index() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const [list, setList] = useState<BuzinessItemInterface[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [skip, setSkip] = useState(0);
  const { myLocation, error: locationError } = useMyLocation();
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const [circle, setCircle] = useState<MapCircleType | undefined>(undefined);

  const [tutorialVisible, setTutorialVisible] = useState(true);
  useEffect(() => {
    if (circle) {
      setMapModalVisible(false);
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
      supabase
        .rpc("nearby_buziness", searchLocation)
        .range(0, 10)
        .then((res) => {
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
      if (myLocation || circle) {
        load({});
        console.log("MyLocationLoaded");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myLocation, circle]),
  );

  const loadNext = () => {
    setSkip(skip + 5);
    load({ skip: skip + 5 });
  };
  if (uid)
    return (
      <ThemedView style={{ flex: 1 }}>
        <Card
          mode="elevated"
          style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        >
          {tutorialVisible && (
            <Card.Title
              title={"Bizniszelésre fel!"}
              right={() => (
                <IconButton
                  icon="close"
                  onPress={() => setTutorialVisible(false)}
                />
              )}
            />
          )}
          <Card.Content>
            {tutorialVisible && (
              <Text style={{ textAlign: "justify" }}>
                A te bizniszeid azon hobbijaid, képességeid vagy szakmáid
                listája, amelyeket meg szeretnél osztani másokkal is. {"\n"}Ha
                te mondjuk úgy gyártod a sütiket, mint egy gép, és ezt felveszed
                a bizniszeid közé, ezen az oldalon megtalálható leszel a süti
                kulcsszóval.
              </Text>
            )}
            <TextInput
              value={search}
              mode="outlined"
              outlineStyle={{ borderRadius: 1000 }}
              style={{ marginTop: 4 }}
              onChangeText={setSearch}
              onSubmitEditing={() => load({})}
              placeholder="Keress a bizniszek közt..."
              right={
                <TextInput.Icon
                  icon="magnify"
                  onPress={load}
                  mode="contained"
                />
              }
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <View style={{ flex: 1 }}>
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
              <Button
                onPress={() => setMapModalVisible(true)}
                mode={!circle ? "contained" : "contained-tonal"}
              >
                {!!circle ? "Környék kiválasztva" : "Válassz környéket"}
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Portal>
          <Modal
            visible={mapModalVisible}
            onDismiss={() => {
              setMapModalVisible(false);
            }}
          >
            <ThemedView style={containerStyle}>
              <MapSelector data={circle} setData={setCircle} searchEnabled />
            </ThemedView>
          </Modal>
          <Modal
            visible={locationMenuVisible}
            onDismiss={() => {
              setLocationMenuVisible(false);
            }}
            contentContainerStyle={[
              {
                backgroundColor: "white",
                margin: 40,
                padding: 10,
                height: "auto",
                borderRadius: 16,
              },
            ]}
          >
            <Drawer.Item
              label="Hozzám közel"
              onPress={() => {}}
              right={() => <Icon source="navigation-variant" size={20} />}
            />
            <Drawer.Item
              label="Válassz a térképen"
              onPress={() => {}}
              right={() => <Icon source="map" size={20} />}
            />
            <Drawer.Item
              label="Mindegy hol"
              onPress={() => {}}
              right={() => (
                <Icon source="map-marker-question-outline" size={20} />
              )}
            />
          </Modal>
        </Portal>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap: 8,
            marginTop: 8,

            flex: 1,
          }}
        >
          {loading && <ActivityIndicator />}
          {list.map((buzinessItem) => (
            <BuzinessItem data={buzinessItem} key={buzinessItem.id} />
          ))}
          {!!list.length && (
            <Button onPress={loadNext}>További bizniszek</Button>
          )}
        </ScrollView>
      </ThemedView>
    );
}
