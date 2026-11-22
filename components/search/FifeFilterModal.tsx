import MapSelector from "@/components/MapSelector/MapSelector";
import style from "@/components/styles";
import { ThemedView } from "@/components/ThemedView";
import { storeUserSearchParams } from "@/redux/reducers/usersReducer";
import { RootState } from "@/redux/store";
import { Modal, Portal } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

interface FifeFilterModalProps {
  visible: boolean;
  onDismiss: () => void;
}

/** "Hol keresel?" for fifék: the place the FiFe Radar looks around. */
export const FifeFilterModal = ({ visible, onDismiss }: FifeFilterModalProps) => {
  const dispatch = useDispatch();
  const searchCircle = useSelector(
    (state: RootState) => state.users.userSearchParams?.searchCircle,
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        style={{ alignItems: "center" }}
        contentContainerStyle={[{ width: "100%", height: "100%" }]}
      >
        <ThemedView style={style.containerStyle}>
          <MapSelector
            data={searchCircle}
            setData={(sC) => {
              if ((sC && "location" in sC && "radius" in sC) || sC == undefined) {
                dispatch(storeUserSearchParams({ searchCircle: sC }));
                onDismiss();
              }
            }}
            searchEnabled
            markerOnly
            setOpen={(open) => {
              if (!open) onDismiss();
            }}
          />
        </ThemedView>
      </Modal>
    </Portal>
  );
};

export default FifeFilterModal;
