import { useCallback, useEffect, useState } from "react";
import {
  Anchor,
  Badge,
  CloseButton,
  Group,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";

import { AuthError, fetchReports } from "../api";
import { BadBoyToggle } from "../components/BadBoyToggle";
import { formatDate } from "../format";
import {
  REPORT_REASONS,
  REPORT_TARGETS,
  type AdminReport,
  type Page,
  type ReportTargetType,
} from "../types";

/**
 * Honnan érkeztünk ide szűrve: egy felhasználó (Felhasználók fül) vagy egy
 * biznisz (Bizniszek fül) feljelentései. A biznisz szűrő a biznisz alatti
 * kommentek feljelentéseit is mutatja.
 */
export interface ReportsScope {
  user: { id: string; label: string } | null;
  buziness: { id: number; label: string } | null;
}

export const EMPTY_SCOPE: ReportsScope = { user: null, buziness: null };

interface Props {
  onLoggedOut: () => void;
  scope: ReportsScope;
  onScopeChange: (scope: ReportsScope) => void;
}

const APP_URL = "https://fifeapp.hu";

const REASON_OPTIONS = Object.entries(REPORT_REASONS).map(([value, label]) => ({ value, label }));
const TARGET_OPTIONS = Object.entries(REPORT_TARGETS).map(([value, label]) => ({ value, label }));

const TARGET_COLOR: Record<ReportTargetType, string> = {
  profile: "grape",
  message: "blue",
  group_message: "cyan",
  biznisz: "teal",
  comment: "indigo",
};

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

function ContentCell({ report }: { report: AdminReport }) {
  const type = report.target_type in REPORT_TARGETS ? report.target_type : "profile";
  return (
    <Stack gap={4}>
      <Group gap={6} wrap="nowrap">
        <Badge size="sm" variant="light" color={TARGET_COLOR[type]}>
          {REPORT_TARGETS[type]}
        </Badge>
        {report.buziness_id !== null && (
          <Anchor
            href={`${APP_URL}/biznisz/${report.buziness_id}`}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
          >
            <Group gap={2} wrap="nowrap">
              {report.buziness_title ?? `Biznisz #${report.buziness_id}`}
              <IconExternalLink size={12} />
            </Group>
          </Anchor>
        )}
      </Group>
      {report.target_excerpt ? (
        <Text size="sm" lineClamp={3} style={{ whiteSpace: "pre-wrap" }} title={report.target_excerpt}>
          {report.target_excerpt}
        </Text>
      ) : (
        type !== "profile" && (
          <Text size="xs" c="dimmed">
            nincs mentett szöveg
          </Text>
        )
      )}
    </Stack>
  );
}

export function ReportsPage({ onLoggedOut, scope, onScopeChange }: Props) {
  const [reason, setReason] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<ReportTargetType | null>(null);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<Page<AdminReport> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [reason, targetType, scope.user?.id, scope.buziness?.id]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResult(
        await fetchReports({
          reportedId: scope.user?.id ?? null,
          buzinessId: scope.buziness?.id ?? null,
          reason,
          targetType,
          page,
        }),
      );
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
  }, [scope.user?.id, scope.buziness?.id, reason, targetType, page, onLoggedOut]);

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
    <Stack gap="lg" maw={1300} mx="auto">
      <div>
        <Title order={2}>Feljelentések</Title>
        <Text c="dimmed" size="sm">
          {result ? `${result.total} feljelentés` : "Felhasználók által beküldött feljelentések"}
        </Text>
      </div>

      <Group gap="md" align="center">
        <Select
          placeholder="Minden típus"
          data={TARGET_OPTIONS}
          value={targetType}
          onChange={(v) => setTargetType(v as ReportTargetType | null)}
          clearable
          w={200}
        />
        <Select
          placeholder="Minden indok"
          data={REASON_OPTIONS}
          value={reason}
          onChange={setReason}
          clearable
          w={300}
        />
        {scope.user && (
          <Badge
            size="lg"
            variant="light"
            color="red"
            rightSection={
              <CloseButton
                size="xs"
                variant="transparent"
                aria-label="Felhasználó szűrés törlése"
                onClick={() => onScopeChange({ ...scope, user: null })}
              />
            }
          >
            Feljelentett: {scope.user.label}
          </Badge>
        )}
        {scope.buziness && (
          <Badge
            size="lg"
            variant="light"
            color="teal"
            rightSection={
              <CloseButton
                size="xs"
                variant="transparent"
                aria-label="Biznisz szűrés törlése"
                onClick={() => onScopeChange({ ...scope, buziness: null })}
              />
            }
          >
            Biznisz: {scope.buziness.label}
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
          <Table.ScrollContainer minWidth={1100}>
            <Table striped highlightOnHover verticalSpacing="sm" style={{ opacity: loading ? 0.6 : 1 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Dátum</Table.Th>
                  <Table.Th>Tartalom</Table.Th>
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
                    <Table.Td maw={340}>
                      <ContentCell report={report} />
                    </Table.Td>
                    <Table.Td>
                      <PersonCell name={report.reported_name} email={report.reported_email} />
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={report.reason === "child_safety" ? "red" : "orange"}>
                        {REPORT_REASONS[report.reason] ?? report.reason}
                      </Badge>
                    </Table.Td>
                    <Table.Td maw={300}>
                      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                        {report.description || <Text span c="dimmed">—</Text>}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <PersonCell name={report.author_name} email={report.author_email} />
                    </Table.Td>
                    <Table.Td>
                      {report.reported_id !== null && report.reported_name !== null ? (
                        <BadBoyToggle
                          userId={report.reported_id}
                          name={report.reported_name}
                          value={report.reported_bad_boy}
                          onChange={(value) => updateBadBoy(report.reported_id!, value)}
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
