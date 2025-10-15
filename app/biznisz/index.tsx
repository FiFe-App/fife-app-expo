import { theme } from "@/assets/theme";
import { BuzinessList } from "@/components/buziness/BuzinessList";
import { BuzinessMap } from "@/components/buziness/BuzinessMap";
import MapSelector from "@/components/MapSelector/MapSelector";
import { containerStyle } from "@/components/styles";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  storeBuzinessSearchParams, storeBuzinessSearchType
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
import { useBuzinessSearch } from "@/hooks/useBuzinessSearch";

export default function Index() {
  const { uid } = useSelector((state: RootState) => state.user);
  const navigation = useNavigation();
  const { searchParams } = useSelector(
    (state: RootState) => state.buziness,
  );
  const searchType = searchParams?.searchType;
  const searchCircle = searchParams?.searchCircle;
  const dispatch = useDispatch();

  const { canLoadMore, search, loadNext } = useBuzinessSearch();
  const [locationMenuVisible, setLocationMenuVisible] = useState(false);

  useEffect(() => {
    console.log(searchParams?.searchCircle);
  }, [searchParams?.searchCircle]);

  useFocusEffect(
    useCallback(() => {
      if (uid) dispatch(viewFunction({ key: "buzinessPage", uid }));
      navigation.setOptions({ header: () => <MyAppbar center={<BuzinessSearchInput onSearch={search} />} style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }} /> });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (uid)
    return (
      <ThemedView style={{ flex: 1 }} type="default">
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>

          <ThemedText variant="labelLarge" style={{ color: theme.colors.secondary, fontWeight: "bold" }}>Találatok</ThemedText>
          <Button icon='filter' mode="text" onPress={() => setLocationMenuVisible(true)}>Finomítás</Button>
        </View>
        {searchType === "list" || !searchType ? (
          <BuzinessList load={loadNext} canLoadMore={canLoadMore} />
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