import SavedBuzinesses from "@/components/user/SavedBuzinesses";
import { ThemedView } from "@/components/ThemedView";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";

export default function SavedBuzinessesPage() {
  const { uid } = useSelector((state: RootState) => state.user);

  return (
    <ThemedView style={{ flex: 1 }}>
      {uid && <SavedBuzinesses uid={uid} />}
    </ThemedView>
  );
}
