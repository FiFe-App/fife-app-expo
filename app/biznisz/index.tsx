import MapSelector from "@/components/MapSelector/MapSelector";
import { containerStyle } from "@/components/styles";
import { ThemedView } from "@/components/ThemedView";
import { useMyLocation } from "@/hooks/useMyLocation";
import {
  clearBuzinessSearchParams,
  loadBuzinesses,
  storeBuzinessLoading,
  storeBuzinessSearchParams,
  storeBuzinessSearchType,
  storeBuzinesses,
} from "@/redux/reducers/buzinessReducer";
import { RootState } from "@/redux/store";
import { supabase } from "@/lib/supabase/supabase";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import {
  Button,
  Card,
  Drawer,
  Icon,
  Modal,
  Portal,
  RadioButton,
  SegmentedButtons,
  Text,
  TextInput,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { BuzinessList } from "@/components/buziness/BuzinessList";
import { BuzinessMap } from "@/components/buziness/BuzinessMap";

export default function Index() {
  const { uid } = useSelector((state: RootState) => state.user);
  const { buzinesses, buzinessSearchParams } = useSelector(
    (state: RootState) => state.buziness,
  );
  const searchType = buzinessSearchParams?.searchType;
  const [searchFilter, setSearchFilter] = useState("");
  const skip = buzinessSearchParams?.skip || 0;
  const take = 5;
  const searchCircle = buzinessSearchParams?.searchCircle;
  const searchText = buzinessSearchParams?.text || "";
  const dispatch = useDispatch();

  const { myLocation, locationError } = useMyLocation();
  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const canSearch = !!searchCircle || !!myLocation;
  const [canLoadMore, setCanLoadMore] = useState(true);

  const [mapModalVisible, setMapModalVisible] = useState(false);

  const search = () => {
    console.log("search");

    if (!canSearch) return;

    dispatch(storeBuzinessSearchParams({ skip: 0 }));
    dispatch(storeBuzinesses([]));
    load();
  };

  const load = (paramSkip: number = 0) => {
    dispatch(storeBuzinessLoading(true));
    const mySkip = paramSkip || skip;
    console.log("load from ", mySkip, " to ", mySkip + take);

    const searchLocation = searchCircle
      ? {
          lat: searchCircle?.location.latitude,
          long: searchCircle?.location.longitude,
          search: searchText,
        }
      : myLocation
        ? {
            lat: myLocation?.coords.latitude,
            long: myLocation?.coords.longitude,
            search: searchText,
          }
        : {
            lat: 47.4979,
            long: 19.0402,
            search: searchText,
          };
    if (searchLocation)
      supabase
        .rpc("nearby_buziness", searchLocation)
        .range(mySkip, mySkip + take - 1)
        .then((res) => {
          dispatch(storeBuzinessLoading(false));
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
      console.log("skip changed", skip);
      if (!buzinesses.length && searchText && (searchCircle || myLocation))
        load();
      if (uid) dispatch(viewFunction({ key: "buzinessPage", uid }));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skip]),
  );
  useEffect(() => {
    if (buzinessSearchParams?.searchCircle) {
      setMapModalVisible(false);
    }
  }, [buzinessSearchParams?.searchCircle]);

  const clearSearch = () => {
    dispatch(clearBuzinessSearchParams());
  };

  if (uid)
    return (
      <ThemedView style={{ flex: 1 }}>
        <Card
          mode="elevated"
          style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        >
          <Card.Content>
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
              enterKeyHint="search"
              placeholder="Keress a bizniszek közt..."
              right={
                <TextInput.Icon
                  icon="magnify"
                  onPress={search}
                  disabled={!canSearch}
                />
              }
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <SegmentedButtons
                value={searchType || "map"}
                onValueChange={(e) => {
                  if (e === "map" || e === "list")
                    dispatch(storeBuzinessSearchType(e));
                }}
                style={{ width: "50%" }}
                buttons={[
                  {
                    value: "map",
                    label: "Térkép",
                    icon: "map-marker",
                  },
                  {
                    value: "list",
                    label: "Lista",
                    icon: "format-list-bulleted",
                  },
                ]}
              />
            </View>
          </Card.Content>
        </Card>
        {searchType === "map" ? (
          <BuzinessMap load={load} />
        ) : (
          <BuzinessList load={load} canLoadMore={canLoadMore} />
        )}

        <Portal>
          <Modal
            visible={mapModalVisible}
            onDismiss={() => {
              setMapModalVisible(false);
            }}
          >
            <ThemedView></ThemedView>
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
            <ThemedView style={containerStyle}>
              <RadioButton.Group
                onValueChange={(newValue) => setSearchFilter(newValue)}
                value={searchFilter}
              >
                <View style={{ flexDirection: "row" }}>
                  <Text>Hozzám közel</Text>
                  <RadioButton
                    value="nearby"
                    onPress={() => {}}
                    right={() => <Icon source="navigation-variant" size={20} />}
                  />
                </View>
                <View style={{ flexDirection: "row" }}>
                  <Text>Válassz a térképen</Text>
                  <RadioButton
                    value="map"
                    onPress={() => {}}
                    right={() => <Icon source="map" size={20} />}
                  />
                </View>
                <View style={{ flexDirection: "row" }}>
                  <Text>Mindegy hol</Text>
                  <RadioButton
                    value="anywhere"
                    onPress={() => {}}
                    right={() => (
                      <Icon source="map-marker-question-outline" size={20} />
                    )}
                  />
                </View>
              </RadioButton.Group>
              <MapSelector
                data={searchCircle}
                setData={(sC) => {
                  console.log("set", sC);

                  if (sC)
                    dispatch(storeBuzinessSearchParams({ searchCircle: sC }));
                }}
                searchEnabled
                setOpen={setMapModalVisible}
              />
            </ThemedView>
          </Modal>
        </Portal>
      </ThemedView>
    );
}
