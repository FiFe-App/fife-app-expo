import BuzinessItem from "@/components/buziness/BuzinessItem";
import MapSelector from "@/components/MapSelector/MapSelector";
import { MapCircleType } from "@/components/MapSelector/MapSelector.types";
import { containerStyle } from "@/components/styles";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useMyLocation } from "@/hooks/useMyLocation";
import {
  loadBuzinesses,
  storeBuzinessSearchParams,
  storeBuzinesses,
} from "@/lib/redux/reducers/buzinessReducer";
import { RootState } from "@/lib/redux/store";
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
import { useDispatch, useSelector } from "react-redux";

export default function Index() {
  const { uid } = useSelector((state: RootState) => state.user);
  const { buzinesses, buzinessSearchParams } = useSelector(
    (state: RootState) => state.buziness,
  );
  const skip = buzinessSearchParams?.skip || 0;
  const take = 5;
  const searchText = buzinessSearchParams?.text || "";
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(true);
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

  const search = () => {
    console.log("search");

    dispatch(storeBuzinessSearchParams({ skip: 0 }));
    dispatch(storeBuzinesses([]));
    load();
  };

  const load = () => {
    setLoading(true);
    console.log("load from ", skip, " to ", skip + take);

    const searchLocation = circle
      ? {
          lat: circle?.position.latitude,
          long: circle?.position.longitude,
          search: searchText,
        }
      : myLocation
        ? {
            lat: myLocation?.coords.latitude,
            long: myLocation?.coords.longitude,
            search: searchText,
          }
        : null;
    if (searchLocation)
      supabase
        .rpc("nearby_buziness", searchLocation)
        .range(skip, skip + take - 1)
        .then((res) => {
          setLoading(false);
          if (res.data) {
            dispatch(loadBuzinesses(res.data));
            setCanLoadMore(!(res.data.length < take));
            console.log(res.data);
          }
          if (res.error) {
            console.log(res.error);
          }
        });
  };
  useFocusEffect(
    useCallback(() => {
      if (myLocation || circle) {
        dispatch(storeBuzinesses([]));
        load();
        console.log("MyLocationLoaded");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myLocation, circle]),
  );

  const loadNext = () => {
    dispatch(storeBuzinessSearchParams({ skip: skip + take }));
  };

  useEffect(() => {
    console.log("skip changed", skip);
    load();
  }, [skip]);
  console.log(skip);

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
              value={searchText}
              mode="outlined"
              outlineStyle={{ borderRadius: 1000 }}
              style={{ marginTop: 4 }}
              onChangeText={(text) =>
                dispatch(storeBuzinessSearchParams({ text }))
              }
              onSubmitEditing={search}
              placeholder="Keress a bizniszek közt..."
              right={
                <TextInput.Icon
                  icon="magnify"
                  onPress={search}
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
                {!!myLocation && !circle && (
                  <Text>
                    <Icon size={16} source="map-marker" />
                    Keresés jelenlegi helyzeted alapján.
                  </Text>
                )}
                {!!circle && (
                  <Text>
                    <Icon size={16} source="map-marker" />
                    Keresés térképen választott hely alapján.
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
          }}
        >
          {buzinesses.map((buzinessItem) => (
            <BuzinessItem data={buzinessItem} key={buzinessItem.id} />
          ))}
          {!circle && !myLocation && loading && (
            <ThemedText style={{ alignSelf: "center" }}>
              Válassz környéket
            </ThemedText>
          )}
          {loading ? (
            (circle || myLocation) && <ActivityIndicator />
          ) : !!buzinesses.length && canLoadMore ? (
            <Button onPress={loadNext} style={{ alignSelf: "center" }}>
              További bizniszek
            </Button>
          ) : (
            <ThemedText style={{ alignSelf: "center" }}>
              Nem található több biznisz
            </ThemedText>
          )}
        </ScrollView>
      </ThemedView>
    );
}
