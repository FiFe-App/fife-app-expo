import { useCallback, useEffect, useState } from "react";
import {
  Anchor,
  Badge,
  Checkbox,
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
import { IconSearch } from "@tabler/icons-react";

import { AuthError, fetchUsers } from "../api";
import { BadBoyToggle } from "../components/BadBoyToggle";
import { formatDate } from "../format";
import type { AdminUser, BadBoyFilter, Page } from "../types";

interface Props {
  onLoggedOut: () => void;
  onShowReports: (user: { id: string; label: string }) => void;
}

function displayName(user: AdminUser): string {
  return user.full_name || user.username || user.email || "Névtelen";
}

export function UsersPage({ onLoggedOut, onShowReports }: Props) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [badBoy, setBadBoy] = useState<BadBoyFilter>("all");
  const [reported, setReported] = useState(false);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<Page<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Szűrőváltáskor vissza az első oldalra, különben egy üres 7. oldalon ragadnánk.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, badBoy, reported]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await fetchUsers({ search: debouncedSearch, badBoy, reported, page }));
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
  }, [debouncedSearch, badBoy, reported, page, onLoggedOut]);

  useEffect(() => {
    load();
  }, [load]);

  function updateUser(id: string, patch: Partial<AdminUser>) {
    setResult((prev) =>
      prev ? { ...prev, items: prev.items.map((u) => (u.id === id ? { ...u, ...patch } : u)) } : prev,
    );
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <Stack gap="lg" maw={1200} mx="auto">
      <div>
        <Title order={2}>Felhasználók</Title>
        <Text c="dimmed" size="sm">
          {result ? `${result.total} találat` : "Regisztrált felhasználók, a legújabbak elöl"}
        </Text>
      </div>

      <Group gap="md" align="center">
        <TextInput
          placeholder="Keresés név, felhasználónév vagy email alapján"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={340}
        />
        <SegmentedControl
          value={badBoy}
          onChange={(v) => setBadBoy(v as BadBoyFilter)}
          data={[
            { label: "Mindenki", value: "all" },
            { label: "Csak badboyok", value: "true" },
            { label: "Nem badboyok", value: "false" },
          ]}
        />
        <Checkbox
          label="Csak feljelentettek"
          checked={reported}
          onChange={(e) => setReported(e.currentTarget.checked)}
        />
      </Group>

      <Paper withBorder radius="lg" p="md">
        {loadError ? (
          <Stack gap={4}>
            <Text c="red" fw={500}>
              Nem sikerült betölteni a felhasználókat.
            </Text>
            <Text c="dimmed" size="sm">
              {loadError}
            </Text>
          </Stack>
        ) : !result ? (
          <Text c="dimmed">Betöltés...</Text>
        ) : result.items.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Nincs a szűrésnek megfelelő felhasználó.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={900}>
            <Table striped highlightOnHover verticalSpacing="sm" style={{ opacity: loading ? 0.6 : 1 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Név</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Regisztráció</Table.Th>
                  <Table.Th>Utolsó belépés</Table.Th>
                  <Table.Th ta="right">Bizniszek</Table.Th>
                  <Table.Th ta="right">Feljelentések</Table.Th>
                  <Table.Th>Badboy</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {result.items.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {user.full_name || <Text span c="dimmed">nincs profil</Text>}
                      </Text>
                      {user.username && (
                        <Text size="xs" c="dimmed">
                          @{user.username}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={6} wrap="nowrap">
                        <Text size="sm">{user.email ?? "—"}</Text>
                        {!user.email_confirmed && (
                          <Badge size="xs" color="gray" variant="light">
                            nem megerősített
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(user.registered_at)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c={user.last_sign_in_at ? undefined : "dimmed"}>
                        {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "soha"}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right">{user.buziness_count}</Table.Td>
                    <Table.Td ta="right">
                      {user.report_count > 0 ? (
                        <Anchor
                          component="button"
                          c="red"
                          fw={600}
                          onClick={() => onShowReports({ id: user.id, label: displayName(user) })}
                        >
                          {user.report_count}
                        </Anchor>
                      ) : (
                        <Text span c="dimmed">
                          0
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {user.full_name !== null ? (
                        <BadBoyToggle
                          userId={user.id}
                          name={displayName(user)}
                          value={user.bad_boy}
                          onChange={(value) => updateUser(user.id, { bad_boy: value })}
                          onAuthError={onLoggedOut}
                        />
                      ) : (
                        <Text size="xs" c="dimmed">
                          —
                        </Text>
                      )}
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
