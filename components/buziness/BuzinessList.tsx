import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Spacing } from "@/constants/spacing";
import { Divider, ActivityIndicator, Button, useTheme } from "react-native-paper";
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
  error: string | null;
}

export const BuzinessList: React.FC<BuzinessListProps> = ({
  load,
  canLoadMore,
  error,
}) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const { buzinesses, searchParams } = useSelector(
    (state: RootState) => state.buziness,
  );
  const { myLocation } = useMyLocation();
  const skip = searchParams?.skip || 0;
  const loading = searchParams?.loading || false;
  const take = 5;
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
          buzinessRecommendations: [],
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
          gap: Spacing.sm,
          marginVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
        }}
      >
        {buzinesses.map((buzinessItem,ind) =>
          buzinessItem.id === -1 ? (
            <Divider
              key={buzinessItem.id+"-divider"}
              style={{ marginVertical: Spacing.lg }}
            />
          ) : (
            <Measure key={buzinessItem.id} name={ind==0 ? "first-biznisz" : null }>
              <View>
                <BuzinessItem data={buzinessItem} />
              </View>
            </Measure>
          ),
        )}
        {!searchParams?.searchCircle &&
          !myLocation &&
          !buzinesses.length &&
          (<ThemedText style={{ alignSelf: "center" }}>
            Válassz környéket a kereséshez
          </ThemedText>)}
        <View style={{ padding: Spacing.lg }}>
          {error ? <ThemedText style={{color: theme.colors.error, textAlign:"center"}}>{error}</ThemedText> :
          !loading &&
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

      {searchParams?.loading && !buzinesses.length && (
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
});
