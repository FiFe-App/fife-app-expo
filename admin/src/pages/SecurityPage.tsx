import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Paper, Stack, Table, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconLockOpen, IconShieldLock } from "@tabler/icons-react";

import { AuthError, fetchSecurity, unbanIp } from "../api";
import { formatDate } from "../format";
import type { SecurityState } from "../types";

export function SecurityPage({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [state, setState] = useState<SecurityState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyIp, setBusyIp] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setState(await fetchSecurity());
      setLoadError(null);
    } catch (err) {
      if (err instanceof AuthError) {
        onLoggedOut();
        return;
      }
      setLoadError(err instanceof Error ? err.message : "Ismeretlen hiba történt.");
    }
  }, [onLoggedOut]);

  useEffect(() => {
    load();
  }, [load]);

  function confirmUnban(ip: string) {
    modals.openConfirmModal({
      title: "Feloldod a tiltást?",
      children: (
        <Text size="sm">
          A(z) <b>{ip}</b> címről újra lehet próbálkozni a belépéssel. A korábbi sikertelen próbái is törlődnek.
        </Text>
      ),
      labels: { confirm: "Feloldom", cancel: "Mégse" },
      onConfirm: async () => {
        setBusyIp(ip);
        try {
          await unbanIp(ip);
          notifications.show({ color: "green", message: `${ip} feloldva.` });
          await load();
        } catch (err) {
          if (err instanceof AuthError) {
            onLoggedOut();
            return;
          }
          notifications.show({
            color: "red",
            title: "Nem sikerült feloldani",
            message: err instanceof Error ? err.message : "Ismeretlen hiba történt.",
          });
        } finally {
          setBusyIp(null);
        }
      },
    });
  }

  return (
    <Stack gap="lg" maw={960} mx="auto">
      <div>
        <Title order={2}>Biztonság</Title>
        <Text c="dimmed" size="sm">
          Az admin belépés IP-alapú védelme.
        </Text>
      </div>

      <Alert variant="light" color="gray" icon={<IconShieldLock size={18} />}>
        Ha egy IP címről 15 percen belül {state?.maxFailedAttempts ?? 10} hibás jelszó érkezik, az IP véglegesen ki
        lesz tiltva, amíg itt fel nem oldod. Az <code>ADMIN_IP_ALLOWLIST</code> környezeti változóban felsorolt
        címeket soha nem tiltja ki.
      </Alert>

      {loadError && (
        <Text c="red" size="sm">
          {loadError}
        </Text>
      )}

      <Paper withBorder radius="lg" p="md">
        <Title order={4} mb="sm">
          Kitiltott IP címek
        </Title>
        {!state ? (
          <Text c="dimmed">Betöltés...</Text>
        ) : state.bans.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">
            Nincs kitiltott IP cím.
          </Text>
        ) : (
          <Table striped verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>IP cím</Table.Th>
                <Table.Th>Kitiltva</Table.Th>
                <Table.Th ta="right">Hibás próbák</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {state.bans.map((ban) => (
                <Table.Tr key={ban.ip}>
                  <Table.Td>
                    <Text size="sm" ff="monospace">
                      {ban.ip}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(ban.banned_at)}</Text>
                  </Table.Td>
                  <Table.Td ta="right">{ban.failed_attempts}</Table.Td>
                  <Table.Td ta="right">
                    <Button
                      size="xs"
                      variant="default"
                      leftSection={<IconLockOpen size={14} />}
                      loading={busyIp === ban.ip}
                      onClick={() => confirmUnban(ban.ip)}
                    >
                      Feloldás
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Paper withBorder radius="lg" p="md">
        <Title order={4} mb="sm">
          Sikertelen belépések (utolsó 24 óra)
        </Title>
        {!state ? (
          <Text c="dimmed">Betöltés...</Text>
        ) : state.failures.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">
            Nem volt sikertelen próbálkozás.
          </Text>
        ) : (
          <Table striped verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>IP cím</Table.Th>
                <Table.Th ta="right">Próbák</Table.Th>
                <Table.Th>Utolsó</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {state.failures.map((f) => (
                <Table.Tr key={f.ip}>
                  <Table.Td>
                    <Text size="sm" ff="monospace">
                      {f.ip}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">{f.attempts}</Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(f.last_attempt_at)}</Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}
