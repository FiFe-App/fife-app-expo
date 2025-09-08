import { theme } from "@/assets/theme";
import { ThemedInput } from "@/components/ThemedInput";
import {
  storeBuzinessSearchParams
} from "@/redux/reducers/buzinessReducer";
import { RootState } from "@/redux/store";
import { TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

const BuzinessSearchInput = ({ onSearch }: { onSearch: () => void }) => {
  const dispatch = useDispatch();

  const canSearch = true;
  const { buzinessSearchParams } = useSelector(
    (state: RootState) => state.buziness,
  );
  const searchText = buzinessSearchParams?.text || "";

  return (<ThemedInput
    value={searchText}
    mode="outlined"
    outlineStyle={{ borderRadius: 1000, borderWidth: 0, }}
    style={{ marginVertical: 4, backgroundColor: theme.colors.elevation.level2, width: "100%", flex: 1, paddingLeft: 16 }}
    onChangeText={(text) => {
      console.log("text", text);

      if (!text.includes("$"))
        dispatch(storeBuzinessSearchParams({ text }));
    }}
    onSubmitEditing={onSearch}
    enterKeyHint="search"
    placeholderTextColor={theme.colors.onSurfaceVariant}
    placeholder="Keress a bizniszek közt..."
    right={
      <TextInput.Icon
        icon="magnify"
        onPress={onSearch}
        disabled={!canSearch}
      />
    }
  />)
};

export default BuzinessSearchInput;