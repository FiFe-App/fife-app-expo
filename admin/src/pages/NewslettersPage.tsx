import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell, Button, Group, Modal, Paper, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";

import { AuthError, fetchNewsletters, logout } from "../api";
import type { Newsletter } from "../types";
import { NewsletterForm } from "../components/NewsletterForm";
import { NewsletterList } from "../components/NewsletterList";

const POLL_INTERVAL_MS = 5000;

export function NewslettersPage({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchNewsletters();
      setNewsletters(data);
      setLoadError(null);
    } catch (err) {
      if (err instanceof AuthError) {
        onLoggedOut();
        return;
      }
      // Enélkül minden hiba üres listaként jelent meg, ami pontosan úgy néz ki,
      // mintha még nem lenne egy hírlevél sem — pedig lehet hiányzó env
      // változó, le nem futtatott migráció vagy elérhetetlen Supabase.
      setLoadError(err instanceof Error ? err.message : "Ismeretlen hiba történt.");
    } finally {
      setLoading(false);
    }
  }, [onLoggedOut]);

  useEffect(() => {
    load();
  }, [load]);

  // Amíg egy hírlevél még "pending"/"sending" állapotban van (a webhook aszinkron
  // dolgozza fel a küldést), rendszeresen frissítünk, hogy lássuk mikor zárul le.
  useEffect(() => {
    const hasPending = newsletters.some((n) => n.status === "pending" || n.status === "sending");
    if (hasPending && !pollTimer.current) {
      pollTimer.current = setInterval(load, POLL_INTERVAL_MS);
    } else if (!hasPending && pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };
  }, [newsletters, load]);

  async function handleLogout() {
    await logout();
    onLoggedOut();
  }

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3}>FiFe Admin</Title>
          <Button variant="subtle" onClick={handleLogout}>
            Kijelentkezés
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Main bg="#fff5e0">
        <Stack gap="lg" maw={960} mx="auto">
          <Group justify="space-between">
            <div>
              <Title order={2}>Hírlevelek</Title>
              <Text c="dimmed" size="sm">
                Kiküldött és teszt hírlevelek listája
              </Text>
            </div>
            <Button leftSection={<IconPlus size={16} />} onClick={openForm}>
              Új hírlevél
            </Button>
          </Group>

          <Paper withBorder radius="lg" p="md">
            {loading ? (
              <Text c="dimmed">Betöltés...</Text>
            ) : loadError ? (
              <Stack gap={4}>
                <Text c="red" fw={500}>
                  Nem sikerült betölteni a hírleveleket.
                </Text>
                <Text c="dimmed" size="sm">
                  {loadError}
                </Text>
              </Stack>
            ) : (
              <NewsletterList newsletters={newsletters} />
            )}
          </Paper>
        </Stack>
      </AppShell.Main>

      <Modal opened={formOpened} onClose={closeForm} title="Új hírlevél" size="lg">
        <NewsletterForm
          onSent={() => {
            closeForm();
            load();
          }}
          onAuthError={onLoggedOut}
        />
      </Modal>
    </AppShell>
  );
}
