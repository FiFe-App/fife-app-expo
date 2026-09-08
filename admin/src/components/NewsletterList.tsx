import { Badge, Group, Table, Text, Tooltip } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

import type { Newsletter, NewsletterStatus } from "../types";

const STATUS_COLOR: Record<NewsletterStatus, string> = {
  pending: "gray",
  sending: "blue",
  sent: "green",
  failed: "red",
};

const STATUS_LABEL: Record<NewsletterStatus, string> = {
  pending: "Függőben",
  sending: "Küldés folyamatban",
  sent: "Kiküldve",
  failed: "Sikertelen",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NewsletterList({ newsletters }: { newsletters: Newsletter[] }) {
  if (newsletters.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Még nincs egy hírlevél sem kiküldve.
      </Text>
    );
  }

  return (
    <Table striped highlightOnHover verticalSpacing="sm">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Dátum</Table.Th>
          <Table.Th>Tárgy</Table.Th>
          <Table.Th>Állapot</Table.Th>
          <Table.Th>Kiküldve / sikertelen</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {newsletters.map((n) => {
          const isTest = Boolean(n.recipients && n.recipients.length > 0);
          // Egy éles kiküldésnél az számít, kit ért el: a feliratkozói kör és a
          // teljes felhasználói kör nagyságrendekkel eltér, és utólag csak ez a
          // mező mondja meg, melyik ment ki.
          const isEveryone = !isTest && n.audience === "all";
          const excludedCount = n.excluded?.length ?? 0;
          const status = (n.status as NewsletterStatus) in STATUS_COLOR ? (n.status as NewsletterStatus) : "pending";
          return (
            <Table.Tr key={n.id}>
              <Table.Td>{formatDate(n.created_at)}</Table.Td>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <Text fw={500}>{n.title || n.subject}</Text>
                  {isTest && (
                    <Tooltip label={n.recipients?.join(", ")}>
                      <Badge color="yellow" variant="filled" size="sm">
                        TESZT
                      </Badge>
                    </Tooltip>
                  )}
                  {excludedCount > 0 && (
                    <Tooltip label={n.excluded?.join(", ")}>
                      <Badge color="gray" variant="light" size="sm">
                        {excludedCount} KIVÉTEL
                      </Badge>
                    </Tooltip>
                  )}
                  {isEveryone && (
                    <Tooltip label="Minden regisztrált felhasználónak, nem csak a feliratkozóknak">
                      <Badge color="orange" variant="filled" size="sm">
                        MINDENKI
                      </Badge>
                    </Tooltip>
                  )}
                </Group>
                {n.title && (
                  <Text size="sm" c="dimmed">
                    {n.subject}
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <Badge color={STATUS_COLOR[status]} variant="light">
                    {STATUS_LABEL[status]}
                  </Badge>
                  {n.error && (
                    <Tooltip label={n.error} multiline w={280}>
                      <IconAlertTriangle size={16} color="var(--mantine-color-red-6)" />
                    </Tooltip>
                  )}
                </Group>
              </Table.Td>
              <Table.Td>
                {n.sent_count}
                {n.failed_count > 0 && (
                  <Text span c="red" ml={6}>
                    / {n.failed_count} hiba
                  </Text>
                )}
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
