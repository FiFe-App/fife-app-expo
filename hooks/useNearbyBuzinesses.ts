import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { BuzinessSearchItemInterface } from "@/redux/store.type";
import { useMyLocation } from "./useMyLocation";

/** Nearest buzinesses via hybrid_buziness_search (business-search edge function)
 * without text search. Uses local state so the biznisz page's redux-backed
 * results stay untouched. */
export function useNearbyBuzinesses(take = 5) {
  const { myLocation } = useMyLocation();

  // Profile location as fallback when GPS is not available
  const profileLocation = useSelector(
    (state: RootState) => state.user.userData?.location,
  );

  const [data, setData] = useState<BuzinessSearchItemInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const searchLocation = myLocation
      ? {
        lat: myLocation.coords.latitude,
        long: myLocation.coords.longitude,
      }
      : profileLocation
        ? {
          lat: profileLocation.lat,
          long: profileLocation.lng,
        }
        : {
          lat: 47.4979,
          long: 19.0402,
        };

    try {
      const { data: buzinesses, error } = await supabase.functions.invoke(
        "business-search",
        {
          body: {
            query: "",
            take,
            skip: 0,
            ingyen: false,
            maxdistance: 100000,
            ...searchLocation,
          },
        },
      );

      if (error) {
        setError(error.message);
        setData([]);
      } else {
        setData(buzinesses || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setData([]);
    }
    setLoading(false);
  }, [myLocation, profileLocation, take]);

  return { data, loading, error, fetch };
}
