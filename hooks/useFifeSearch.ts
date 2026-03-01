import { useState, useRef, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "@/lib/supabase/supabase";
import { Dimensions } from "react-native";
import { RootState } from "@/redux/store";
import { useMyLocation } from "./useMyLocation";
import { User } from "@/redux/store.type";

export function useFifeSearch() {
  const PAGE_SIZE = Math.floor(Dimensions.get("window").height / 100);
  console.log("fife search page size", PAGE_SIZE);

  const { myLocation: location } = useMyLocation();

  const { searchParams, searchCircle } = useSelector(
    (state: RootState) => ({
      searchParams: state.users.userSearchParams,
      searchCircle: state.users.userSearchParams?.searchCircle,
    }),
  );

  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const dispatch = useDispatch();

  const fetch = useCallback(async () => {
    console.log("fetching newest users");
    
    setLoading(true);
    setError(null);
    setSkip(0);
    setHasMore(true);

    const searchLocation = searchCircle
      ? {
        lat: searchCircle.location.latitude,
        long: searchCircle.location.longitude,
        distance: searchCircle.radius * 1000, // Convert km to meters
      }
      : location
        ? {
          lat: location.coords.latitude,
          long: location.coords.longitude,
          distance: 100000, // 100km in meters
        }
        : {
          lat: 47.4979, // Default Budapest coordinates
          long: 19.0402,
          distance: 100000,
        };

    try {
      // Call newest_profiles function with location parameters
      const { data: profiles, error } = await supabase.rpc("newest_profiles", {
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

      setData(profiles || []);
      setHasMore((profiles?.length || 0) === PAGE_SIZE);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setData([]);
      setLoading(false);
    }
  }, [searchCircle, location, PAGE_SIZE]);

  const fetchNextPage = useCallback(async () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    setError(null);
    const nextSkip = skip + PAGE_SIZE;

    const searchLocation = searchCircle
      ? {
        lat: searchCircle.location.latitude,
        long: searchCircle.location.longitude,
        distance: searchCircle.radius * 1000,
      }
      : location
        ? {
          lat: location.coords.latitude,
          long: location.coords.longitude,
          distance: 100000,
        }
        : {
          lat: 47.4979,
          long: 19.0402,
          distance: 100000,
        };

    try {
      const { data: profiles, error } = await supabase.rpc("newest_profiles", {
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

      setData(prevData => [...prevData, ...(profiles || [])]);
      setHasMore((profiles?.length || 0) === PAGE_SIZE);
      setSkip(nextSkip);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }, [hasMore, loading, skip, PAGE_SIZE, searchCircle, location]);

  return { 
    data, 
    loading, 
    error, 
    hasMore, 
    fetch, 
    fetchNextPage 
  };
}