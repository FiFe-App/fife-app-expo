import { Spacing } from "@/constants/spacing";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";
import { storeSearchView, type SearchView } from "@/redux/reducers/searchReducer";
import { RootState } from "@/redux/store";
import { FAB } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import Measure from "../tutorial/Measure";

/**
 * The list / map switch of the search screen, one for every tab. On the list it floats over the
 * bottom right corner; on the map it is part of the map's own column of buttons (`inMap`), so
 * nothing lands on anything else.
 */
export const ViewSwitch = ({ inMap = false }: { inMap?: boolean }) => {
  const dispatch = useDispatch();
  const view = useSelector((state: RootState) => state.search.view);
  const next: SearchView = view === "map" ? "list" : "map";

  return (
    <Measure name="map-switch">
      <FAB
        testID="search-view-switch"
        icon={view === "map" ? "format-list-bulleted" : "map"}
        accessibilityLabel={view === "map" ? "Lista nézet" : "Térkép nézet"}
        size={inMap ? "small" : "medium"}
        variant="tertiary"
        style={
          inMap
            ? undefined
            : { position: "absolute", bottom: Spacing.lg + MODE_SWITCH_CLEARANCE, right: Spacing.lg }
        }
        onPress={() => dispatch(storeSearchView(next))}
      />
    </Measure>
  );
};

export default ViewSwitch;
