import { ThemedInput } from "@/components/ThemedInput";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import {
  storeBuzinessSearchParams
} from "@/redux/reducers/buzinessReducer";
import { RootState } from "@/redux/store";
import { TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { useAppTheme } from "@/assets/theme";
import { ThemedView } from "./ThemedView";
import Smiley from "./Smiley";
import { StyleProp, TextStyle } from "react-native";

const BuzinessSearchInput = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const dispatch = useDispatch();
  const theme = useAppTheme();

  const canSearch = true;
  const { searchParams } = useSelector(
    (state: RootState) => state.buziness,
  );
  const searchText = searchParams?.text || "";

  const greetings = ["Üdv a FiFe Appban!","Mire van szükséged?","Keress bizniszekre..."];
  const greeting = greetings.at(Math.random() * greetings.length);


  const inputStyle: StyleProp<TextStyle> = {
    backgroundColor:theme.colors.background, 
    height:40, 
    marginVertical: Spacing.xs, 
    textAlign: searchText ? "left" : "center", 
    width: "100%", 
    flex: 1, 
  };

  return (<ThemedView style={{flex:1,flexDirection:"row",gap: Spacing.md, alignItems:"center"}} type="card">
    <Smiley style={{width:35,height:35,zIndex:100000}} />
    <ThemedInput
      value={searchText}
      mode="outlined"
      outlineStyle={{ borderRadius: BorderRadius.full, borderWidth: 0, }}
      style={inputStyle}
      onChangeText={(text) => {
        if (!text.includes("$"))
          dispatch(storeBuzinessSearchParams({ text }));
      }}
      onSubmitEditing={() => onSearch(searchText)}
      enterKeyHint="search"
      placeholderTextColor={theme.colors.onSurfaceVariant}
      placeholder={greeting}
      right={
          <TextInput.Icon
            icon="magnify"
            onPress={() => onSearch(searchText)}
            disabled={!canSearch}
          />
      }
    />
  </ThemedView>);
};

export default BuzinessSearchInput;