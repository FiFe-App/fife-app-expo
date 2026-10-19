import type { ReactNode } from "react";
import { AppShell, Button, Group, Title } from "@mantine/core";

import { logout } from "../api";

export type AdminPage = "newsletters" | "inAppMessages";

const PAGES: { value: AdminPage; label: string }[] = [
  { value: "newsletters", label: "Hírlevelek" },
  { value: "inAppMessages", label: "App üzenet" },
];

export function AdminShell({
  page,
  onNavigate,
  onLoggedOut,
  children,
}: {
  page: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onLoggedOut: () => void;
  children: ReactNode;
}) {
  async function handleLogout() {
    await logout();
    onLoggedOut();
  }

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="md" wrap="nowrap">
            <Title order={3}>FiFe Admin</Title>
            <Group gap={4} wrap="nowrap">
              {PAGES.map((p) => (
                <Button
                  key={p.value}
                  variant={p.value === page ? "light" : "subtle"}
                  onClick={() => onNavigate(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </Group>
          </Group>
          <Button variant="subtle" onClick={handleLogout}>
            Kijelentkezés
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Main bg="#fff5e0">{children}</AppShell.Main>
    </AppShell>
  );
}
