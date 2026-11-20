import { BuzinessList } from "@/components/buziness/BuzinessList";
import { BuzinessMap } from "@/components/buziness/BuzinessMap";
import Measure from "@/components/tutorial/Measure";
import { Spacing } from "@/constants/spacing";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";
import { storeBuzinessSearchType } from "@/redux/reducers/buzinessReducer";
import { RootState } from "@/redux/store";
import { View } from "react-native";
import { FAB } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import NewRequestButton from "./NewRequestButton";

interface BuzinessResultsProps {
  /** From useBuzinessSearch(), which the search screen runs. */
  canLoadMore: boolean;
  loadNext: () => void;
  error: string | null;
  /** Re-runs the search on screen (the map view reloads with every pin). */
  reload: () => void;
  /** What is in the search box right now, carried into the "Új kérés" buttons. */
  typed: string;
}

/**
 * The bizniszek of the search screen: the list (or the map), with the "Új kérés" button above
 * and under it. What is listed is whatever useBuzinessSearch last searched for.
 */
export const BuzinessResults = ({ canLoadMore, loadNext, error, reload, typed }: BuzinessResultsProps) => {
  const dispatch = useDispatch();
  const searchType = useSelector((state: RootState) => state.buziness.searchParams?.searchType);

  return (
    <View style={{ flex: 1 }}>
      {searchType === "list" || !searchType ? (
        <BuzinessList
          load={loadNext}
          canLoadMore={canLoadMore}
          error={error}
          header={
            <View style={{ paddingHorizontal: 0 }}>
              <NewRequestButton text={typed} testID="search-new-request-top" />
            </View>
          }
          footer={<NewRequestButton text={typed} testID="search-new-request-bottom" />}
        />
      ) : (
        <BuzinessMap load={reload} />
      )}
      <Measure name="map-switch">
        <FAB
          icon={searchType === "map" ? "format-list-bulleted" : "map"}
          style={{ position: "absolute", bottom: Spacing.lg + MODE_SWITCH_CLEARANCE, right: Spacing.lg }}
          variant="tertiary"
          customSize={80}
          onPress={() => {
            dispatch(storeBuzinessSearchType(searchType === "map" ? "list" : "map"));
          }}
        />
      </Measure>
    </View>
  );
};

export default BuzinessResults;
