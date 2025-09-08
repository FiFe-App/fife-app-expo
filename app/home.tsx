import { theme } from "@/assets/theme";
import { BuzinessList } from "@/components/buziness/BuzinessList";
import MapSelector from "@/components/MapSelector/MapSelector";
import { containerStyle } from "@/components/styles";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useMyLocation } from "@/hooks/useMyLocation";
import { supabase } from "@/lib/supabase/supabase";
import {
  loadBuzinesses,
  storeBuzinessLoading,
  storeBuzinessSearchParams, storeBuzinesses
} from "@/redux/reducers/buzinessReducer";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { RootState } from "@/redux/store";
import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import {
  Modal,
  Portal, Text
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MyAppbar } from "./_layout";
import Smiley from "@/components/Smiley";
import BuzinessSearchInput from "@/components/BuzinessSearchInput";

export default function Index() {
  const { uid } = useSelector((state: RootState) => state.user);
  const navigation = useNavigation();
  const { buzinesses, buzinessSearchParams } = useSelector(
    (state: RootState) => state.buziness,
  );
  const skip = buzinessSearchParams?.skip || 0;
  const take = 10;
  const searchCircle = buzinessSearchParams?.searchCircle;
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

    const searchLocation = searchCircle?.location.latitude && searchCircle?.location.longitude
      ? {
        lat: searchCircle?.location?.latitude,
        long: searchCircle?.location?.longitude,
        distance: searchCircle?.radius,
      }
      : myLocation
        ? {
          lat: myLocation?.coords.latitude,
          long: myLocation?.coords.longitude,
          distance: 1000,
        }
        : {
          lat: 47.4979,
          long: 19.0402,
          distance: 16000,
        };
    if (searchLocation)
      supabase.rpc("newest_buziness", { ...searchLocation, skip: mySkip, take })
        .then((res) => {
          dispatch(storeBuzinessLoading(false));
          if (res.data) {
            dispatch(loadBuzinesses(res.data));
            setCanLoadMore(
              !(res.data.length < take),
            );
            console.log(res.data);
          }
          if (res.error) {
            console.log(res.error);
          }
        })
  };

  useFocusEffect(
    useCallback(() => {
      console.log("skip changed", skip);
      dispatch(storeBuzinesses([]))
      load();
      if (uid) dispatch(viewFunction({ key: "homePage", uid }));
      navigation.setOptions({ header: () => <MyAppbar center={<BuzinessSearchInput onSearch={search} />} style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }} /> });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skip]),
  );

  if (uid)
    return (
      <ThemedView style={{ flex: 1 }} type="default">
        <View style={{ width: "100%", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
            <Smiley style={{ width: 40, height: 40, borderRadius: 6, zIndex: 100000 }} />
            <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flex: 1 }}>
              <Text variant="titleMedium">Üdvözöllek a FiFe Appban!</Text>
              <Text variant="bodyMedium">Fedezd fel a legújabb bizniszeket a környékeden.</Text>
            </View>
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
          <ThemedText variant="labelLarge" style={{ color: theme.colors.secondary, fontWeight: "bold" }}>Új bizniszek Budapesten</ThemedText>
        </View>
        <BuzinessList load={load} canLoadMore={canLoadMore} />
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