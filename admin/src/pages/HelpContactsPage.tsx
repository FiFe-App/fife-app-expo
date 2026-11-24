import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Group,
  Pagination,
  Paper,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconEyeOff, IconSearch, IconTrash } from "@tabler/icons-react";

import { AuthError, deleteHelpContact, fetchHelpContacts, setHelpContactPublic } from "../api";
import { formatDate } from "../format";
import type { AdminHelpContact, HelpContactStatus, Page } from "../types";

interface Props {
  onLoggedOut: () => void;
  /** A várakozó javaslatok száma, a navigációban jelenik meg. */
  onPendingCount: (count: number) => void;
}

/** Ugyanazok a címkék, mint az app AddHelpContactDialog-jában. */
const TYPE_LABELS: Record<string, string> = {
  TEL: "Telefonszám",
  EMAIL: "Email-cím",
  WEB: "Webhely",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  PLACE: "Cím/Hely",
  OTHER: "Más",
};

export function HelpContactsPage({ onLoggedOut, onPendingCount }: Props) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [status, setStatus] = useState<HelpContactStatus>("pending");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<Page<AdminHelpContact> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHelpContacts({ search: debouncedSearch, status, page });
      setResult(data);
      onPendingCount(data.pending);
      setLoadError(null);
    } catch (err) {
      if (err instanceof AuthError) {
        onLoggedOut();
        return;
      }
      setLoadError(err instanceof Error ? err.message : "Ismeretlen hiba történt.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, page, onLoggedOut, onPendingCount]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(id: number, action: () => Promise<void>, message: string) {
    setBusyId(id);
    try {
      await action();
      notifications.show({ color: "green", message });
      // Újratöltés: a sor a szűrőtől függően eltűnhet, és a várakozók száma is változik.
      await load();
    } catch (err) {
      if (err instanceof AuthError) {
        onLoggedOut();
        return;
      }
      notifications.show({
        color: "red",
        title: "Nem sikerült menteni",
        message: err instanceof Error ? err.message : "Ismeretlen hiba történt.",
      });
    } finally {
      setBusyId(null);
    }
  }

  function approve(c: AdminHelpContact) {
    modals.openConfirmModal({
      title: "Jóváhagyod?",
      children: (
        <Text size="sm">
          „{c.title}” ({c.data}) megjelenik mindenkinek a „Segítség kell?” oldalon, bejelentkezés nélkül is.
        </Text>
      ),
      labels: { confirm: "Jóváhagyom", cancel: "Mégse" },
      confirmProps: { color: "green" },
      onConfirm: () => run(c.id, () => setHelpContactPublic(c.id, true), `„${c.title}” élő.`),
    });
  }

  function hide(c: AdminHelpContact) {
    run(c.id, () => setHelpContactPublic(c.id, false), `„${c.title}” elrejtve.`);
  }

  function remove(c: AdminHelpContact) {
    modals.openConfirmModal({
      title: "Törlöd?",
      children: (
        <Text size="sm">„{c.title}” végleg törlődik. Ez nem vonható vissza.</Text>
      ),
      labels: { confirm: "Törlöm", cancel: "Mégse" },
      confirmProps: { color: "red" },
      onConfirm: () => run(c.id, () => deleteHelpContact(c.id), `„${c.title}” törölve.`),
    });
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <Stack gap="lg" maw={1200} mx="auto">
      <div>
        <Title order={2}>Segítség kontaktok</Title>
        <Text c="dimmed" size="sm">
          A „Segítség kell?” oldal elérhetőségei. A felhasználók által javasoltak jóváhagyásig rejtve maradnak.
        </Text>
      </div>

      <Group gap="md" align="center">
        <TextInput
          placeholder="Keresés név, elérhetőség vagy leírás alapján"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={340}
        />
        <SegmentedControl
          value={status}
          onChange={(v) => setStatus(v as HelpContactStatus)}
          data={[
            { label: "Jóváhagyásra vár", value: "pending" },
            { label: "Élő", value: "public" },
            { label: "Mind", value: "all" },
          ]}
        />
      </Group>

      <Paper withBorder radius="lg" p="md">
        {loadError ? (
          <Stack gap={4}>
            <Text c="red" fw={500}>
              Nem sikerült betölteni a kontaktokat.
            </Text>
            <Text c="dimmed" size="sm">
              {loadError}
            </Text>
          </Stack>
        ) : !result ? (
          <Text c="dimmed">Betöltés...</Text>
        ) : result.items.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {status === "pending" ? "Nincs jóváhagyásra váró javaslat." : "Nincs a szűrésnek megfelelő kontakt."}
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={1000}>
            <Table striped highlightOnHover verticalSpacing="sm" style={{ opacity: loading ? 0.6 : 1 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Név</Table.Th>
                  <Table.Th>Elérhetőség</Table.Th>
                  <Table.Th>Leírás</Table.Th>
                  <Table.Th>Javasolta</Table.Th>
                  <Table.Th>Beküldve</Table.Th>
                  <Table.Th>Állapot</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {result.items.map((c) => (
                  <Table.Tr key={c.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {c.title}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="xs" variant="light" color="gray" mb={2}>
                        {TYPE_LABELS[c.type] ?? c.type}
                      </Badge>
                      <Text size="sm" style={{ wordBreak: "break-all" }}>
                        {c.data}
                      </Text>
                    </Table.Td>
                    <Table.Td maw={280}>
                      <Text size="sm" lineClamp={3} title={c.description ?? undefined}>
                        {c.description || <Text span c="dimmed">—</Text>}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {c.author_id ? (
                        <>
                          <Text size="sm">{c.author_name || <Text span c="dimmed">névtelen</Text>}</Text>
                          {c.author_email && (
                            <Text size="xs" c="dimmed">
                              {c.author_email}
                            </Text>
                          )}
                        </>
                      ) : (
                        <Text size="xs" c="dimmed">
                          admin / eredeti lista
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(c.created_at)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light" color={c.public ? "teal" : "yellow"}>
                        {c.public ? "Élő" : "Vár"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={6} wrap="nowrap" justify="flex-end">
                        {c.public ? (
                          <Button
                            size="xs"
                            variant="default"
                            leftSection={<IconEyeOff size={14} />}
                            loading={busyId === c.id}
                            onClick={() => hide(c)}
                          >
                            Elrejtés
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            color="green"
                            leftSection={<IconCheck size={14} />}
                            loading={busyId === c.id}
                            onClick={() => approve(c)}
                          >
                            Jóváhagyás
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="subtle"
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          disabled={busyId === c.id}
                          onClick={() => remove(c)}
                        >
                          Törlés
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {totalPages > 1 && (
        <Group justify="center">
          <Pagination value={page} onChange={setPage} total={totalPages} />
        </Group>
      )}
    </Stack>
  );
}
