import { RootState } from "@/redux/store";
import { Slot, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function ProtectedLayout() {
  const uid = useSelector((state: RootState) => state.user.uid);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!uid) {
      router.replace(`/login?redirected_from=${encodeURIComponent(pathname)}`);
    }
  }, [uid, pathname, router]);

  if (!uid) return null;

  return <Slot />;
}
