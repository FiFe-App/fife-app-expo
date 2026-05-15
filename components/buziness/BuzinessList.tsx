import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Spacing } from "@/constants/spacing";
import { Divider, ActivityIndicator } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import BuzinessItem from "./BuzinessItem";
import { RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  loadBuzinesses,
} from "@/redux/reducers/buzinessReducer";
import { useMyLocation } from "@/hooks/useMyLocation";
import Measure from "../tutorial/Measure";
import { useAppTheme } from "@/assets/theme";

interface BuzinessListProps {
  load: () => void;
  canLoadMore: boolean;
  error: string | null;
}

export const BuzinessList: React.FC<BuzinessListProps> = ({
  load,
  canLoadMore,
  error,
}) => {
  const dispatch = useDispatch();
  const theme = useAppTheme();

  const { buzinesses, searchParams } = useSelector(
    (state: RootState) => state.buziness,
  );
  const { myLocation } = useMyLocation();
  const loading = searchParams?.loading || false;
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
    load();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={buzinesses}
        keyExtractor={(item, index) =>
          item.id === -1 ? `${item.id}-divider-${index}` : String(item.id)
        }
        contentContainerStyle={{
          gap: Spacing.sm,
          marginVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
        }}
        renderItem={({ item: buzinessItem, index: ind }) =>
          buzinessItem.id === -1 ? (
            <Divider style={{ marginVertical: Spacing.lg }} />
          ) : (
            <Measure name={ind === 0 ? "first-biznisz" : null}>
              <View>
                <BuzinessItem data={buzinessItem} />
              </View>
            </Measure>
          )
        }
        onEndReached={() => {
          if (canLoadMore && !loading) loadNext();
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading && !searchParams?.searchCircle && !myLocation ? (
            <ThemedText style={{ alignSelf: "center" }}>
              Válassz környéket a kereséshez
            </ThemedText>
          ) : null
        }
        ListFooterComponent={
          <View style={{ padding: Spacing.lg }}>
            {error ? (
              <ThemedText style={{ color: theme.colors.error, textAlign: "center" }}>
                {error}
              </ThemedText>
            ) : loading ? (
              <ActivityIndicator />
            ) : !buzinesses.length ? (
              <ThemedText style={{ alignSelf: "center" }}>
                Nem található több biznisz
              </ThemedText>
            ) : null}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
