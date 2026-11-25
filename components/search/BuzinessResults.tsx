import { BuzinessList } from "@/components/buziness/BuzinessList";
import NewRequestButton from "./NewRequestButton";

interface BuzinessResultsProps {
  /** From useBuzinessSearch(), which the search screen runs. */
  canLoadMore: boolean;
  loadNext: () => void;
  error: string | null;
  /** What is in the search box right now, carried into the "Új kérés" buttons. */
  typed: string;
}

/**
 * The list of the bizniszek of the search screen, with the "Új kérés" button above and under it.
 * What is listed is whatever useBuzinessSearch last searched for. (The map view has no list:
 * the search screen shows the bizniszek as pins of its one map.)
 */
export const BuzinessResults = ({ canLoadMore, loadNext, error, typed }: BuzinessResultsProps) => (
  <BuzinessList
    load={loadNext}
    canLoadMore={canLoadMore}
    error={error}
    header={<NewRequestButton text={typed} testID="search-new-request-top" />}
    footer={<NewRequestButton text={typed} testID="search-new-request-bottom" />}
  />
);

export default BuzinessResults;
