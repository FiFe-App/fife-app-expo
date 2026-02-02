import { useState } from "react";
import { IconButton } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { addSavedBuziness, removeSavedBuziness } from "@/redux/reducers/userReducer";
import { addSnack } from "@/redux/reducers/infoReducer";

interface SaveBuzinessButtonProps {
  buzinessId: number;
  style?: any;
}

export const SaveBuzinessButton = ({
  buzinessId,
  style,
}: SaveBuzinessButtonProps) => {
  const { savedBuzinesses }: UserState = useSelector(
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
      dispatch(addSnack({ title: "Biznisz elmentve" }));
    }
  };

  return (
    <IconButton
      icon={isSaved ? "archive" : "archive-outline"}
      mode="contained-tonal"
      onPress={toggleSave}
      style={style}
    />
  );
};
