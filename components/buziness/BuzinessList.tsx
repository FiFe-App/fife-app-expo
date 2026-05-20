import React, { useCallback, useMemo } from "react";
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
import { ThemedView } from "../ThemedView";

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

  const buzinesses = useSelector((state: RootState) => state.buziness.buzinesses);
  const loading = useSelector((state: RootState) => state.buziness.searchParams?.loading ?? false);
  const searchCircle = useSelector((state: RootState) => state.buziness.searchParams?.searchCircle);
  const { myLocation } = useMyLocation();
  const loadNext = useCallback(() => {
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
  }, [dispatch, load]);

  const renderItem = useCallback(
    ({ item: buzinessItem, index: ind }: { item: (typeof buzinesses)[0]; index: number }) =>
      buzinessItem.id === -1 ? (
        <Divider style={{ marginVertical: Spacing.lg }} />
      ) : (
        <Measure name={ind === 0 ? "first-biznisz" : null}>
          <View>
            <BuzinessItem data={buzinessItem} />
          </View>
        </Measure>
      ),
    [],
  );

  const onEndReached = useCallback(() => {
    if (canLoadMore && !loading) loadNext();
  }, [canLoadMore, loading, loadNext]);

  const listFooter = useMemo(
    () => (
      <View style={styles.footer}>
        {error ? (
          <ThemedView type="error">
            <ThemedText type="error" style={{ textAlign: "center" }}>
              {error}
            </ThemedText>
          </ThemedView>
        ) : loading ? (
          <ActivityIndicator />
        ) : !buzinesses.length ? (
          <ThemedText style={{ alignSelf: "center" }}>
            Nem található több biznisz
          </ThemedText>
        ) : null}
      </View>
    ),
    [error, loading, buzinesses.length],
  );

  const listEmpty = useMemo(
    () =>
      !loading && !searchCircle && !myLocation ? (
        <ThemedText style={{ alignSelf: "center" }}>
          Válassz környéket a kereséshez
        </ThemedText>
      ) : null,
    [loading, searchCircle, myLocation],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={buzinesses}
        keyExtractor={(item, index) =>
          item.id === -1 ? `${item.id}-divider-${index}` : String(item.id)
        }
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  footer: {
    padding: Spacing.lg,
  },
});
