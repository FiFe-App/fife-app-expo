import { dismissLocationAlert } from "@/redux/reducers/userReducer";
import { addDialog } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { router } from "expo-router";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

let locationDialogDispatched = false;

export function useMyLocation() {
  const dispatch = useDispatch();
  const { uid, userData, locationAlertDismissed } = useSelector(
    (state: RootState) => state.user,
  );

  const myLocation = useMemo(() => {
    if (!userData?.location) return null;
    return {
      coords: {
        latitude: userData.location.lat,
        longitude: userData.location.lng,
      },
    };
  }, [userData?.location]);

  useEffect(() => {
    if (!uid) {
      locationDialogDispatched = false;
    }
  }, [uid]);

  useEffect(() => {
    if (uid && userData !== null && !myLocation && !locationAlertDismissed && !locationDialogDispatched) {
      locationDialogDispatched = true;
      dispatch(dismissLocationAlert());
      dispatch(
        addDialog({
          title: "Nincs megadva a helyzeted",
          text: "Add meg a környékedet a profilbeállításokban, hogy a közeledben kereshess.",
          submitText: "Beállítom",
          dismissable: true,
          onSubmit: () => {
            router.push("/user/edit");
          },
          onCancel: () => {
            dispatch(dismissLocationAlert());
          },
        }),
      );
    }
  }, [userData, myLocation, locationAlertDismissed, dispatch]);

  return { myLocation };
}
