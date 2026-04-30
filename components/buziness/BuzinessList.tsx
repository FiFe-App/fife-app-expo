import React, { useRef } from "react";
import { View, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { Divider, ActivityIndicator } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import BuzinessItem from "./BuzinessItem";
import { RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  loadBuzinesses,
  storeBuzinessSearchParams,
} from "@/redux/reducers/buzinessReducer";
import { useMyLocation } from "@/hooks/useMyLocation";
import Measure from "../tutorial/Measure";

interface BuzinessListProps {
  load: (arg0: number) => void;
  canLoadMore: boolean;
}

export const BuzinessList: React.FC<BuzinessListProps> = ({
  load,
  canLoadMore,
}) => {
  const dispatch = useDispatch();
  const { buzinesses, searchParams } = useSelector(
    (state: RootState) => state.buziness,
  );
  const { myLocation } = useMyLocation();
  const skip = searchParams?.skip || 0;
  const loading = searchParams?.loading || false;
  const take = 5;
  const isFetching = useRef(false);

  const loadNext = () => {
    if (isFetching.current || !canLoadMore || loading) return;
    isFetching.current = true;
    dispatch(
      loadBuzinesses([
        {
          id: -1,
          title: "",
          description: "",
          author: "",
          recommendations: 0,
          radius: 0,
          location: "",
          buzinessRecommendations: [],
        },
      ]),
    );
    dispatch(storeBuzinessSearchParams({ skip: skip + take }));
    load(skip + take);
    setTimeout(() => { isFetching.current = false; }, 500);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 150;
    if (nearBottom) loadNext();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 8, marginVertical: 8 }}
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >
        {buzinesses.map((buzinessItem, ind) =>
          buzinessItem.id === -1 ? (
            <Divider
              key={Math.random() * 100000 + 100000 + "div"}
              style={{ marginVertical: 16 }}
            />
          ) : (
            <Measure key={buzinessItem.id} name={ind == 0 ? "first-biznisz" : null}>
              <View>
                <BuzinessItem data={buzinessItem} />
              </View>
            </Measure>
          ),
        )}
        {!searchParams?.searchCircle &&
          !myLocation &&
          !buzinesses.length && (
            <ThemedText style={{ alignSelf: "center" }}>
              Válassz környéket a kereséshez
            </ThemedText>
          )}
        <View style={{ paddingVertical: 16, alignItems: "center" }}>
          {loading ? (
            <ActivityIndicator />
          ) : (
            !canLoadMore && !!buzinesses.length && (
              <ThemedText style={{ alignSelf: "center" }}>
                Nem található több biznisz
              </ThemedText>
            )
          )}
        </View>
      </ScrollView>

      {loading && !buzinesses.length && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

