import { useEffect, useState } from "react";
import {
  hideLoading,
  popSnack,
  popDialog as slicepopDialog,
} from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import {
  ActivityIndicator,
  Dialog,
  Portal,
  Snackbar,
  Text,
} from "react-native-paper";
import { usePromiseTracker } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux";
import { ThemedText } from "./ThemedText";
import { Spacing } from "@/constants/spacing";
import { PatreonModal } from "./PatreonModal";
import { Button } from "./Button";
import { View } from "react-native";

const InfoLayer = () => {
  const { dialogs, snacks, loading } = useSelector(
    (state: RootState) => state.info,
  );
  const [showPatreon, setShowPatreon] = useState(false);
  const dialog = dialogs?.[0];
  const { promiseInProgress } = usePromiseTracker({ area: "dialog" });
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (Math.random() < 1 / 30) {
        setShowPatreon(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  function cancelDialog() {
    if (dialog?.onCancel) {
      dialog.onCancel();
    }
    dispatch(slicepopDialog());
  }

  function submitDialog() {
    if (dialog?.onSubmit) {
      dialog.onSubmit();
    }
    dispatch(slicepopDialog());
  }
  function dismissLoading() {
    dispatch(hideLoading());
  }

  return (
    <>
      <Portal>
        {dialog && (
          <Dialog
            visible={!!dialog}
            onDismiss={cancelDialog}
            dismissable={dialog.dismissable}
            style={{maxWidth:400}}
          >
            <Dialog.Title>{dialog?.title}</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">{dialog?.text}</Text>
            </Dialog.Content>
            <View style={{flexDirection:"row",alignItems:"center",justifyContent:"flex-end",padding:Spacing.lg}}>
              {dialog?.dismissable && (
                <Button onPress={cancelDialog}>Mégsem</Button>
              )}
              <Button
                mode="contained"
                onPress={submitDialog}
                loading={promiseInProgress}
                            labelStyle={{ fontFamily: "RedHatText-Bold" }}
              >
                {dialog?.submitText || "Kész"}
              </Button>
            </View>
          </Dialog>
        )}
        {snacks?.map((snack, ind) => (
          <Snackbar
            key={"snack" + ind}
            visible={true}
            onDismiss={() => {
              dispatch(popSnack());
            }}
            action={snack.buttonText ? {
              label: snack.buttonText,
              onPress: snack.onPress,
            } : undefined}
            duration={3000}
            onIconPress={() => {
              dispatch(popSnack());
            }}
          >
            {snack.title}
          </Snackbar>
        ))}
        {loading && (
          <Dialog
            visible={!!loading}
            onDismiss={dismissLoading}
            dismissable={true}
          >
            <Dialog.Content style={{ alignItems: "center", gap: Spacing.lg }}>
              <ActivityIndicator size="large" />
              <ThemedText style={{textAlign:"center"}}>{loading?.title || "Kérlek várj..."}</ThemedText>
            </Dialog.Content>
          </Dialog>
        )}
      </Portal>
      <PatreonModal visible={showPatreon} onDismiss={()=>{
        setShowPatreon(false);
      }} />
    </>
  );
};

export default InfoLayer;
