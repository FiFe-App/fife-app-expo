import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { Redirect } from "expo-router";
import { useSelector } from "react-redux";

export default function Page() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);

  if (uid) {
    return <Redirect href={"/user/" + uid} />;
  }

  return <Redirect href={"/" + uid} />;
}
