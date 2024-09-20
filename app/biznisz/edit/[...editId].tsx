import BuzinessEditScreen from "@/components/buziness/BuzinessEditScreen";
import { useGlobalSearchParams } from "expo-router";

export default function Index() {
  const { editId } = useGlobalSearchParams();
  return <BuzinessEditScreen editId={Number(editId)} />;
}
