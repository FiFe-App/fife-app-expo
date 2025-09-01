import { setLocationError } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import * as Location from "expo-location";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const blockedMessage = "Letiltottad a helyzeted.";

export function useMyLocation() {
  const dispatch = useDispatch();
  const [myLocation, setLocation] = useState<Location.LocationObject | null>(
    null,
  );

  const { locationError } = useSelector((state: RootState) => state.user);
  const { dialogs } = useSelector((state: RootState) => state.info);

  useEffect(() => {
    const getLocation = async () => {
      (async () => {
        const location = await Location.getCurrentPositionAsync({});
        if (location) {
          dispatch(setLocationError(null));
          setLocation(location);
        }
      })();
    };

    Location.getForegroundPermissionsAsync().then((res) => {
      const { status } = res;

      if (status !== "denied") getLocation();
      if (status === "denied") dispatch(setLocationError(blockedMessage));
    });
  }, [dialogs, dispatch]);

  return { myLocation, locationError };
}
