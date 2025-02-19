import BuzinessItem from "@/components/buziness/BuzinessItem";
import MapSelector from "@/components/MapSelector/MapSelector";
import { MapCircleType } from "@/components/MapSelector/MapSelector.types";
import { containerStyle } from "@/components/styles";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useMyLocation } from "@/hooks/useMyLocation";
import {
  clearBuzinessSearchParams,
  loadBuzinesses,
  storeBuzinessSearchParams,
  storeBuzinesses,
} from "@/redux/reducers/buzinessReducer";
import { RootState } from "@/redux/store";
import { supabase } from "@/lib/supabase/supabase";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  Drawer,
  Icon,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { setLocationError } from "@/redux/reducers/userReducer";

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
  const { myLocation, locationError } = useMyLocation();
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const [circle, setCircle] = useState<MapCircleType | undefined>(
    buzinessSearchParams?.location
      ? {
          position: buzinessSearchParams.location,
          radius: 100,
          radiusDisplay: null,
        }
      : undefined,
  );
  const canSearch = !!circle || !!myLocation;

  const [tutorialVisible, setTutorialVisible] = useState(true);
  useEffect(() => {
    if (circle) {
      setMapModalVisible(false);
    }
  }, [circle]);

  const search = () => {
    if (!canSearch) return;

    dispatch(storeBuzinessSearchParams({ skip: 0 }));
    dispatch(storeBuzinesses([]));
    load();
  };

  const load = (paramSkip?: number) => {
    setLoading(true);
    const mySkip = paramSkip || skip;
    console.log("load from ", mySkip, " to ", mySkip + take);

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
      supabase.functions
        .invoke("business-search", {
          body: { name: "Functions", query: searchText, take, skip: mySkip },
        })
        .then((res) => {
          console.log(res);

          setLoading(false);
          if (res.data) {
            dispatch(loadBuzinesses(res.data));
            setCanLoadMore(!(res.data.length < take));
            console.log(res.data);
          }
          if (res.error) {
            console.log(res.error);
          }
        })
        .catch((err) => {
          console.log(err);
        });
  };
  useFocusEffect(
    useCallback(() => {
      console.log("skip changed", skip);
      if (!buzinesses.length && searchText && (circle || myLocation)) load();
      if (uid) dispatch(viewFunction({ key: "buzinessPage", uid }));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skip]),
  );

  const loadNext = () => {
    dispatch(
      loadBuzinesses([
        {
          id: -1,
          title: "",
          description: "",
          author: "",
          recommendations: 0,
        },
      ]),
    );
    dispatch(storeBuzinessSearchParams({ skip: skip + take }));
    load(skip + take);
  };

  useEffect(() => {
    dispatch(storeBuzinessSearchParams({ location: circle?.position }));
  }, [circle, dispatch, skip]);

  const clearSearch = () => {
    dispatch(clearBuzinessSearchParams());
    setCircle(undefined);
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
              <Text style={{ marginBottom: 16 }}>
                Itt kereshetsz a hozzád vagy megadott helyhez közeli bizniszek
                között.
              </Text>
            )}
            <TextInput
              value={searchText}
              mode="outlined"
              outlineStyle={{ borderRadius: 1000 }}
              style={{ marginTop: 4 }}
              onChangeText={(text) => {
                if (!text.includes("$"))
                  dispatch(storeBuzinessSearchParams({ text }));
              }}
              onSubmitEditing={search}
              placeholder="Keress a bizniszek közt..."
              right={
                <TextInput.Icon
                  icon="magnify"
                  onPress={search}
                  disabled={!canSearch}
                  mode="contained-tonal"
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
              <Pressable
                style={{ flex: 1 }}
                onPress={() => {
                  if (locationError) dispatch(setLocationError(null));
                }}
              >
                {!!locationError && !circle && (
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
              </Pressable>
              <Button
                onPress={() => setMapModalVisible(true)}
                mode={!circle ? "contained" : "contained-tonal"}
              >
                {!!circle ? "Környék kiválasztva" : "Válassz környéket"}
              </Button>
              <IconButton icon="close" onPress={clearSearch} />
            </View>
          </Card.Content>
        </Card>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap: 8,
            marginTop: 8,
          }}
        >
          {buzinesses.map((buzinessItem) =>
            buzinessItem.id === -1 ? (
              <Divider
                key={Math.random() * 100000 + 100000 + "div"}
                style={{ marginVertical: 16 }}
              />
            ) : (
              <BuzinessItem data={buzinessItem} key={buzinessItem.id} />
            ),
          )}
          {!circle && !myLocation && !buzinesses.length && (
            <ThemedText style={{ alignSelf: "center" }}>
              Válassz környéket a kereséshez
            </ThemedText>
          )}
          {!loading &&
            (!!buzinesses.length && canLoadMore ? (
              <Button onPress={loadNext} style={{ alignSelf: "center" }}>
                További bizniszek
              </Button>
            ) : (
              <ThemedText style={{ alignSelf: "center" }}>
                Nem található több biznisz
              </ThemedText>
            ))}
        </ScrollView>

        {loading && !buzinesses.length && (
          <View style={{ flex: 1 }}>
            <ActivityIndicator />
          </View>
        )}
        <Portal>
          <Modal
            visible={mapModalVisible}
            onDismiss={() => {
              setMapModalVisible(false);
            }}
          >
            <ThemedView style={containerStyle}>
              <MapSelector
                data={circle}
                setData={setCircle}
                searchEnabled
                setOpen={setMapModalVisible}
              />
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
      </ThemedView>
    );
}
