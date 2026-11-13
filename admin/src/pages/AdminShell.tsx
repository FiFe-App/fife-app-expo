import { useEffect, useState } from "react";
import { AppShell, Button, Group, Tabs, Title } from "@mantine/core";
import { IconAlertTriangle, IconBuildingStore, IconMail, IconMessage, IconUsers } from "@tabler/icons-react";

import { logout } from "../api";
import { InAppMessagesPage } from "./InAppMessagesPage";
import { NewslettersPage } from "./NewslettersPage";
import { BuzinessesPage } from "./BuzinessesPage";
import { EMPTY_SCOPE, ReportsPage, type ReportsScope } from "./ReportsPage";
import { UsersPage } from "./UsersPage";

const TABS = ["hirlevelek", "app-uzenet", "felhasznalok", "bizniszek", "feljelentesek"] as const;
type Tab = (typeof TABS)[number];

// Az aktív fül a URL hash-ben él, így frissítés után is ott marad, és
// könyvjelzőzhető — router nélkül.
function tabFromHash(): Tab {
  const hash = window.location.hash.replace(/^#/, "");
  return (TABS as readonly string[]).includes(hash) ? (hash as Tab) : "hirlevelek";
}

export function AdminShell({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [reportsScope, setReportsScope] = useState<ReportsScope>(EMPTY_SCOPE);

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function changeTab(next: Tab) {
    window.location.hash = next;
    setTab(next);
  }

  async function handleLogout() {
    await logout();
    onLoggedOut();
  }

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="xl" wrap="nowrap">
            <Title order={3}>FiFe Admin</Title>
            <Tabs value={tab} onChange={(v) => v && changeTab(v as Tab)} variant="pills">
              <Tabs.List>
                <Tabs.Tab value="hirlevelek" leftSection={<IconMail size={16} />}>
                  Hírlevelek
                </Tabs.Tab>
                <Tabs.Tab value="app-uzenet" leftSection={<IconMessage size={16} />}>
                  App üzenet
                </Tabs.Tab>
                <Tabs.Tab value="felhasznalok" leftSection={<IconUsers size={16} />}>
                  Felhasználók
                </Tabs.Tab>
                <Tabs.Tab value="bizniszek" leftSection={<IconBuildingStore size={16} />}>
                  Bizniszek
                </Tabs.Tab>
                <Tabs.Tab value="feljelentesek" leftSection={<IconAlertTriangle size={16} />}>
                  Feljelentések
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </Group>
          <Button variant="subtle" onClick={handleLogout}>
            Kijelentkezés
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Main bg="#fff5e0">
        {tab === "hirlevelek" && <NewslettersPage onLoggedOut={onLoggedOut} />}
        {tab === "app-uzenet" && <InAppMessagesPage onLoggedOut={onLoggedOut} />}
        {tab === "felhasznalok" && (
          <UsersPage
            onLoggedOut={onLoggedOut}
            onShowReports={(user) => {
              setReportsScope({ user, buziness: null });
              changeTab("feljelentesek");
            }}
          />
        )}
        {tab === "bizniszek" && (
          <BuzinessesPage
            onLoggedOut={onLoggedOut}
            onShowReports={(buziness) => {
              setReportsScope({ user: null, buziness });
              changeTab("feljelentesek");
            }}
          />
        )}
        {tab === "feljelentesek" && (
          <ReportsPage
            onLoggedOut={onLoggedOut}
            scope={reportsScope}
            onScopeChange={setReportsScope}
          />
        )}
      </AppShell.Main>
    </AppShell>
  );
}
