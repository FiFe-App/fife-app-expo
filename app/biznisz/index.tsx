import { theme } from "@/assets/theme";
import { BuzinessList } from "@/components/buziness/BuzinessList";
import { BuzinessMap } from "@/components/buziness/BuzinessMap";
import MapSelector from "@/components/MapSelector/MapSelector";
import { containerStyle } from "@/components/styles";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useMyLocation } from "@/hooks/useMyLocation";
import { supabase } from "@/lib/supabase/supabase";
import {
  loadBuzinesses,
  storeBuzinessLoading,
  storeBuzinessSearchParams, storeBuzinessSearchType, storeBuzinesses
} from "@/redux/reducers/buzinessReducer";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { RootState } from "@/redux/store";
import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import {
  FAB,
  Modal,
  Portal
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MyAppbar } from "../_layout";
import BuzinessSearchInput from "@/components/BuzinessSearchInput";
import { Button } from "@/components/Button";

export default function Index() {
  const { uid } = useSelector((state: RootState) => state.user);
  const navigation = useNavigation();
  const { buzinesses, searchParams } = useSelector(
    (state: RootState) => state.buziness,
  );
  const searchType = searchParams?.searchType;
  const skip = searchParams?.skip || 0;
  const take = 10;
  const searchCircle = searchParams?.searchCircle;
  const searchText = searchParams?.text || "";
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
    console.log(searchParams?.searchCircle);
  }, [searchParams?.searchCircle]);

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
          maxdistance: 100000,
        }
        : {
          lat: 47.4979,
          long: 19.0402,
          maxdistance: 100000,
        };
    if (searchLocation)
      supabase.functions
        .invoke("business-search", {
          body: {
            query: searchText || "biznisz",
            take:
              searchParams?.searchType === "map"
                ? -1
                : mySkip + take - 1,
            skip: searchParams?.searchType === "map" ? -1 : mySkip,
            ...searchLocation,
          },
        })
        .then((res) => {
          dispatch(storeBuzinessLoading(false));
          if (res.data) {
            dispatch(loadBuzinesses(res.data));
            setCanLoadMore(
              searchParams?.searchType !== "map" &&
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
      if (searchText)
        load();
      if (uid) dispatch(viewFunction({ key: "buzinessPage", uid }));
      navigation.setOptions({ header: () => <MyAppbar center={<BuzinessSearchInput onSearch={search} />} style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }} /> });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skip]),
  );

  if (uid)
    return (
      <ThemedView style={{ flex: 1 }} type="default">
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>

          <ThemedText variant="labelLarge" style={{ color: theme.colors.secondary, fontWeight: "bold" }}>Találatok</ThemedText>
          <Button icon='filter' mode="text" onPress={() => setLocationMenuVisible(true)}>Finomítás</Button>
        </View>
        {searchType === "list" || !searchType ? (
          <BuzinessList load={load} canLoadMore={canLoadMore} />
        ) : (
          <BuzinessMap load={search} />
        )}
        <FAB
          icon={searchType === "map" ? "format-list-bulleted" : "map-marker"}
          style={{ position: "absolute", bottom: 16, right: 16 }}
          variant="primary"
          onPress={() => {
            dispatch(storeBuzinessSearchType(searchType === "map" ? "list" : "map"));
          }} />

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