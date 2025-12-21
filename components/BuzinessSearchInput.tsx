import { theme } from "@/assets/theme";
import { ThemedInput } from "@/components/ThemedInput";
import {
  storeBuzinessSearchParams
} from "@/redux/reducers/buzinessReducer";
import { RootState } from "@/redux/store";
import { TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

const BuzinessSearchInput = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const canSearch = true;
  const { searchParams } = useSelector(
    (state: RootState) => state.buziness,
  );
  const searchText = searchParams?.text || "";

  return (<ThemedInput
    value={searchText}
    mode="outlined"
    outlineStyle={{ borderRadius: 1000, borderWidth: 0, }}
    style={{ marginVertical: 4, textAlign: searchText ? "left" : "center", backgroundColor: theme.colors.elevation.level2, width: "100%", flex: 1, paddingLeft: 16 }}
    onChangeText={(text) => {
      if (!text.includes("$"))
        dispatch(storeBuzinessSearchParams({ text }));
    }}
    onSubmitEditing={() => onSearch(searchText)}
    enterKeyHint="search"
    placeholderTextColor={theme.colors.onSurfaceVariant}
    placeholder={t("search.placeholder")}
    right={
      <TextInput.Icon
        icon="magnify"
        onPress={() => onSearch(searchText)}
        disabled={!canSearch}
      />
    }
  />);
};

export default BuzinessSearchInput;