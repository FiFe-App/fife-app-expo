import { IconButton } from "react-native-paper";
import { StyleProp, ViewStyle } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { addSavedBuziness, removeSavedBuziness } from "@/redux/reducers/userReducer";
import { addSnack } from "@/redux/reducers/infoReducer";
import { router } from "expo-router";

interface SaveBuzinessButtonProps {
  buzinessId: number;
  style?: StyleProp<ViewStyle>;
}

export const SaveBuzinessButton = ({
  buzinessId,
  style,
}: SaveBuzinessButtonProps) => {
  const { savedBuzinesses, uid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const dispatch = useDispatch();
  const isSaved = savedBuzinesses.includes(buzinessId);

  const toggleSave = () => {
    if (isSaved) {
      dispatch(removeSavedBuziness(buzinessId));
      dispatch(addSnack({ title: "Mentés visszavonva" }));
    } else {
      dispatch(addSavedBuziness(buzinessId));
      dispatch(addSnack({
        title: "Biznisz elmentve",
        buttonText: "Megnézem",
        onPress: () => {
          router.push("/user/" + uid + "/saved-buzinesses");
        }
      }));
    }
  };

  return (
    <IconButton
      icon={isSaved ? "bookmark-check" : "bookmark-outline"}
      mode="contained-tonal"
      onPress={toggleSave}
      size={26}
      style={style}
    />
  );
};
