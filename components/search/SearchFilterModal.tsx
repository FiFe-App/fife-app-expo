import { storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import type { RequestScope } from "@/lib/requests/types";
import { CircleType, SearchMode } from "@/redux/store.type";
import { useDispatch } from "react-redux";
import BuzinessFilterModal from "./BuzinessFilterModal";
import FifeFilterModal from "./FifeFilterModal";
import RequestFilterModal from "./RequestFilterModal";

interface SearchFilterModalProps {
  mode: SearchMode;
  /** The slice of the kérések on screen, and how the filter changes it. */
  scope: RequestScope;
  onScopeChange: (scope: RequestScope) => void;
  /** The bizniszek filter was applied: search again with it. */
  onBuzinessApplied?: (searchCircle: CircleType | undefined, ingyen: boolean) => void;
  visible: boolean;
  onDismiss: () => void;
}

/**
 * The search screen's "Szűrés" modal. What it refines depends on what is being searched:
 * bizniszek (place, free-only, AI), fifék (place) or kérések (which slice).
 */
export const SearchFilterModal = ({
  mode,
  scope,
  onScopeChange,
  onBuzinessApplied,
  visible,
  onDismiss,
}: SearchFilterModalProps) => {
  const dispatch = useDispatch();

  if (mode === "fife") return <FifeFilterModal visible={visible} onDismiss={onDismiss} />;
  if (mode === "kerelem")
    return (
      <RequestFilterModal
        visible={visible}
        onDismiss={onDismiss}
        scope={scope}
        onScopeChange={onScopeChange}
      />
    );
  return (
    <BuzinessFilterModal
      visible={visible}
      onDismiss={onDismiss}
      onApply={(searchCircle, ingyen) => {
        dispatch(storeBuzinessSearchParams({ searchCircle, ingyen }));
        onBuzinessApplied?.(searchCircle, ingyen);
        onDismiss();
      }}
    />
  );
};

export default SearchFilterModal;
