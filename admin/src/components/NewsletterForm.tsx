import { useEffect, useMemo, useState } from "react";
import { Button, Group, SegmentedControl, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

import { AuthError, createNewsletter, fetchRecipientCount } from "../api";
import type { Newsletter, NewsletterAudience } from "../types";

/**
 * A kivétel-mező szabad szöveg: vesszővel, pontosvesszővel vagy soronként
 * felsorolt címek egyaránt működnek, mert a listát általában máshonnan másolják
 * be. A normalizálás (kisbetű, trim, duplikátumok) itt és a szerveren is
 * megtörténik — a szerveré a mérvadó, ez csak azért van, hogy a lekérdezett
 * címzettszám pontosan azt mutassa, ami ki fog menni.
 */
function parseExcluded(raw: string): string[] {
  const entries = raw
    .split(/[\s,;]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry !== "");
  return [...new Set(entries)];
}

export function NewsletterForm({
  onSent,
  onAuthError,
}: {
  onSent: (newsletter: Newsletter) => void;
  onAuthError: () => void;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState<"test" | "live" | null>(null);
  const [audience, setAudience] = useState<NewsletterAudience>("subscribers");
  const [excludedText, setExcludedText] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countError, setCountError] = useState<string | null>(null);

  const excluded = useMemo(() => parseExcluded(excludedText), [excludedText]);
  // A listából képzett kulcs: enélkül a useMemo minden rendernél új tömböt ad,
  // és az effect végtelen ciklusba fordulna.
  const excludedKey = excluded.join(",");

  // A címzettszám a küldés előtti utolsó ellenőrzés. A 19-es hírlevél hat
  // embert ért el, mert a "Küldés mindenkinek" gomb valójában a feliratkozókat
  // jelentette, és ez sehol nem látszott a kiküldés előtt. A kivételeket ezért
  // ugyanaz az adatbázis-függvény vonja le, amelyik a kiküldést is hajtja.
  useEffect(() => {
    let cancelled = false;
    setRecipientCount(null);
    setCountError(null);
    // Gépelés közben ne kérdezzük le minden leütésre.
    const timer = setTimeout(() => {
      fetchRecipientCount(audience, excludedKey === "" ? [] : excludedKey.split(","))
        .then((n) => {
          if (!cancelled) setRecipientCount(n);
        })
        .catch((err) => {
          // A szerver saját üzenetét mutatjuk: ha a migráció még nem futott le,
          // itt derül ki ("Could not find the function ..."), nem egy általános
          // hibaszövegbe rejtve. Lejárt session is idekerül; a következő
          // tényleges művelet úgyis kiváltja a bejelentkeztetést.
          if (!cancelled) setCountError(err instanceof Error ? err.message : "Ismeretlen hiba.");
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [audience, excludedKey]);

  const editor = useEditor({
    extensions: [StarterKit, Underline, Link],
    content: "",
  });

  // A számot már a kivételek levonása után kapjuk, de kiírjuk hányat vontunk le:
  // egy elgépelt cím így nem csendben nem-illeszkedik, hanem látszik a számon.
  const excludedSuffix = excluded.length > 0 ? ` ${excluded.length} kivétel levonva.` : "";
  const bodyEmpty = !editor || editor.isEmpty;
  const canSubmit = subject.trim().length > 0 && !bodyEmpty;

  async function send(recipientOverride: string) {
    if (!editor) return;
    const mode = recipientOverride ? "test" : "live";
    setSending(mode);
    try {
      const newsletter = await createNewsletter({
        subject: subject.trim(),
        title: title.trim(),
        body: editor.getHTML(),
        ctaLabel: ctaLabel.trim(),
        ctaUrl: ctaUrl.trim(),
        testEmail: recipientOverride,
        audience,
        excluded,
      });
      notifications.show({
        color: "green",
        title: mode === "test" ? "Teszt hírlevél kiküldve" : "Hírlevél kiküldve",
        message:
          mode === "test"
            ? `Elment a(z) ${recipientOverride} címre.`
            : audience === "all"
              ? "A hírlevél elindult minden regisztrált felhasználónak."
              : "A hírlevél elindult a feliratkozóknak.",
      });
      setTitle("");
      setSubject("");
      setCtaLabel("");
      setCtaUrl("");
      setTestEmail("");
      // Az "all" nem ragad be a következő hírlevélre: a tágabb célcsoportot
      // mindig külön kell választani.
      setAudience("subscribers");
      setExcludedText("");
      editor.commands.clearContent();
      onSent(newsletter);
    } catch (err) {
      if (err instanceof AuthError) {
        onAuthError();
        return;
      }
      notifications.show({
        color: "red",
        title: "Sikertelen küldés",
        message: err instanceof Error ? err.message : "Ismeretlen hiba történt.",
      });
    } finally {
      setSending(null);
    }
  }

  function handleTestSend() {
    const email = testEmail.trim();
    if (!email) {
      notifications.show({
        color: "red",
        title: "Hiányzó email",
        message: "Add meg, hova menjen a teszt hírlevél.",
      });
      return;
    }
    void send(email);
  }

  function handleLiveSend() {
    const isAll = audience === "all";
    const countLine = recipientCount === null ? "" : ` Jelenleg ${recipientCount} címzett.`;
    const excludedLine =
      excluded.length > 0 ? ` ${excluded.length} cím kivételként kimarad.` : "";
    modals.openConfirmModal({
      title: isAll ? "Hírlevél küldése minden felhasználónak" : "Hírlevél küldése a feliratkozóknak",
      children: isAll
        ? `Ez azonnal kiküldi a hírlevelet MINDEN regisztrált felhasználónak, nem csak a feliratkozóknak.${countLine}${excludedLine} Ez a művelet nem vonható vissza. Biztosan folytatod?`
        : `Ez azonnal kiküldi a hírlevelet minden feliratkozott felhasználónak.${countLine}${excludedLine} Ez a művelet nem vonható vissza. Biztosan folytatod?`,
      labels: { confirm: isAll ? "Küldés mindenkinek" : "Küldés a feliratkozóknak", cancel: "Mégse" },
      confirmProps: { color: "red" },
      onConfirm: () => void send(""),
    });
  }

  return (
    <Stack gap="md">
      <TextInput
        label="Cím (opcionális)"
        description="A body fölött megjelenő fejléc. Ha üres, a tárgy jelenik meg helyette."
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
      />
      <TextInput
        label="Tárgy"
        description="Ez kerül az email subject mezőjébe."
        value={subject}
        onChange={(e) => setSubject(e.currentTarget.value)}
        required
      />

      <div>
        <RichTextEditor editor={editor}>
          <RichTextEditor.Toolbar sticky>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Underline />
              <RichTextEditor.Strikethrough />
            </RichTextEditor.ControlsGroup>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.H2 />
              <RichTextEditor.H3 />
            </RichTextEditor.ControlsGroup>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
            </RichTextEditor.ControlsGroup>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
            </RichTextEditor.ControlsGroup>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Undo />
              <RichTextEditor.Redo />
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>
          <RichTextEditor.Content mih={200} />
        </RichTextEditor>
      </div>

      <Group grow>
        <TextInput
          label="Gomb szövege (opcionális)"
          placeholder="Megnézem"
          value={ctaLabel}
          onChange={(e) => setCtaLabel(e.currentTarget.value)}
        />
        <TextInput
          label="Gomb link (opcionális)"
          placeholder="https://..."
          value={ctaUrl}
          onChange={(e) => setCtaUrl(e.currentTarget.value)}
        />
      </Group>

      <div>
        <Text size="sm" fw={500}>
          Célcsoport
        </Text>
        <SegmentedControl
          fullWidth
          mt={4}
          value={audience}
          onChange={(value) => setAudience(value as NewsletterAudience)}
          data={[
            { label: "Feliratkozók", value: "subscribers" },
            { label: "Minden regisztrált felhasználó", value: "all" },
          ]}
        />
        <Textarea
          mt="sm"
          label="Kivételek (opcionális)"
          description="Ezek a címek kimaradnak, bármit is mond a célcsoport. Vesszővel, pontosvesszővel vagy soronként."
          placeholder="valaki@pelda.hu, masik@pelda.hu"
          autosize
          minRows={2}
          maxRows={6}
          value={excludedText}
          onChange={(e) => setExcludedText(e.currentTarget.value)}
        />
        <Text size="sm" c={countError ? "red" : "dimmed"} mt={6}>
          {countError
            ? `Nem sikerült lekérdezni a címzettek számát: ${countError}`
            : recipientCount === null
              ? "Címzettek számolása…"
              : audience === "all"
                ? `Ez ${recipientCount} címzettnek megy ki: azok is megkapják, akik nem iratkoztak fel. A leiratkozottak és a meg nem erősített címek kimaradnak.${excludedSuffix}`
                : `Ez ${recipientCount} címzettnek megy ki: csak a hírlevélre feliratkozottaknak.${excludedSuffix}`}
        </Text>
      </div>

      <Group align="flex-end" justify="space-between" wrap="wrap">
        <TextInput
          label="Teszt címzett email"
          description="Csak erre a címre küldi ki, éles feliratkozók nem kapják meg."
          placeholder="te@pelda.hu"
          value={testEmail}
          onChange={(e) => setTestEmail(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <Group>
          <Button
            variant="light"
            onClick={handleTestSend}
            loading={sending === "test"}
            disabled={!canSubmit || sending !== null}
          >
            Teszt küldés
          </Button>
          <Button
            color="red"
            onClick={handleLiveSend}
            loading={sending === "live"}
            disabled={!canSubmit || sending !== null}
          >
            {audience === "all" ? "Küldés mindenkinek" : "Küldés a feliratkozóknak"}
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
