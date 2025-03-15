import { BuzinessList } from "@/components/buziness/BuzinessList";
import { BuzinessMap } from "@/components/buziness/BuzinessMap";
import MapSelector from "@/components/MapSelector/MapSelector";
import { containerStyle } from "@/components/styles";
import { ThemedView } from "@/components/ThemedView";
import { useMyLocation } from "@/hooks/useMyLocation";
import { supabase } from "@/lib/supabase/supabase";
import {
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
  const skip = buzinessSearchParams?.skip || 0;
  const take = 10;
  const searchCircle = buzinessSearchParams?.searchCircle;
  const searchText = buzinessSearchParams?.text || "";
  const dispatch = useDispatch();

  const { myLocation } = useMyLocation();
  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const canSearch = true; //!!searchCircle || !!myLocation;
  const [canLoadMore, setCanLoadMore] = useState(true);

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
            maxdistance: 10000,
          };
    if (searchLocation)
      supabase.functions
        .invoke("business-search", {
          body: {
            query: searchText,
            take:
              buzinessSearchParams?.searchType === "map"
                ? -1
                : mySkip + take - 1,
            skip: buzinessSearchParams?.searchType === "map" ? -1 : mySkip,
            ...searchLocation,
          },
        })
        .then((res) => {
          dispatch(storeBuzinessLoading(false));
          if (res.data) {
            dispatch(loadBuzinesses(res.data));
            setCanLoadMore(
              buzinessSearchParams?.searchType !== "map" &&
                !(res.data.length < take),
            );
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
      if (!buzinesses.length && searchText && (searchCircle || myLocation))
        load();
      if (uid) dispatch(viewFunction({ key: "buzinessPage", uid }));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skip]),
  );

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
                  mode={
                    searchCircle || myLocation ? "contained-tonal" : "contained"
                  }
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

                  if (
                    (sC && "location" in sC && "radius" in sC) ||
                    sC == undefined
                  )
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
