import { ThemedView } from "@/components/ThemedView";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { Redirect } from "expo-router";
import { useSelector } from "react-redux";

export default function Page() {
  const { uid, name }: UserState = useSelector(
    (state: RootState) => state.user,
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      {!name && <Redirect href={{ pathname: "/user/edit" }} />}
      {uid && !!name && (
        <Redirect href={{ pathname: "/user/[uid]", params: { uid } }} />
      )}
    </ThemedView>
  );
}
