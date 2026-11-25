import { storeSearchView, type SearchView } from "@/redux/reducers/searchReducer";
import { RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import MapButton from "../mapView/MapButton";
import Measure from "../tutorial/Measure";

/**
 * The list / map switch of the search screen. It sits in the top right corner of the screen's
 * header rows, the same place in both views and on every tab, and looks like the map's own
 * buttons.
 */
export const ViewSwitch = () => {
  const dispatch = useDispatch();
  const view = useSelector((state: RootState) => state.search.view);
  const next: SearchView = view === "map" ? "list" : "map";

  return (
    <Measure name="map-switch">
      <MapButton
        testID="search-view-switch"
        icon={view === "map" ? "format-list-bulleted" : "map"}
        accessibilityLabel={view === "map" ? "Lista nézet" : "Térkép nézet"}
        onPress={() => dispatch(storeSearchView(next))}
      />
    </Measure>
  );
};

export default ViewSwitch;
