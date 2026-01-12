import {
  popSnack,
  popDialog as slicepopDialog,
} from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import {
  ActivityIndicator,
  Button,
  Dialog,
  Portal,
  Snackbar,
  Text,
} from "react-native-paper";
import { usePromiseTracker } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux";
import { ThemedText } from "./ThemedText";
import { useTranslation } from "react-i18next";

const InfoLayer = () => {
  const { t } = useTranslation();
  const { dialogs, snacks, loading } = useSelector(
    (state: RootState) => state.info,
  );
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

  return (
    <>
      <Portal>
        {dialog && (
          <Dialog
            visible={!!dialog}
            onDismiss={cancelDialog}
            dismissable={dialog.dismissable}
          >
            <Dialog.Title>{dialog?.title}</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">{dialog?.text}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              {dialog?.dismissable && (
                <Button onPress={cancelDialog}>{t("common.cancel")}</Button>
              )}
              <Button
                mode="contained"
                onPress={submitDialog}
                loading={promiseInProgress}
              >
                {dialog?.submitText || t("common.done")}
              </Button>
            </Dialog.Actions>
          </Dialog>
        )}
        {snacks?.map((snack, ind) => (
          <Snackbar
            key={"snack" + ind}
            visible={true}
            onDismiss={() => {
              dispath(popSnack());
            }}
            duration={3000}
            onIconPress={() => {
              dispath(popSnack());
            }}
          >
            {snack.title}
          </Snackbar>
        ))}
        {loading && (
          <Dialog
            visible={!!loading}
            onDismiss={cancelDialog}
            dismissable={loading?.dismissable}
          >
            <Dialog.Content style={{ alignItems: "center", gap: 16 }}>
              <ActivityIndicator size="large" />
              <ThemedText>{loading?.title || t("common.pleaseWait")}</ThemedText>
            </Dialog.Content>
          </Dialog>
        )}
      </Portal>
    </>
  );
};

export default InfoLayer;
