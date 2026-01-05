import { theme } from "@/assets/theme";
import { UsersList } from "@/components/user/UsersList";
import MapSelector from "@/components/MapSelector/MapSelector";
import styles from "@/components/styles";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  storeUserSearchParams
} from "@/redux/reducers/usersReducer";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { RootState } from "@/redux/store";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useState } from "react";
import { Dimensions, View } from "react-native";
import {
  Modal,
  Portal, Text
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MyAppbar } from "@/components/MyAppBar";
import Smiley from "@/components/Smiley";
import BuzinessSearchInput from "@/components/BuzinessSearchInput";
import WhatToDo from "@/components/WhatToDo";
import { Button } from "@/components/Button";
import { storeBuzinesses } from "@/redux/reducers/buzinessReducer";
import { useInfiniteQuery } from "@/hooks/useInfiniteQuery";
import * as Clipboard from "expo-clipboard";
import { addSnack } from "@/redux/reducers/infoReducer";
import * as Sharing from "expo-sharing";

const PAGE_SIZE = Math.floor(Dimensions.get("window").height / 100);
export default function Index() {
  const { uid } = useSelector((state: RootState) => state.user);
  const navigation = useNavigation();
  const { userSearchParams } = useSelector(
    (state: RootState) => state.users,
  );
  const skip = userSearchParams?.skip || 0;
  const searchCircle = userSearchParams?.searchCircle;
  const dispatch = useDispatch();

  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const [whatVisible, setWhatVisible] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);
  const { fetch, data, fetchNextPage, hasMore } = useInfiniteQuery({
    tableName: "profiles",
    pageSize: PAGE_SIZE,
    columns: "*, profileRecommendations!profileRecommendations_profile_id_fkey(count), buzinesses:buziness(title)",
    trailingQuery: (query) => {
      return query.order("created_at", { ascending: false });
    }
  });

  const handleSearch = () => {
    dispatch(storeBuzinesses([]));
    router.push("/biznisz");
  };

  const shareLink = async () => {
    Sharing.shareAsync(`/meghivas?invited=${uid}`);
  };


  useFocusEffect(
    useCallback(() => {
      if (data.length === 0) {
        fetch();
      }
      console.log("skip changed", skip);
      if (uid) dispatch(viewFunction({ key: "homePage", uid }));
      navigation.setOptions({ header: () => <MyAppbar center={<BuzinessSearchInput onSearch={handleSearch} />} style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }} /> });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skip]),
  );

  if (uid)
    return (
      <ThemedView style={{ flex: 1, zIndex: 100 }} type="default">
        <View style={{ width: "100%", alignItems: "center", zIndex: 100 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
            <Smiley style={{ width: 40, height: 40, borderRadius: 6, zIndex: 100000 }} />
            <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flex: 1 }}>
              <Text variant="titleMedium">Üdvözöllek a FiFe Appban!</Text>
              <Button icon="help-circle" onPress={() => setWhatVisible(true)} style={{ padding: 0 }}>
                <Text variant="labelMedium">Mit lehet itt csinálni?</Text>
              </Button>
            </View>
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
          <ThemedText variant="labelLarge" style={{ color: theme.colors.secondary, fontWeight: "bold" }}>Új fifék Budapesten</ThemedText>
        </View>
        <UsersList load={fetchNextPage} canLoadMore={hasMore} data={data} />
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <ThemedView style={{ padding: 12, borderRadius: 8 }} type="card">
            <ThemedText variant="headlineSmall" style={{ marginBottom: 6, color: theme.colors.onSurface }}>
              Hívj meg másokat is a FiFe App-ba!
            </ThemedText>
            <Button mode="text" icon="link" onPress={shareLink}>
              Meghívó link megnyitása
            </Button>
          </ThemedView>
        </View>
        <WhatToDo visible={whatVisible} onDismiss={() => setWhatVisible(false)} />
        <Portal>
          <Modal
            visible={inviteVisible}
            onDismiss={() => setInviteVisible(false)}
            contentContainerStyle={{ marginHorizontal: 16 }}
          >
            <ThemedView style={[styles.containerStyle]}>
              <ThemedText style={{ marginBottom: 12 }}>
                Ha van ismerősöd akiben megbízol és használná a fifeappot, küldd el neki a lenti linket.
              </ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <ThemedText selectable style={{ flex: 1 }}>
                  fifeapp.hu/csatlakozom?invite={uid}
                </ThemedText>
                <Button
                  icon="content-copy"
                  onPress={() => {
                    if (!uid) return;
                    Clipboard.setStringAsync(`fifeapp.hu/csatlakozom?invite=${uid}`).then(() =>
                      dispatch(addSnack({ title: "Meghívó link vágólapra másolva!" }))
                    );
                  }}
                >
                  Másolás
                </Button>
              </View>
            </ThemedView>
          </Modal>
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
            <ThemedView style={styles.containerStyle}>
              <MapSelector
                data={searchCircle}
                setData={(sC) => {
                  console.log("set", sC);

                  if (
                    (sC && "location" in sC && "radius" in sC) ||
                    sC == undefined
                  )
                    dispatch(storeUserSearchParams({ searchCircle: sC }));
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