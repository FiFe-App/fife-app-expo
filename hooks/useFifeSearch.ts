import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { supabase } from "@/lib/supabase/supabase";
import { Dimensions } from "react-native";
import { RootState } from "@/redux/store";
import { useMyLocation } from "./useMyLocation";
import { NearestProfile } from "@/redux/store.type";

export function useFifeSearch() {
  const PAGE_SIZE = Math.floor(Dimensions.get("window").height / 100);
  console.log("fife search page size", PAGE_SIZE);

  const { myLocation } = useMyLocation();

  // Profile location as fallback when GPS is not available
  const profileLocation = useSelector(
    (state: RootState) => state.user.userData?.location,
  );

  const [data, setData] = useState<NearestProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);

  const getSearchLocation = useCallback(() => {
    // Priority: 1) GPS location, 2) profile location, 3) Budapest default
    if (myLocation) {
      return {
        lat: myLocation.coords.latitude,
        long: myLocation.coords.longitude,
        distance: 100000, // 100km in meters
      };
    }
    if (profileLocation) {
      return {
        lat: profileLocation.lat,
        long: profileLocation.lng,
        distance: 100000,
      };
    }
    return {
      lat: 47.4979, // Default Budapest coordinates
      long: 19.0402,
      distance: 100000,
    };
  }, [myLocation, profileLocation]);

  const fetch = useCallback(async () => {
    console.log("fetching nearest users");
    
    setLoading(true);
    setError(null);
    setSkip(0);
    setHasMore(true);

    const searchLocation = getSearchLocation();

    try {
      // Call nearest_profiles function with location parameters
      const { data: profiles, error } = await supabase.rpc("nearest_profiles", {
        lat: searchLocation.lat,
        long: searchLocation.long,
        distance: searchLocation.distance,
        skip: 0,
        take: PAGE_SIZE,
      });

      if (error) {
        setError(error.message);
        setData([]);
        setLoading(false);
        return;
      }

      setData((profiles as NearestProfile[]) || []);
      setHasMore((profiles?.length || 0) === PAGE_SIZE);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setData([]);
      setLoading(false);
    }
  }, [getSearchLocation, PAGE_SIZE]);

  const fetchNextPage = useCallback(async () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    setError(null);
    const nextSkip = skip + PAGE_SIZE;

    const searchLocation = getSearchLocation();

    try {
      const { data: profiles, error } = await supabase.rpc("nearest_profiles", {
        lat: searchLocation.lat,
        long: searchLocation.long,
        distance: searchLocation.distance,
        skip: nextSkip,
        take: PAGE_SIZE,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setData(prevData => [...prevData, ...((profiles as NearestProfile[]) || [])]);
      setHasMore((profiles?.length || 0) === PAGE_SIZE);
      setSkip(nextSkip);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }, [hasMore, loading, skip, PAGE_SIZE, getSearchLocation]);

  return { 
    data, 
    loading, 
    error, 
    hasMore, 
    fetch, 
    fetchNextPage 
  };
}