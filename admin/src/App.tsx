import { useCallback, useEffect, useState } from "react";
import { Center, Loader } from "@mantine/core";

import { fetchSession } from "./api";
import { LoginPage } from "./pages/LoginPage";
import { AdminShell } from "./pages/AdminShell";

export function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
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

  return <AdminShell onLoggedOut={handleLoggedOut} />;
}
