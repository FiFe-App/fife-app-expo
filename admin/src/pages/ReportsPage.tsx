import { useCallback, useEffect, useState } from "react";
import { Badge, CloseButton, Group, Pagination, Paper, Select, Stack, Table, Text, Title } from "@mantine/core";

import { AuthError, fetchReports } from "../api";
import { BadBoyToggle } from "../components/BadBoyToggle";
import { formatDate } from "../format";
import { REPORT_REASONS, type AdminReport, type Page } from "../types";

export interface ReportedUserFilter {
  id: string;
  label: string;
}

interface Props {
  onLoggedOut: () => void;
  reportedUser: ReportedUserFilter | null;
  onReportedUserChange: (user: ReportedUserFilter | null) => void;
}

const REASON_OPTIONS = Object.entries(REPORT_REASONS).map(([value, label]) => ({ value, label }));

function PersonCell({ name, email }: { name: string | null; email: string | null }) {
  return (
    <>
      <Text size="sm" fw={500}>
        {name || <Text span c="dimmed">törölt / névtelen</Text>}
      </Text>
      {email && (
        <Text size="xs" c="dimmed">
          {email}
        </Text>
      )}
    </>
  );
}

export function ReportsPage({ onLoggedOut, reportedUser, onReportedUserChange }: Props) {
  const [reason, setReason] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<Page<AdminReport> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [reason, reportedUser?.id]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await fetchReports({ reportedId: reportedUser?.id ?? null, reason, page }));
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
  }, [reportedUser?.id, reason, page, onLoggedOut]);

  useEffect(() => {
    load();
  }, [load]);

  // Egy felhasználóról több feljelentés is lehet a listában: a badboy állapot
  // mindegyik sorában ugyanaz, ezért mindet frissítjük.
  function updateBadBoy(userId: string, value: boolean) {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((r) => (r.reported_id === userId ? { ...r, reported_bad_boy: value } : r)),
          }
        : prev,
    );
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <Stack gap="lg" maw={1200} mx="auto">
      <div>
        <Title order={2}>Feljelentések</Title>
        <Text c="dimmed" size="sm">
          {result ? `${result.total} feljelentés` : "Felhasználók által beküldött feljelentések"}
        </Text>
      </div>

      <Group gap="md" align="center">
        <Select
          placeholder="Minden indok"
          data={REASON_OPTIONS}
          value={reason}
          onChange={setReason}
          clearable
          w={300}
        />
        {reportedUser && (
          <Badge
            size="lg"
            variant="light"
            color="red"
            rightSection={
              <CloseButton
                size="xs"
                variant="transparent"
                aria-label="Szűrés törlése"
                onClick={() => onReportedUserChange(null)}
              />
            }
          >
            Feljelentett: {reportedUser.label}
          </Badge>
        )}
      </Group>

      <Paper withBorder radius="lg" p="md">
        {loadError ? (
          <Stack gap={4}>
            <Text c="red" fw={500}>
              Nem sikerült betölteni a feljelentéseket.
            </Text>
            <Text c="dimmed" size="sm">
              {loadError}
            </Text>
          </Stack>
        ) : !result ? (
          <Text c="dimmed">Betöltés...</Text>
        ) : result.items.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Nincs a szűrésnek megfelelő feljelentés.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={900}>
            <Table striped highlightOnHover verticalSpacing="sm" style={{ opacity: loading ? 0.6 : 1 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Dátum</Table.Th>
                  <Table.Th>Feljelentett</Table.Th>
                  <Table.Th>Indok</Table.Th>
                  <Table.Th>Leírás</Table.Th>
                  <Table.Th>Bejelentő</Table.Th>
                  <Table.Th>Badboy</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {result.items.map((report) => (
                  <Table.Tr key={report.id}>
                    <Table.Td>
                      <Text size="sm">{formatDate(report.created_at)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <PersonCell name={report.reported_name} email={report.reported_email} />
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={report.reason === "child_safety" ? "red" : "orange"}>
                        {REPORT_REASONS[report.reason] ?? report.reason}
                      </Badge>
                    </Table.Td>
                    <Table.Td maw={360}>
                      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                        {report.description}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <PersonCell name={report.author_name} email={report.author_email} />
                    </Table.Td>
                    <Table.Td>
                      {report.reported_name !== null ? (
                        <BadBoyToggle
                          userId={report.reported_id}
                          name={report.reported_name}
                          value={report.reported_bad_boy}
                          onChange={(value) => updateBadBoy(report.reported_id, value)}
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
