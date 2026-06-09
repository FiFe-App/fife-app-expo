import { BuzinessList } from "@/components/buziness/BuzinessList";
import { BuzinessMap } from "@/components/buziness/BuzinessMap";
import MapSelector from "@/components/MapSelector/MapSelector";
import style from "@/components/styles";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  storeBuzinessSearchParams, storeBuzinessSearchType
} from "@/redux/reducers/buzinessReducer";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { RootState } from "@/redux/store";
import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import {
  FAB,
  List,
  Modal,
  Portal,
  Switch,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import FakeSearchInput from "@/components/FakeSearchInput";
import { Button } from "@/components/Button";
import { useBuzinessSearch } from "@/hooks/useBuzinessSearch";
import Measure from "@/components/tutorial/Measure";
import { MyAppbar } from "@/components/MyAppBar";
import { Spacing } from "@/constants/spacing";
import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";

export default function Index() {
  const theme = useAppTheme();
  const { uid } = useSelector((state: RootState) => state.user);
  const navigation = useNavigation();
  const { searchParams, buzinesses } = useSelector(
    (state: RootState) => state.buziness,
  );
  const searchType = searchParams?.searchType;
  const searchCircle = searchParams?.searchCircle;
  const ingyen = searchParams?.ingyen || false;
  const [ingyenLocal,setIngyenLocal] = useState(ingyen);

  const { canLoadMore, search, loadNext, error } = useBuzinessSearch();
  
  const listTitle = useMemo(() => searchParams?.text ? "Találatok: " + searchParams?.text : "Új bizniszek", [searchParams?.loading]);
  const dispatch = useDispatch();

  const [locationMenuVisible, setLocationMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.log("search bc of init");
      if (buzinesses.length === 0 && !searchParams?.loading)
        search();
      if (uid) dispatch(viewFunction({ key: "buzinessPage", uid }));
      navigation.setOptions({ header: () => <MyAppbar center={<FakeSearchInput />} style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }} /> });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (uid)
    return (
      <ThemedView style={{ flex: 1 }} type="default">
        <ThemedView type="card" style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>

          <ThemedText variant="labelLarge" type="bold" style={{ color: theme.colors.secondary }}>{listTitle}</ThemedText>
          <Measure name="filter">
            <View><Button icon='filter' mode="text" onPress={() => setLocationMenuVisible(true)}>Finomítás</Button></View>
          </Measure>
        </ThemedView>
        {searchType === "list" || !searchType ? (
          <BuzinessList load={loadNext} canLoadMore={canLoadMore} error={error} />
        ) : (
          <BuzinessMap load={() => search()} />
        )}
        <Measure name="map-switch">
          <FAB
            icon={searchType === "map" ? "format-list-bulleted" : "map"}
            style={{ position: "absolute", bottom: Spacing.lg, right: Spacing.lg }}
            variant="tertiary"
            customSize={80}
            onPress={() => {
              dispatch(storeBuzinessSearchType(searchType === "map" ? "list" : "map"));
            }} />
        </Measure>

        <Portal>
          <Modal
            visible={locationMenuVisible}
            onDismiss={() => {
              setLocationMenuVisible(false);
            }}
            style={{ alignItems: "center" }}
            contentContainerStyle={[
              {
                width: "90%",
                height: "90%",
                borderRadius: BorderRadius.md
              },
            ]}
          >
            <ThemedView style={style.containerStyle}>
              <MapSelector
                data={searchCircle}
                setData={(sC) => {
                  const newCircle = sC && "location" in sC && "radius" in sC ? sC : undefined;
                  dispatch(storeBuzinessSearchParams({ searchCircle: newCircle, ingyen: ingyenLocal }));
                  search(searchParams?.text, { ingyen: ingyenLocal, searchCircle: newCircle });
                }}
                searchEnabled
                setOpen={setLocationMenuVisible}
              >
                <List.Item
                  title="Csak ingyenes bizniszek"
                  description="Ingyenes vagy önkéntes bizniszeket mutass"
                  titleStyle={{fontFamily:"Piazzolla-ExtraBold"}}
                  left={(props) => <List.Icon {...props} color={theme.colors.primary} icon="charity" />}
                  right={() => (
                    <Switch
                    color={theme.colors.nature}
                      value={ingyenLocal}
                      onValueChange={(v) => {
                        setIngyenLocal(v);
                      }}
                    />
                  )}
                />
              </MapSelector>

            </ThemedView>
          </Modal>
        </Portal>
      </ThemedView>
    );
}