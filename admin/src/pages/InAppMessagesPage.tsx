import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Anchor,
  Button,
  Center,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

import { AuthError, createInAppMessage, fetchInAppMessage } from "../api";
import type { InAppMessage, InAppMessageInput } from "../types";

const EMPTY: InAppMessageInput = {
  icon: "",
  openIcon: "",
  title: "",
  body: "",
  primaryLabel: "",
  primaryUrl: "",
  secondaryLabel: "",
  secondaryUrl: "",
};

function toInput(message: InAppMessage): InAppMessageInput {
  return {
    icon: message.icon ?? "",
    openIcon: message.open_icon ?? "",
    title: message.title,
    body: message.body,
    primaryLabel: message.primary_label ?? "",
    primaryUrl: message.primary_url ?? "",
    secondaryLabel: message.secondary_label ?? "",
    secondaryUrl: message.secondary_url ?? "",
  };
}

/** Ugyanaz a link-szintaxis, mint az appban: [szöveg](url) vagy csupasz https:// link. */
function renderBody(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <Anchor key={match.index} href={match[2] ?? match[3]} target="_blank" underline="always">
        {match[1] ?? match[3]}
      </Anchor>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function Preview({ value }: { value: InAppMessageInput }) {
  const icon = value.icon.trim();
  const isImage = /^https?:\/\//.test(icon);
  const buttons = [
    { label: value.primaryLabel, url: value.primaryUrl, variant: "filled" },
    { label: value.secondaryLabel, url: value.secondaryUrl, variant: "light" },
  ].filter((b) => b.label.trim() && b.url.trim());

  return (
    <Paper withBorder radius="xl" p="lg" bg="white">
      <Stack gap="md">
        {icon &&
          (isImage ? (
            <Center>
              <Image src={icon} w={100} h={100} radius="md" fit="cover" />
            </Center>
          ) : (
            <Text ta="center" c="dimmed" size="sm">
              ikon: {icon}
            </Text>
          ))}
        <Title order={3} ta="center">
          {value.title || "Cím"}
        </Title>
        <Text style={{ whiteSpace: "pre-wrap" }}>{renderBody(value.body)}</Text>
        {buttons.length > 0 && (
          <Group justify="flex-end" gap="xs">
            {buttons.map((b) => (
              <Button key={b.variant} variant={b.variant} radius="xl" title={b.url}>
                {b.label}
              </Button>
            ))}
          </Group>
        )}
      </Stack>
    </Paper>
  );
}

export function InAppMessagesPage({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [value, setValue] = useState<InAppMessageInput>(EMPTY);
  const [current, setCurrent] = useState<InAppMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const message = await fetchInAppMessage();
      setCurrent(message);
      setValue(message ? toInput(message) : EMPTY);
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
  }, [onLoggedOut]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key: keyof InAppMessageInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = e.currentTarget.value;
    setValue((v) => ({ ...v, [key]: next }));
  };

  const dirty = current === null || JSON.stringify(toInput(current)) !== JSON.stringify(value);
  const canSave = value.title.trim() !== "" && value.body.trim() !== "" && dirty;

  async function save() {
    setSaving(true);
    try {
      const saved = await createInAppMessage(value);
      setCurrent(saved);
      setValue(toInput(saved));
      notifications.show({
        color: "green",
        title: "Mentve",
        message: "Az új tartalom minden felhasználónál automatikusan feljön.",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        onLoggedOut();
        return;
      }
      notifications.show({
        color: "red",
        title: "Sikertelen mentés",
        message: err instanceof Error ? err.message : "Ismeretlen hiba történt.",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    modals.openConfirmModal({
      title: "Új app üzenet",
      children:
        "Mentéskor új változat jön létre, és az app minden bejelentkezett felhasználónál automatikusan feldobja. Biztosan folytatod?",
      labels: { confirm: "Mentés és megjelenítés", cancel: "Mégse" },
      onConfirm: () => void save(),
    });
  }

  return (
    <Stack gap="lg" maw={1100} mx="auto">
      <div>
        <Title order={2}>App üzenet</Title>
        <Text c="dimmed" size="sm">
          Az appban felugró üzenet, a „Visszajelzés” menüből is megnyitható. Mindig a legutóbb mentett változat látszik.
          {current && ` Jelenlegi: #${current.id}, ${new Date(current.created_at).toLocaleString("hu-HU")}.`}
        </Text>
      </div>

      {loading ? (
        <Text c="dimmed">Betöltés...</Text>
      ) : loadError ? (
        <Paper withBorder radius="lg" p="md">
          <Text c="red" fw={500}>
            Nem sikerült betölteni.
          </Text>
          <Text c="dimmed" size="sm">
            {loadError}
          </Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Paper withBorder radius="lg" p="md">
            <Stack gap="md">
              <TextInput
                label="Ikon (opcionális)"
                description="Kép URL (https://…) vagy Material Community ikonnév (pl. message-draw)."
                value={value.icon}
                onChange={set("icon")}
              />
              <TextInput
                label="Megnyitó ikon (opcionális)"
                description="Az app fejlécében az üzenetet megnyitó menüpont ikonja, Material Community ikonnév. Ha üres: message-draw."
                placeholder="message-draw"
                value={value.openIcon}
                onChange={set("openIcon")}
              />
              <TextInput label="Cím" value={value.title} onChange={set("title")} required />
              <Textarea
                label="Szöveg"
                description="Link: [szöveg](https://…) vagy csupasz https:// cím. App-on belüli útvonal is mehet, pl. [írj](/chat/<uid>)."
                autosize
                minRows={4}
                maxRows={12}
                value={value.body}
                onChange={set("body")}
                required
              />
              <Group grow>
                <TextInput label="Első gomb szövege" value={value.primaryLabel} onChange={set("primaryLabel")} />
                <TextInput
                  label="Első gomb link"
                  placeholder="/chat/<uid> vagy https://…"
                  value={value.primaryUrl}
                  onChange={set("primaryUrl")}
                />
              </Group>
              <Group grow>
                <TextInput label="Második gomb szövege" value={value.secondaryLabel} onChange={set("secondaryLabel")} />
                <TextInput
                  label="Második gomb link"
                  placeholder="mailto:… vagy https://…"
                  value={value.secondaryUrl}
                  onChange={set("secondaryUrl")}
                />
              </Group>
              <Group justify="flex-end">
                <Button variant="subtle" disabled={!dirty || saving} onClick={() => current && setValue(toInput(current))}>
                  Visszaállítás
                </Button>
                <Button onClick={handleSave} loading={saving} disabled={!canSave}>
                  Mentés
                </Button>
              </Group>
            </Stack>
          </Paper>

          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Előnézet
            </Text>
            <Preview value={value} />
          </Stack>
        </SimpleGrid>
      )}
    </Stack>
  );
}
