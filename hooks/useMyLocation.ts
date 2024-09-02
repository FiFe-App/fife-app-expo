import * as Location from "expo-location";

import { useEffect, useState } from "react";

export function useMyLocation() {
  const [myLocation, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [error, setError] = useState<string | null>();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Nem tudjuk hol vagy");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  return { myLocation, error };
}
