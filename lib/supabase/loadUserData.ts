import { supabase } from "@/lib/supabase/supabase";
import {
  login as sliceLogin,
  setName,
  setUserData,
} from "@/redux/reducers/userReducer";
import { loadViewedFunctions } from "@/redux/reducers/tutorialReducer";
import { User } from "@supabase/auth-js";
import { Dispatch } from "@reduxjs/toolkit";

export async function loadUserData(user: User, dispatch: Dispatch) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, avatar_url, website, created_at, updated_at, viewed_functions"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("loadUserData: failed to fetch profile", profileError);
    return;
  }

  if (profile) {
    dispatch(sliceLogin(profile.id));
    dispatch(setName(profile.full_name));

    const { data: loc } = await supabase.rpc("get_my_profile_location");
    const myLoc = loc?.[0];
    const locationData = myLoc?.location_wkt
      ? (() => {
          const match = myLoc.location_wkt.match(
            /POINT\(([\d.-]+) ([\d.-]+)\)/
          );
          return match
            ? {
                location: {
                  lng: parseFloat(match[1]),
                  lat: parseFloat(match[2]),
                },
                radius: myLoc.location_radius_m ?? 0,
              }
            : undefined;
        })()
      : undefined;

    dispatch(
      setUserData({
        ...user,
        ...profile,
        ...(locationData ? { location: locationData } : {}),
      })
    );

    if (profile.viewed_functions) {
      dispatch(loadViewedFunctions(profile.viewed_functions));
    }
  }
}
