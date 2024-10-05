import { popDialog as slicepopDialog } from "@/lib/redux/reducers/infoReducer";
import { RootState } from "@/lib/redux/store";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { usePromiseTracker } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux";

const InfoLayer = () => {
  const { dialogs } = useSelector((state: RootState) => state.info);
  const dialog = dialogs?.[0];
  const { promiseInProgress } = usePromiseTracker({ area: "dialog" });
  const dispath = useDispatch();
  function cancelDialog() {
    if (dialog?.onCancel) {
      dialog.onCancel();
    }
    dispath(slicepopDialog());
  }

  function submitDialog() {
    if (dialog?.onSubmit) {
      dialog.onSubmit();
    }
    dispath(slicepopDialog());
  }

  if (dialog)
    return (
      <Portal>
        <Dialog visible={!!dialog} onDismiss={cancelDialog}>
          <Dialog.Title>{dialog?.title}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{dialog?.text}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelDialog}>Mégsem</Button>
            <Button
              mode="contained"
              onPress={submitDialog}
              loading={promiseInProgress}
            >
              {dialog?.submitText || "Kész"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
};

export default InfoLayer;
