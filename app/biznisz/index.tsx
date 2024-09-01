import BuzinessItem from "@/components/buziness/BuzinessItem";
import MapSelector from "@/components/MapSelector/MapSelector";
import { MapCircleType } from "@/components/MapSelector/MapSelector.types";
import { useMyLocation } from "@/hooks/useMyLocation";
import { storeBuzinesses } from "@/lib/redux/reducers/buzinessReducer";
import { RootState } from "@/lib/redux/store";
import { supabase } from "@/lib/supabase/supabase";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Icon,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

export default function Index() {
  const { uid } = useSelector((state: RootState) => state.user);
  const { buzinesses } = useSelector((state: RootState) => state.buziness);
  const dispatch = useDispatch();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [skip, setSkip] = useState(0);
  const { myLocation, error: locationError } = useMyLocation();
  const [visible, setVisible] = useState(false);
  const [circle, setCircle] = useState<MapCircleType | undefined>(undefined);

  const [tutorialVisible, setTutorialVisible] = useState(true);
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
          dispatch(storeBuzinesses(res.data));
        }
        if (res.error) {
          console.log(res.error);
        }
      });
  };

  useFocusEffect(
    useCallback(() => {
      if (!buzinesses.length && (myLocation || locationError)) {
        load({});
        console.log("MyLocationLoaded");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myLocation, locationError]),
  );

  const loadNext = () => {
    setSkip(skip + 5);
    load({ skip: skip + 5 });
  };
  if (uid)
    return (
      <View>
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
              onChangeText={setSearch}
              onSubmitEditing={() => load({})}
              placeholder="Keress a bizniszek közt..."
              right={<TextInput.Icon icon="magnify" onPress={load} />}
            />
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                {!!locationError && (
                  <Text>
                    <Icon size={16} source="map-marker-question" />
                    {locationError}
                  </Text>
                )}
                {!!circle ? (
                  <Text>
                    <Icon size={16} source="map-marker-account" />
                    Keresés meghatározott terület alapján.
                  </Text>
                ) : (
                  !!myLocation && (
                    <Text>
                      <Icon size={16} source="map-marker" />
                      Keresés jelenlegi helyzeted alapján.
                    </Text>
                  )
                )}
              </View>
              <Button onPress={showModal}>
                {!!circle ? "Környék kiválasztva" : "Válassz környéket"}
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Portal>
          <Modal
            visible={visible}
            onDismiss={hideModal}
            contentContainerStyle={containerStyle}
          >
            <MapSelector data={circle} setData={setCircle} searchEnabled />
          </Modal>
        </Portal>
        <ScrollView contentContainerStyle={{ gap: 8, marginTop: 8 }}>
          {loading && <ActivityIndicator />}
          {buzinesses.map((buzinessItem) => (
            <BuzinessItem data={buzinessItem} key={buzinessItem.id} />
          ))}
          {!!buzinesses.length && (
            <Button onPress={loadNext}>További bizniszek</Button>
          )}
        </ScrollView>
      </View>
    );
}
