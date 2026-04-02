import { ThemedInput } from "@/components/ThemedInput";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import {
  storeBuzinessSearchParams
} from "@/redux/reducers/buzinessReducer";
import { RootState } from "@/redux/store";
import { TextInput, useTheme } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

const BuzinessSearchInput = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const canSearch = true;
  const { searchParams } = useSelector(
    (state: RootState) => state.buziness,
  );
  const searchText = searchParams?.text || "";

  return (<ThemedInput
    value={searchText}
    mode="outlined"
    outlineStyle={{ borderRadius: BorderRadius.full, borderWidth: 0, }}
    style={{ backgroundColor:theme.colors.background, marginVertical: Spacing.xs, textAlign: searchText ? "left" : "center", width: "100%", flex: 1, paddingLeft: Spacing.lg }}
    onChangeText={(text) => {
      if (!text.includes("$"))
        dispatch(storeBuzinessSearchParams({ text }));
    }}
    onSubmitEditing={() => onSearch(searchText)}
    enterKeyHint="search"
    placeholderTextColor={theme.colors.onSurfaceVariant}
    placeholder="Mire van szükséged?"
    right={
      searchText ? (
        <TextInput.Icon
          icon="close"
          onPress={() => dispatch(storeBuzinessSearchParams({ text: "" }))}
        />
      ) : (
        <TextInput.Icon
          icon="magnify"
          onPress={() => onSearch(searchText)}
          disabled={!canSearch}
        />
      )
    }
  />);
};

export default BuzinessSearchInput;