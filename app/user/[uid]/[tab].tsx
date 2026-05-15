import { Redirect, useGlobalSearchParams } from "expo-router";

export default function TabRedirect() {
  const { uid, tab } = useGlobalSearchParams();

  if (tab === "connections") {
    return <Redirect href={{ pathname: "/user/[uid]/connections", params: { uid: String(uid) } }} />;
  }

  return <Redirect href={{ pathname: "/user/[uid]", params: { uid: String(uid) } }} />;
}
