import { BuzinessList } from "@/components/buziness/BuzinessList";
import { BuzinessMap } from "@/components/buziness/BuzinessMap";
import MapSelector from "@/components/MapSelector/MapSelector";
import { containerStyle } from "@/components/styles";
import { ThemedView } from "@/components/ThemedView";
import { useMyLocation } from "@/hooks/useMyLocation";
import { supabase } from "@/lib/supabase/supabase";
import {
  clearBuzinessSearchParams,
  loadBuzinesses,
  storeBuzinessLoading,
  storeBuzinessSearchParams,
  storeBuzinessSearchType,
  storeBuzinesses,
} from "@/redux/reducers/buzinessReducer";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { RootState } from "@/redux/store";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import {
  Button,
  Card,
  Modal,
  Portal,
  SegmentedButtons,
  TextInput,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

export default function Index() {
  const { uid } = useSelector((state: RootState) => state.user);
  const { buzinesses, buzinessSearchParams } = useSelector(
    (state: RootState) => state.buziness,
  );
  const searchType = buzinessSearchParams?.searchType;
  const [searchFilter, setSearchFilter] = useState("");
  const skip = buzinessSearchParams?.skip || 0;
  const take = 10;
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
  useEffect(() => {
    console.log(buzinessSearchParams?.searchCircle);
  }, [buzinessSearchParams?.searchCircle]);

  const load = (paramSkip: number = 0) => {
    dispatch(storeBuzinessLoading(true));
    const mySkip = paramSkip || skip;
    console.log("load from ", mySkip, " to ", mySkip + take);

    const searchLocation = searchCircle
      ? {
          lat: searchCircle?.location.latitude,
          long: searchCircle?.location.longitude,
          maxdistance: searchCircle?.radius,
        }
      : myLocation
        ? {
            lat: myLocation?.coords.latitude,
            long: myLocation?.coords.longitude,
            maxdistance: 10,
          }
        : {
            lat: 47.4979,
            long: 19.0402,
            maxdistance: 10,
          };
    if (searchLocation)
      supabase
        .rpc("nearby_buziness", {
          ...searchLocation,
          search: searchText,
          take:
            buzinessSearchParams?.searchType === "map" ? -1 : mySkip + take - 1,
          skip: buzinessSearchParams?.searchType === "map" ? -1 : mySkip,
        })
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
          style={{
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          }}
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
                flexWrap: "wrap",
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
                style={{ minWidth: 200 }}
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
              {searchType === "list" && (
                <Button
                  mode="contained"
                  onPress={() => setLocationMenuVisible(true)}
                >
                  Hol keresel?
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
        {searchType === "map" ? (
          <BuzinessMap load={search} />
        ) : (
          <BuzinessList load={load} canLoadMore={canLoadMore} />
        )}

        <Portal>
          <Modal
            visible={locationMenuVisible}
            onDismiss={() => {
              setLocationMenuVisible(false);
            }}
            contentContainerStyle={[
              {
                height: "auto",
                borderRadius: 16,
              },
            ]}
          >
            <ThemedView style={containerStyle}>
              <MapSelector
                data={searchCircle}
                setData={(sC) => {
                  console.log("set", sC);

                  if (sC && "location" in sC && "radius" in sC)
                    dispatch(storeBuzinessSearchParams({ searchCircle: sC }));
                }}
                searchEnabled
                setOpen={setLocationMenuVisible}
              />
            </ThemedView>
          </Modal>
        </Portal>
      </ThemedView>
    );
}
