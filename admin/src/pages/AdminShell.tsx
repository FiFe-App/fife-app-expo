import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AppShell, Badge, Burger, Button, Group, NavLink, ScrollArea, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAlertTriangle,
  IconBuildingStore,
  IconHandStop,
  IconLifebuoy,
  IconMail,
  IconMessage,
  IconShieldLock,
  IconUsers,
} from "@tabler/icons-react";

import { fetchHelpContacts, logout } from "../api";
import { BuzinessesPage } from "./BuzinessesPage";
import { HelpContactsPage } from "./HelpContactsPage";
import { InAppMessagesPage } from "./InAppMessagesPage";
import { NewslettersPage } from "./NewslettersPage";
import { EMPTY_SCOPE, ReportsPage, type ReportsScope } from "./ReportsPage";
import { RequestsPage } from "./RequestsPage";
import { SecurityPage } from "./SecurityPage";
import { UsersPage } from "./UsersPage";

const TABS = [
  "hirlevelek",
  "app-uzenet",
  "felhasznalok",
  "bizniszek",
  "kerelmek",
  "segitseg",
  "feljelentesek",
  "biztonsag",
] as const;
type Tab = (typeof TABS)[number];

interface NavItem {
  tab: Tab;
  label: string;
  icon: ReactNode;
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Kommunikáció",
    items: [
      { tab: "hirlevelek", label: "Hírlevelek", icon: <IconMail size={18} /> },
      { tab: "app-uzenet", label: "App üzenet", icon: <IconMessage size={18} /> },
    ],
  },
  {
    group: "Közösség",
    items: [
      { tab: "felhasznalok", label: "Felhasználók", icon: <IconUsers size={18} /> },
      { tab: "bizniszek", label: "Bizniszek", icon: <IconBuildingStore size={18} /> },
      { tab: "kerelmek", label: "Kérések", icon: <IconHandStop size={18} /> },
      { tab: "segitseg", label: "Segítség kontaktok", icon: <IconLifebuoy size={18} /> },
    ],
  },
  {
    group: "Moderáció",
    items: [
      { tab: "feljelentesek", label: "Feljelentések", icon: <IconAlertTriangle size={18} /> },
      { tab: "biztonsag", label: "Biztonság", icon: <IconShieldLock size={18} /> },
    ],
  },
];

// Az aktív oldal a URL hash-ben él, így frissítés után is ott marad, és
// könyvjelzőzhető — router nélkül.
function tabFromHash(): Tab {
  const hash = window.location.hash.replace(/^#/, "");
  return (TABS as readonly string[]).includes(hash) ? (hash as Tab) : "hirlevelek";
}

export function AdminShell({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [reportsScope, setReportsScope] = useState<ReportsScope>(EMPTY_SCOPE);
  const [pendingHelpContacts, setPendingHelpContacts] = useState(0);
  const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure(false);

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // A jóváhagyásra váró javaslatok száma a navigációban, bármelyik oldalon is
  // vagyunk. Hiba esetén csak nem látszik a szám — ezért nem állítjuk le az admint.
  useEffect(() => {
    fetchHelpContacts({ search: "", status: "pending", page: 1 })
      .then((data) => setPendingHelpContacts(data.pending))
      .catch(() => {});
  }, []);

  const changeTab = useCallback(
    (next: Tab) => {
      window.location.hash = next;
      setTab(next);
      closeNav();
    },
    [closeNav],
  );

  async function handleLogout() {
    await logout();
    onLoggedOut();
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !navOpened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={navOpened} onClick={toggleNav} hiddenFrom="sm" size="sm" aria-label="Menü" />
            <Title order={3}>FiFe Admin</Title>
          </Group>
          <Button variant="subtle" onClick={handleLogout}>
            Kijelentkezés
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <AppShell.Section grow component={ScrollArea}>
          {NAV.map(({ group, items }) => (
            <div key={group}>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" px="sm" mt="md" mb={4}>
                {group}
              </Text>
              {items.map((item) => (
                <NavLink
                  key={item.tab}
                  href={`#${item.tab}`}
                  label={item.label}
                  leftSection={item.icon}
                  active={tab === item.tab}
                  variant="filled"
                  onClick={(e) => {
                    e.preventDefault();
                    changeTab(item.tab);
                  }}
                  rightSection={
                    item.tab === "segitseg" && pendingHelpContacts > 0 ? (
                      <Badge size="sm" color="yellow" variant="filled" circle>
                        {pendingHelpContacts}
                      </Badge>
                    ) : undefined
                  }
                  style={{ borderRadius: 8 }}
                />
              ))}
            </div>
          ))}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main bg="#fff5e0">
        {tab === "hirlevelek" && <NewslettersPage onLoggedOut={onLoggedOut} />}
        {tab === "app-uzenet" && <InAppMessagesPage onLoggedOut={onLoggedOut} />}
        {tab === "felhasznalok" && (
          <UsersPage
            onLoggedOut={onLoggedOut}
            onShowReports={(user) => {
              setReportsScope({ user, content: null });
              changeTab("feljelentesek");
            }}
          />
        )}
        {tab === "bizniszek" && (
          <BuzinessesPage
            onLoggedOut={onLoggedOut}
            onShowReports={(buziness) => {
              setReportsScope({ user: null, content: { type: "biznisz", ...buziness } });
              changeTab("feljelentesek");
            }}
          />
        )}
        {tab === "kerelmek" && (
          <RequestsPage
            onLoggedOut={onLoggedOut}
            onShowReports={(request) => {
              setReportsScope({ user: null, content: { type: "request", ...request } });
              changeTab("feljelentesek");
            }}
          />
        )}
        {tab === "segitseg" && (
          <HelpContactsPage onLoggedOut={onLoggedOut} onPendingCount={setPendingHelpContacts} />
        )}
        {tab === "feljelentesek" && (
          <ReportsPage onLoggedOut={onLoggedOut} scope={reportsScope} onScopeChange={setReportsScope} />
        )}
        {tab === "biztonsag" && <SecurityPage onLoggedOut={onLoggedOut} />}
      </AppShell.Main>
    </AppShell>
  );
}
