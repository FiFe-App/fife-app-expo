import { theme } from "@/assets/theme";
import { UsersList } from "@/components/user/UsersList";
import MapSelector from "@/components/MapSelector/MapSelector";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  storeUserSearchParams
} from "@/redux/reducers/usersReducer";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { dismissHomeAddBuzinessCard } from "@/redux/reducers/appReducer";
import { RootState } from "@/redux/store";
import { router, Stack, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import style from "@/components/styles";
import {
  Card,
  IconButton,
  Icon, Modal,
  Portal, Text
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MyAppbar } from "@/components/MyAppBar";
import Smiley from "@/components/Smiley";
import BuzinessSearchInput from "@/components/BuzinessSearchInput";
import WhatToDo from "@/components/WhatToDo";
import { Button } from "@/components/Button";
import { storeBuzinesses } from "@/redux/reducers/buzinessReducer";
import { useFifeSearch } from "@/hooks/useFifeSearch";
import { useProfileSearch } from "@/hooks/useProfileSearch";

export default function Index() {
  const { uid } = useSelector((state: RootState) => state.user);
  const { homeAddBuzinessCardDismissed } = useSelector((state: RootState) => state.app);
  const navigation = useNavigation();
  const { userSearchParams } = useSelector(
    (state: RootState) => state.users,
  );
  const searchCircle = userSearchParams?.searchCircle;
  const dispatch = useDispatch();

  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const [whatVisible, setWhatVisible] = useState(false);
  const [userHasBuzinesses, setUserHasBuzinesses] = useState<boolean | null>(null);
  const [showCtaCard, setShowCtaCard] = useState(false);

  const { fetch, data, fetchNextPage, hasMore } = useFifeSearch();
  const { results: newestUsers, search: fetchNewest } = useProfileSearch();


  const handleSearch = () => {
    dispatch(storeBuzinesses([]));
    router.push("/biznisz");
  };

  useEffect(() => {
    fetch();
  }, [searchCircle]);

  const handleDismissCtaCard = () => {
    dispatch(dismissHomeAddBuzinessCard());
    setShowCtaCard(false);
  };


  useFocusEffect(
    useCallback(() => {
      if (data.length === 0) {
        fetch();
      }
      if (newestUsers.length === 0) {
        fetchNewest();
      }
      if (uid) dispatch(viewFunction({ key: "homePage", uid }));
    }, [data.length, newestUsers.length, uid, dispatch, fetch, fetchNewest]),
  );

  if (uid)
    return (
      <>
        <Stack.Screen options={{ header: () => <MyAppbar center={<BuzinessSearchInput onSearch={handleSearch} />} style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }} /> }} />
        <ThemedView style={{ flex: 1, zIndex: 100 }} type="default">
          <ThemedView style={{ width: "100%", alignItems: "center", zIndex: 100 }} type="card">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
              <Smiley style={{ width: 40, height: 40, borderRadius: 6, zIndex: 100000 }} />
              <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flex: 1 }}>
                <Text variant="titleMedium">Üdvözöllek a FiFe Appban!</Text>
                <Button icon="help-circle" onPress={() => setWhatVisible(true)} style={{ padding: 0 }}>
                  <Text variant="labelMedium">Mit lehet itt csinálni?</Text>
                </Button>
              </View>
            </View>
          </ThemedView>
          <ThemedView type="card" style={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: 8, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
              <ThemedText variant="labelLarge" style={{ color: theme.colors.secondary, fontWeight: "bold" }}>Fife Radar</ThemedText>
              <Icon size={18} color={theme.colors.secondary} source="wifi" />
            </View>
            <Button
              icon={searchCircle ? "map-marker" : "map-marker-outline"}
              mode="contained-tonal"
              labelStyle={{ marginVertical: 4 }}
              onPress={() => setLocationMenuVisible(true)}
            >Hol keresel?</Button>
          </ThemedView>
          {showCtaCard && (
            <Card
              mode="elevated"
              style={{
                marginHorizontal: 16,
                marginVertical: 8,
              }}
            >
              <Card.Content style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium">Hozd létre a bizniszed!</Text>
                  <Text variant="bodySmall" style={{ marginTop: 4 }}>
                    Oszd meg a tudásodat és képességeidet másokkal.
                  </Text>
                </View>
                <IconButton
                  icon="plus"
                  mode="contained"
                  size={24}
                  onPress={() => router.push("/biznisz/new")}
                />
                <IconButton
                  icon="close"
                  size={20}
                  onPress={handleDismissCtaCard}
                />
              </Card.Content>
            </Card>
          )}
          <UsersList load={fetchNextPage} canLoadMore={hasMore} data={data} />
          <WhatToDo visible={whatVisible} onDismiss={() => setWhatVisible(false)} />
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
                },
              ]}
            >
              <ThemedView style={style.containerStyle}>
                <MapSelector
                  data={searchCircle}
                  setData={(sC) => {
                    if (
                      (sC && "location" in sC && "radius" in sC) ||
                      sC == undefined
                    ) {
                      dispatch(storeUserSearchParams({ searchCircle: sC }));
                      setLocationMenuVisible(false);
                    }
                  }}
                  searchEnabled
                  markerOnly
                  setOpen={setLocationMenuVisible}
                />
              </ThemedView>
            </Modal>
          </Portal>
        </ThemedView>
      </>
    );
}