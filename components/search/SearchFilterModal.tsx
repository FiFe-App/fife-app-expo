import { storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { SearchMode } from "@/redux/store.type";
import { useDispatch } from "react-redux";
import BuzinessFilterModal from "./BuzinessFilterModal";
import FifeFilterModal from "./FifeFilterModal";
import RequestFilterModal from "./RequestFilterModal";

interface SearchFilterModalProps {
  mode: SearchMode;
  visible: boolean;
  onDismiss: () => void;
}

/**
 * The search screen's "Finomítás" modal. What it refines depends on what is being searched:
 * bizniszek (place, free-only, AI), fifék (place) or kérések (which slice).
 */
export const SearchFilterModal = ({ mode, visible, onDismiss }: SearchFilterModalProps) => {
  const dispatch = useDispatch();

  if (mode === "fife") return <FifeFilterModal visible={visible} onDismiss={onDismiss} />;
  if (mode === "kerelem") return <RequestFilterModal visible={visible} onDismiss={onDismiss} />;
  return (
    <BuzinessFilterModal
      visible={visible}
      onDismiss={onDismiss}
      onApply={(searchCircle, ingyen) => {
        dispatch(storeBuzinessSearchParams({ searchCircle, ingyen }));
        onDismiss();
      }}
    />
  );
};

export default SearchFilterModal;
