import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Divider, ActivityIndicator, Button } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import BuzinessItem from "./BuzinessItem";
import { RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  loadBuzinesses,
  storeBuzinessSearchParams,
} from "@/redux/reducers/buzinessReducer";
import { useMyLocation } from "@/hooks/useMyLocation";
import { MapCircleType } from "../MapSelector/MapSelector.types";

interface BuzinessListProps {
  load: (arg0: number) => void;
  canLoadMore: boolean;
}

export const BuzinessList: React.FC<BuzinessListProps> = ({
  load,
  canLoadMore,
}) => {
  const dispatch = useDispatch();
  const { buzinesses, buzinessSearchParams } = useSelector(
    (state: RootState) => state.buziness,
  );
  const { myLocation, locationError } = useMyLocation();
  const skip = buzinessSearchParams?.skip || 0;
  const loading = buzinessSearchParams?.loading || false;
  const take = 5;
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const loadNext = () => {
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
          buzinessRecommendations: []
        },
      ]),
    );
    dispatch(storeBuzinessSearchParams({ skip: skip + take }));
    load(skip + take);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          gap: 8,
          marginVertical: 8,
        }}
      >
        {buzinesses.map((buzinessItem) =>
          buzinessItem.id === -1 ? (
            <Divider
              key={Math.random() * 100000 + 100000 + "div"}
              style={{ marginVertical: 16 }}
            />
          ) : (
            <BuzinessItem data={buzinessItem} key={buzinessItem.id} />
          ),
        )}
        {!buzinessSearchParams?.searchCircle &&
          !myLocation &&
          !buzinesses.length && (
            <ThemedText style={{ alignSelf: "center" }}>
              Válassz környéket a kereséshez
            </ThemedText>
          )}
        <View style={{padding:16}}>
          {!loading &&
            (!!buzinesses.length && canLoadMore ? (
              <Button onPress={loadNext} style={{ alignSelf: "center" }}>
                További bizniszek
              </Button>
            ) : (
              <ThemedText style={{ alignSelf: "center" }}>
                Nem található több biznisz
              </ThemedText>
            ))}
        </View>
      </ScrollView>

      {buzinessSearchParams?.loading && !buzinesses.length && (
        <View style={{ flex: 1 }}>
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
  businessItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
