import BuzinessEditScreen from "@/components/buziness/BuzinessEditScreen";
import { useGlobalSearchParams } from "expo-router";

export default function Index() {
  const { editId } = useGlobalSearchParams();
  console.log(editId);

  return <BuzinessEditScreen editId={Number(editId)} />;
}
