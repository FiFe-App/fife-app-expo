import { SavedProfiles } from "@/components/buziness/SavedProfiles";
import { ThemedView } from "@/components/ThemedView";
import { RootState } from "@/redux/store";
import { useGlobalSearchParams } from "expo-router";
import { useSelector } from "react-redux";

export default function ConnectionsPage() {
  const { uid: paramUid } = useGlobalSearchParams();
  const uid = String(paramUid);
  const { uid: myUid } = useSelector((state: RootState) => state.user);

  return (
    <ThemedView style={{ flex: 1 }}>
      <SavedProfiles uid={uid} myProfile={myUid === uid} />
    </ThemedView>
  );
}
