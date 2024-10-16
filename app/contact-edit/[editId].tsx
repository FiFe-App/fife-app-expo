import ContactEditScreen from "@/components/buziness/ContactEditScreen";
import { useGlobalSearchParams } from "expo-router";

export default function Index() {
  const { editId } = useGlobalSearchParams();

  return <ContactEditScreen id={String(editId)} />;
}
