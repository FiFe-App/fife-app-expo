import BuzinessEditScreen from "@/components/buziness/BuzinessEditScreen";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function Index() {
  const authGuard = useAuthGuard();
  if (authGuard) return authGuard;

  return <BuzinessEditScreen />;
}
