import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { NO_LOCATION_ERROR } from "./useFifeSearch";

export function useNoLocationAlert(error?: string | null) {
  const shownRef = useRef(false);

  useEffect(() => {
    if (error !== NO_LOCATION_ERROR) {
      shownRef.current = false;
      return;
    }
    if (shownRef.current) return;
    shownRef.current = true;

    Alert.alert(
      NO_LOCATION_ERROR,
      "Add meg a környékedet a profilbeállításokban, hogy a közeledben kereshess.",
      [
        { text: "Mégsem", style: "cancel" },
        { text: "Beállítom", onPress: () => router.push("/user/edit") },
      ],
    );
  }, [error]);
}
