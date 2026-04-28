import BuzinessSearchInput from "@/components/BuzinessSearchInput";
import { MyAppbar } from "@/components/MyAppBar";
import { storeBuzinesses } from "@/redux/reducers/buzinessReducer";
import { RootState } from "@/redux/store";
import { Slot, Stack, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function ProtectedLayout() {
  const uid = useSelector((state: RootState) => state.user.uid);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const handleSearch = useCallback(() => {
    dispatch(storeBuzinesses([]));
    router.push("/biznisz");
  }, [dispatch]);

  useEffect(() => {
    if (!uid) {
      router.replace(`/login?redirected_from=${encodeURIComponent(pathname)}`);
    }
  }, [uid, pathname, router]);

  if (!uid) return null;

  return <>
    <Slot />
  </>;
}
