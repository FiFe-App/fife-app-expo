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

import { AuthError, fetchRequests } from "../api";
import { BadBoyToggle } from "../components/BadBoyToggle";
import { formatDate } from "../format";
import type { AdminRequest, Page, RequestFilters } from "../types";
import { contentUrl } from "./ReportsPage";

interface Props {
  onLoggedOut: () => void;
  onShowReports: (request: { id: number; label: string }) => void;
}

const MAX_TAGS_SHOWN = 4;

function authorLabel(r: AdminRequest): string {
  return r.author_name || r.author_email || "Névtelen";
}

export function RequestsPage({ onLoggedOut, onShowReports }: Props) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [reported, setReported] = useState(false);
  const [status, setStatus] = useState<RequestFilters["status"]>("all");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<Page<AdminRequest> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Szűrőváltáskor vissza az első oldalra, különben egy üres 7. oldalon ragadnánk.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, reported, status]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await fetchRequests({ search: debouncedSearch, reported, status, page }));
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
  }, [debouncedSearch, reported, status, page, onLoggedOut]);

  useEffect(() => {
    load();
  }, [load]);

  // A badboy a szerzőre vonatkozik: az összes kérésénél frissítjük.
  function updateAuthorBadBoy(authorId: string, value: boolean) {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((r) => (r.author_id === authorId ? { ...r, author_bad_boy: value } : r)),
          }
        : prev,
    );
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <Stack gap="lg" maw={1200} mx="auto">
      <div>
        <Title order={2}>Kérések</Title>
        <Text c="dimmed" size="sm">
          {result ? `${result.total} találat` : "A Közösség részben feladott kérések, a legújabbak elöl"}
        </Text>
      </div>

      <Group gap="md" align="center">
        <TextInput
          placeholder="Keresés cím, leírás, címke vagy szerző alapján"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={360}
        />
        <SegmentedControl
          value={status}
          onChange={(v) => setStatus(v as RequestFilters["status"])}
          data={[
            { label: "Mind", value: "all" },
            { label: "Nyitott", value: "open" },
            { label: "Megoldott", value: "solved" },
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
              Nem sikerült betölteni a kéréseket.
            </Text>
            <Text c="dimmed" size="sm">
              {loadError}
            </Text>
          </Stack>
        ) : !result ? (
          <Text c="dimmed">Betöltés...</Text>
        ) : result.items.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Nincs a szűrésnek megfelelő kérés.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={1000}>
            <Table striped highlightOnHover verticalSpacing="sm" style={{ opacity: loading ? 0.6 : 1 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Kérés</Table.Th>
                  <Table.Th>Szerző</Table.Th>
                  <Table.Th>Létrehozva</Table.Th>
                  <Table.Th>Állapot</Table.Th>
                  <Table.Th ta="right">Feljelentések</Table.Th>
                  <Table.Th>Szerző badboy</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {result.items.map((r) => {
                  const reports = r.report_count + r.comment_report_count;
                  const extraTags = r.tags.length - MAX_TAGS_SHOWN;
                  return (
                    <Table.Tr key={r.id}>
                      <Table.Td maw={400}>
                        <Anchor
                          href={contentUrl("request", r.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                          fw={500}
                        >
                          <Group gap={4} wrap="nowrap">
                            {r.title}
                            <IconExternalLink size={12} />
                          </Group>
                        </Anchor>
                        {r.description && (
                          <Text size="xs" c="dimmed" lineClamp={1} title={r.description}>
                            {r.description}
                          </Text>
                        )}
                        {r.tags.length > 0 && (
                          <Group gap={4} mt={4}>
                            {r.tags.slice(0, MAX_TAGS_SHOWN).map((tag) => (
                              <Badge key={tag} size="xs" variant="outline" color="gray">
                                {tag}
                              </Badge>
                            ))}
                            {extraTags > 0 && (
                              <Text size="xs" c="dimmed" title={r.tags.slice(MAX_TAGS_SHOWN).join(", ")}>
                                +{extraTags}
                              </Text>
                            )}
                          </Group>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6} wrap="nowrap">
                          <Text size="sm" fw={500}>
                            {r.author_name || <Text span c="dimmed">törölt / névtelen</Text>}
                          </Text>
                          {r.author_bad_boy && (
                            <Badge size="xs" color="red" variant="light">
                              badboy
                            </Badge>
                          )}
                        </Group>
                        {r.author_email && (
                          <Text size="xs" c="dimmed">
                            {r.author_email}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatDate(r.created_at)}</Text>
                      </Table.Td>
                      <Table.Td>
                        {r.status === "solved" ? (
                          <Tooltip label={r.solved_at ? `Megoldva: ${formatDate(r.solved_at)}` : "Megoldva"}>
                            <Badge size="sm" variant="light" color="gray">
                              Megoldva
                            </Badge>
                          </Tooltip>
                        ) : (
                          <Badge size="sm" variant="light" color="lime">
                            Nyitott
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td ta="right">
                        {reports > 0 ? (
                          <Tooltip label={`${r.report_count} a kérésre, ${r.comment_report_count} a kommentjeire`}>
                            <Anchor
                              component="button"
                              c="red"
                              fw={600}
                              onClick={() => onShowReports({ id: r.id, label: r.title })}
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
                        {r.author_name !== null ? (
                          <BadBoyToggle
                            userId={r.author_id}
                            name={authorLabel(r)}
                            value={r.author_bad_boy}
                            onChange={(value) => updateAuthorBadBoy(r.author_id, value)}
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
