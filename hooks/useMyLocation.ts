import { RootState } from "@/redux/store";

import { useMemo } from "react";
import { useSelector } from "react-redux";

export function useMyLocation() {
  const { userData } = useSelector((state: RootState) => state.user);

  const myLocation = useMemo(() => {
    if (!userData?.location) return null;
    const lat = userData.location.lat;
    const lng = userData.location.lng;
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) return null;
    return {
      coords: {
        latitude: lat,
        longitude: lng,
      },
    };
  }, [userData?.location]);

  return { myLocation };
}
