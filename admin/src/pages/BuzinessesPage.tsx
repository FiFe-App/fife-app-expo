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
  Tooltip,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconExternalLink, IconSearch } from "@tabler/icons-react";

import { AuthError, fetchBuzinesses } from "../api";
import { BadBoyToggle } from "../components/BadBoyToggle";
import { formatDate } from "../format";
import type { AdminBuziness, Page, PublicFilter } from "../types";

const APP_URL = "https://fifeapp.hu";

interface Props {
  onLoggedOut: () => void;
  onShowReports: (buziness: { id: number; label: string }) => void;
}

function authorLabel(b: AdminBuziness): string {
  return b.author_name || b.author_email || "Névtelen";
}

export function BuzinessesPage({ onLoggedOut, onShowReports }: Props) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [reported, setReported] = useState(false);
  const [visibility, setVisibility] = useState<PublicFilter>("all");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<Page<AdminBuziness> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Szűrőváltáskor vissza az első oldalra, különben egy üres 7. oldalon ragadnánk.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, reported, visibility]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await fetchBuzinesses({ search: debouncedSearch, reported, public: visibility, page }));
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
  }, [debouncedSearch, reported, visibility, page, onLoggedOut]);

  useEffect(() => {
    load();
  }, [load]);

  // A badboy a szerzőre vonatkozik: az összes bizniszénél frissítjük.
  function updateAuthorBadBoy(authorId: string, value: boolean) {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((b) => (b.author_id === authorId ? { ...b, author_bad_boy: value } : b)),
          }
        : prev,
    );
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <Stack gap="lg" maw={1200} mx="auto">
      <div>
        <Title order={2}>Bizniszek</Title>
        <Text c="dimmed" size="sm">
          {result ? `${result.total} találat` : "Az összes biznisz, a legújabbak elöl"}
        </Text>
      </div>

      <Group gap="md" align="center">
        <TextInput
          placeholder="Keresés cím, leírás vagy szerző alapján"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={340}
        />
        <SegmentedControl
          value={visibility}
          onChange={(v) => setVisibility(v as PublicFilter)}
          data={[
            { label: "Mindegy", value: "all" },
            { label: "Nyilvános", value: "true" },
            { label: "Csak tagoknak", value: "false" },
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
              Nem sikerült betölteni a bizniszeket.
            </Text>
            <Text c="dimmed" size="sm">
              {loadError}
            </Text>
          </Stack>
        ) : !result ? (
          <Text c="dimmed">Betöltés...</Text>
        ) : result.items.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Nincs a szűrésnek megfelelő biznisz.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={950}>
            <Table striped highlightOnHover verticalSpacing="sm" style={{ opacity: loading ? 0.6 : 1 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Biznisz</Table.Th>
                  <Table.Th>Szerző</Table.Th>
                  <Table.Th>Létrehozva</Table.Th>
                  <Table.Th>Láthatóság</Table.Th>
                  <Table.Th ta="right">Feljelentések</Table.Th>
                  <Table.Th>Szerző badboy</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {result.items.map((b) => {
                  const reports = b.report_count + b.comment_report_count;
                  return (
                    <Table.Tr key={b.id}>
                      <Table.Td maw={380}>
                        <Anchor
                          href={`${APP_URL}/biznisz/${b.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                          fw={500}
                        >
                          <Group gap={4} wrap="nowrap">
                            {b.title}
                            <IconExternalLink size={12} />
                          </Group>
                        </Anchor>
                        {b.description && (
                          <Text size="xs" c="dimmed" lineClamp={1} title={b.description}>
                            {b.description}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6} wrap="nowrap">
                          <Text size="sm" fw={500}>
                            {b.author_name || <Text span c="dimmed">törölt / névtelen</Text>}
                          </Text>
                          {b.author_bad_boy && (
                            <Badge size="xs" color="red" variant="light">
                              badboy
                            </Badge>
                          )}
                        </Group>
                        {b.author_email && (
                          <Text size="xs" c="dimmed">
                            {b.author_email}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatDate(b.created_at)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" variant="light" color={b.public ? "teal" : "gray"}>
                          {b.public ? "Nyilvános" : "Csak tagoknak"}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="right">
                        {reports > 0 ? (
                          <Tooltip
                            label={`${b.report_count} a bizniszre, ${b.comment_report_count} a kommentjeire`}
                          >
                            <Anchor
                              component="button"
                              c="red"
                              fw={600}
                              onClick={() => onShowReports({ id: b.id, label: b.title })}
                            >
                              {reports}
                            </Anchor>
                          </Tooltip>
                        ) : (
                          <Text span c="dimmed">
                            0
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {b.author_name !== null ? (
                          <BadBoyToggle
                            userId={b.author_id}
                            name={authorLabel(b)}
                            value={b.author_bad_boy}
                            onChange={(value) => updateAuthorBadBoy(b.author_id, value)}
                            onAuthError={onLoggedOut}
                          />
                        ) : (
                          <Text size="xs" c="dimmed">
                            —
                          </Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
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
