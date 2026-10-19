import { useCallback, useEffect, useState } from "react";
import { Center, Loader } from "@mantine/core";

import { fetchSession } from "./api";
import { LoginPage } from "./pages/LoginPage";
import { NewslettersPage } from "./pages/NewslettersPage";
import { InAppMessagesPage } from "./pages/InAppMessagesPage";
import { AdminShell, type AdminPage } from "./components/AdminShell";

export function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [page, setPage] = useState<AdminPage>("newsletters");
  const handleLoggedOut = useCallback(() => setAuthenticated(false), []);

  useEffect(() => {
    fetchSession().then(setAuthenticated);
  }, []);

  if (authenticated === null) {
    return (
      <Center h="100vh">
        <Loader color="coral" />
      </Center>
    );
  }

  if (!authenticated) {
    return <LoginPage onLoggedIn={() => setAuthenticated(true)} />;
  }

  return (
    <AdminShell page={page} onNavigate={setPage} onLoggedOut={handleLoggedOut}>
      {page === "newsletters" ? (
        <NewslettersPage onLoggedOut={handleLoggedOut} />
      ) : (
        <InAppMessagesPage onLoggedOut={handleLoggedOut} />
      )}
    </AdminShell>
  );
}
