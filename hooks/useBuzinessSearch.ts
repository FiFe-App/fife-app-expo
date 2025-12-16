import { useState, useRef, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadBuzinesses, storeBuzinesses, storeBuzinessLoading, storeBuzinessSearchParams, storeBuzinessHasMore } from "@/redux/reducers/buzinessReducer";
import { supabase } from "@/lib/supabase/supabase";
import { Dimensions } from "react-native";
import { RootState } from "@/redux/store";
import { useMyLocation } from "./useMyLocation";

export function useBuzinessSearch() {
  const PAGE_SIZE = Math.floor(Dimensions.get("window").height / 100);
  console.log("page size", PAGE_SIZE);

  const { myLocation: location } = useMyLocation();

  const { searchParams, myLocation, searchCircle, buzinesses, loading } = useSelector(
    (state: RootState) => ({
      searchParams: state.buziness.searchParams,
      myLocation: location,
      searchCircle: state.buziness.searchParams?.searchCircle,
      buzinesses: state.buziness.buzinesses,
      loading: state.buziness.searchParams?.loading || false,
    }),
  );

  const [error, setError] = useState<string | null>(null);
  const hasMore = useSelector((state: RootState) => state.buziness.hasMore ?? true);
  const lastQuery = useRef<string | undefined>("");
  const dispatch = useDispatch();

  // Store buziness in Redux whenever results change
  useEffect(() => {
    dispatch(storeBuzinesses(buzinesses));
  }, [buzinesses, dispatch]);

  useEffect(() => {
    dispatch(storeBuzinessSearchParams({ loading }));
  }, [dispatch, loading]);

  const search = useCallback(async (query?: string) => {
    console.log("searching for", query);

    dispatch(storeBuzinesses([]));
    dispatch(storeBuzinessLoading(true));
    setError(null);
    dispatch(storeBuzinessSearchParams({ skip: 0 }));
    lastQuery.current = query;
    dispatch(storeBuzinessHasMore(true));

    const searchLocation = searchCircle
      ? {
        lat: searchCircle.location.latitude,
        long: searchCircle.location.longitude,
        maxdistance: searchCircle.radius,
      }
      : myLocation
        ? {
          lat: myLocation.coords.latitude,
          long: myLocation.coords.longitude,
          maxdistance: 100000,
        }
        : {
          lat: 47.4979,
          long: 19.0402,
          maxdistance: 100000,
        };

    try {
      const { data, error } = await supabase.functions.invoke("business-search", {
        body: {
          query: query || "",
          take: searchParams?.searchType === "map" ? -1 : PAGE_SIZE,
          skip: 0,
          ...searchLocation,
        },
      });

      if (error) {
        setError(error.message);
        dispatch(storeBuzinesses([]));
        dispatch(storeBuzinessLoading(false));
        return;
      }

      dispatch(storeBuzinesses(data || []));
      dispatch(storeBuzinessHasMore(searchParams?.searchType !== "map" && (data?.length || 0) === PAGE_SIZE));
      dispatch(storeBuzinessLoading(false));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      dispatch(storeBuzinesses([]));
      dispatch(storeBuzinessLoading(false));
    }
  }, [dispatch, searchCircle, myLocation, searchParams, PAGE_SIZE]);

  const loadNext = useCallback(async () => {
    if (!hasMore || loading || searchParams?.searchType === "map") return;
    
    dispatch(storeBuzinessLoading(true));
    setError(null);
    const currentSkip = searchParams?.skip || 0;
    const nextSkip = currentSkip + PAGE_SIZE;

    const searchLocation = searchCircle
      ? {
        lat: searchCircle.location.latitude,
        long: searchCircle.location.longitude,
        maxdistance: searchCircle.radius,
      }
      : myLocation
        ? {
          lat: myLocation.coords.latitude,
          long: myLocation.coords.longitude,
          maxdistance: 100000,
        }
        : {
          lat: 47.4979,
          long: 19.0402,
          maxdistance: 100000,
        };

    try {
      const { data, error } = await supabase.functions.invoke("business-search", {
        body: {
          query: lastQuery.current || "",
          take: PAGE_SIZE,
          skip: nextSkip,
          ...searchLocation,
        },
      });

      if (error) {
        setError(error.message);
        dispatch(storeBuzinessLoading(false));
        return;
      }

      dispatch(loadBuzinesses((data || [])));
      dispatch(storeBuzinessHasMore((data?.length || 0) === PAGE_SIZE));
      dispatch(storeBuzinessSearchParams({ skip: nextSkip }));
      dispatch(storeBuzinessLoading(false));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      dispatch(storeBuzinessLoading(false));
    }
  }, [hasMore, loading, searchParams?.searchType, searchParams?.skip, dispatch, PAGE_SIZE, searchCircle, myLocation]);

  return { error, canLoadMore: hasMore, search, loadNext };
}
