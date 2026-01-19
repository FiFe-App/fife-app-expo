import BuzinessEditScreen from "@/components/buziness/BuzinessEditScreen";
import { useGlobalSearchParams } from "expo-router";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function Index() {
  const authGuard = useAuthGuard();
  if (authGuard) return authGuard;

  const { editId } = useGlobalSearchParams();

  return <BuzinessEditScreen editId={Number(editId)} />;
}
