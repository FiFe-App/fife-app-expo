import { BuzinessList } from "@/components/buziness/BuzinessList";
import { BuzinessMap } from "@/components/buziness/BuzinessMap";
import { RootState } from "@/redux/store";
import { View } from "react-native";
import { useSelector } from "react-redux";
import NewRequestButton from "./NewRequestButton";
import ViewSwitch from "./ViewSwitch";

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
 * the list (not under it). What is listed is whatever useBuzinessSearch last searched for.
 */
export const BuzinessResults = ({ canLoadMore, loadNext, error, reload, typed }: BuzinessResultsProps) => {
  const view = useSelector((state: RootState) => state.search.view);

  return (
    <View style={{ flex: 1 }}>
      {view === "map" ? (
        <BuzinessMap load={reload} viewSwitch={<ViewSwitch inMap />} />
      ) : (
        <BuzinessList
          load={loadNext}
          canLoadMore={canLoadMore}
          error={error}
          header={<NewRequestButton text={typed} testID="search-new-request-top" />}
        />
      )}
    </View>
  );
};

export default BuzinessResults;
