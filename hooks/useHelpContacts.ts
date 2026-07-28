import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { useCallback, useEffect, useState } from "react";

export function useHelpContacts() {
  const [contacts, setContacts] = useState<Tables<"help_contacts">[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("help_contacts")
      .select("*")
      .order("title", { ascending: true });
    if (data) setContacts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { contacts, loading, reload: load };
}
