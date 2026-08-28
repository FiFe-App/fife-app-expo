import { useState } from "react";
import { Button, Group, Stack, TextInput } from "@mantine/core";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

import { AuthError, createNewsletter } from "../api";
import type { Newsletter } from "../types";

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

  const editor = useEditor({
    extensions: [StarterKit, Underline, Link],
    content: "",
  });

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
      });
      notifications.show({
        color: "green",
        title: mode === "test" ? "Teszt hírlevél kiküldve" : "Hírlevél kiküldve",
        message:
          mode === "test"
            ? `Elment a(z) ${recipientOverride} címre.`
            : "A hírlevél elindult a feliratkozóknak.",
      });
      setTitle("");
      setSubject("");
      setCtaLabel("");
      setCtaUrl("");
      setTestEmail("");
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
    modals.openConfirmModal({
      title: "Hírlevél küldése mindenkinek",
      children:
        "Ez azonnal kiküldi a hírlevelet minden feliratkozott felhasználónak. Ez a művelet nem vonható vissza. Biztosan folytatod?",
      labels: { confirm: "Küldés mindenkinek", cancel: "Mégse" },
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
            Küldés mindenkinek
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
