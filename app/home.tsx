import { theme } from "@/assets/theme";
import { UsersList } from "@/components/user/UsersList";
import MapSelector from "@/components/MapSelector/MapSelector";
import { containerStyle } from "@/components/styles";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useMyLocation } from "@/hooks/useMyLocation";
import { supabase } from "@/lib/supabase/supabase";
import {
  loadUsers,
  storeUserLoading,
  storeUserSearchParams, storeUsers
} from "@/redux/reducers/usersReducer";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { RootState } from "@/redux/store";
import { router, useFocusEffect, useNavigation } from "expo-router";
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
import { useProfileSearch } from "@/hooks/useProfileSearch";
import { storeBuzinesses } from "@/redux/reducers/buzinessReducer";

export default function Index() {
  const { uid } = useSelector((state: RootState) => state.user);
  const navigation = useNavigation();
  const { users, userSearchParams } = useSelector(
    (state: RootState) => state.users,
  );
  const skip = userSearchParams?.skip || 0;
  const take = 10;
  const searchCircle = userSearchParams?.searchCircle;
  const dispatch = useDispatch();

  const { myLocation } = useMyLocation();
  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const canSearch = true; //!!searchCircle || !!myLocation;
  const [canLoadMore, setCanLoadMore] = useState(true);
  const { results, search, error } = useProfileSearch();

  console.log(error, results);

  const handleSearch = () => {
    dispatch(storeBuzinesses([]))
    router.push("/biznisz");
  };

  const load = (paramSkip: number = 0) => {
    dispatch(storeUserLoading(true));
    const mySkip = paramSkip || skip;
    console.log("load from ", mySkip, " to ", mySkip + take);


  };

  useFocusEffect(
    useCallback(() => {
      console.log("skip changed", skip);
      dispatch(storeUsers([]))
      search()
      if (uid) dispatch(viewFunction({ key: "homePage", uid }));
      navigation.setOptions({ header: () => <MyAppbar center={<BuzinessSearchInput onSearch={handleSearch} />} style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }} /> });
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
              <Text variant="bodyMedium">Fedezd fel az új fiféket a környékeden.</Text>
            </View>
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
          <ThemedText variant="labelLarge" style={{ color: theme.colors.secondary, fontWeight: "bold" }}>Új fifék Budapesten</ThemedText>
        </View>
        <UsersList load={load} canLoadMore={canLoadMore} />
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