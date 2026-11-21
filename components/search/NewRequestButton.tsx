import { Spacing } from "@/constants/spacing";
import { openRequestComposer } from "@/redux/reducers/requestsReducer";
import { View } from "react-native";
import { useDispatch } from "react-redux";
import { Button } from "../Button";

/**
 * "Új kérés" at the top and the bottom of the lists of the search screen. With something typed
 * in the search box it carries that text into the modal: nobody found what they looked for? Ask.
 */
export const NewRequestButton = ({
  text,
  testID = "search-new-request",
}: {
  /** What is in the search box right now. */
  text?: string;
  testID?: string;
}) => {
  const dispatch = useDispatch();
  const typed = text?.trim() ?? "";

  return (
    <View style={{ paddingVertical: Spacing.xs }}>
      <Button
        testID={testID}
        mode="contained-tonal"
        icon="hand-heart-outline"
        onPress={() => dispatch(openRequestComposer(typed || undefined))}
      >
        {typed ? `Új kérés ezzel a szöveggel: „${typed}”` : "Új kérés"}
      </Button>
    </View>
  );
};

export default NewRequestButton;
