import { ThemedView } from "@/components/ThemedView";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { Redirect } from "expo-router";
import { useSelector } from "react-redux";

export default function Page() {
  const { uid, name }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  console.log("UID", uid);

  return (
    <ThemedView style={{ flex: 1 }}>
      {!uid && <Redirect href={{ pathname: "/", params: { uid } }} />}
      {!name && <Redirect href={{ pathname: "/user/edit" }} />}
      {uid && !!name && (
        <Redirect href={{ pathname: "/user/[uid]", params: { uid } }} />
      )}
    </ThemedView>
  );
}
