import { useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadBuzinesses, removeTrailingDivider, storeBuzinesses, storeBuzinessLoading, storeBuzinessSearchParams, storeBuzinessHasMore } from "@/redux/reducers/buzinessReducer";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { CircleType } from "@/redux/store.type";
import { useMyLocation } from "./useMyLocation";

export function useBuzinessSearch() {
  const PAGE_SIZE = 10;

  const { myLocation } = useMyLocation();

  const searchParams = useSelector((state: RootState) => state.buziness.searchParams);
  const searchCircle = searchParams?.searchCircle;
  const loading = searchParams?.loading ?? false;

  // Refs so that stale useCallback closures (e.g. search passed to the nav header
  // via useFocusEffect with empty deps) always read the latest values.
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const searchCircleRef = useRef(searchCircle);
  searchCircleRef.current = searchCircle;
  const myLocationRef = useRef(myLocation);
  myLocationRef.current = myLocation;

  const [error, setError] = useState<string | null>(null);
  const hasMore = useSelector((state: RootState) => state.buziness.hasMore ?? true);
  const dispatch = useDispatch();

  const search = useCallback(async (query?: string, overrides?: { ingyen?: boolean; searchCircle?: CircleType }) => {
    console.log("searching for", query);
    const params = searchParamsRef.current;

    dispatch(storeBuzinesses([]));
    dispatch(storeBuzinessLoading(true));
    setError(null);
    dispatch(storeBuzinessSearchParams({ skip: 0 }));
    dispatch(storeBuzinessHasMore(true));

    const effectiveSearchCircle = overrides?.searchCircle ?? searchCircleRef.current;
    const loc = myLocationRef.current;
    const searchLocation = effectiveSearchCircle
      ? {
        lat: effectiveSearchCircle.location.latitude,
        long: effectiveSearchCircle.location.longitude,
        maxdistance: effectiveSearchCircle.radius,
      }
      : loc
        ? {
          lat: loc.coords.latitude,
          long: loc.coords.longitude,
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
          take: params?.searchType === "map" ? -1 : PAGE_SIZE,
          skip: 0,
          ingyen: overrides?.ingyen ?? params?.ingyen ?? false,
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
      dispatch(storeBuzinessHasMore(params?.searchType !== "map" && (data?.length || 0) === PAGE_SIZE));
      dispatch(storeBuzinessLoading(false));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      dispatch(storeBuzinesses([]));
      dispatch(storeBuzinessLoading(false));
    }
  }, [dispatch]);

  const loadNext = useCallback(async () => {
    const params = searchParamsRef.current;
    const circle = searchCircleRef.current;
    const loc = myLocationRef.current;
    if (!hasMore || loading || params?.searchType === "map") return;
    
    dispatch(storeBuzinessLoading(true));
    setError(null);
    const currentSkip = params?.skip || 0;
    const nextSkip = currentSkip + PAGE_SIZE;

    const searchLocation = circle
      ? {
        lat: circle.location.latitude,
        long: circle.location.longitude,
        maxdistance: circle.radius,
      }
      : loc
        ? {
          lat: loc.coords.latitude,
          long: loc.coords.longitude,
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
          query: params?.text ?? "",
          take: PAGE_SIZE,
          skip: nextSkip,
          ingyen: params?.ingyen || false,
          ...searchLocation,
        },
      });

      if (error) {
        setError(error.message);
        dispatch(removeTrailingDivider());
        dispatch(storeBuzinessLoading(false));
        return;
      }

      if (!data || data.length === 0) {
        dispatch(removeTrailingDivider());
      } else {
        dispatch(loadBuzinesses(data));
      }
      dispatch(storeBuzinessHasMore((data?.length || 0) === PAGE_SIZE));
      dispatch(storeBuzinessSearchParams({ skip: nextSkip }));
      dispatch(storeBuzinessLoading(false));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      dispatch(storeBuzinessLoading(false));
    }
  }, [hasMore, loading, dispatch]);

  return { error, canLoadMore: hasMore, search, loadNext };
}
