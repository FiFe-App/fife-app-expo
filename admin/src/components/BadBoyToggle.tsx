import { useState } from "react";
import { Switch, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

import { AuthError, setBadBoy } from "../api";

interface Props {
  userId: string;
  name: string;
  value: boolean;
  onChange: (value: boolean) => void;
  onAuthError: () => void;
}

/**
 * Badboy kapcsoló megerősítéssel. A badboy csendben ki van zárva: csak a többi
 * badboyt látja, a rendes felhasználók pedig őt nem, és erről nem kap
 * értesítést. Ezért egy véletlen kattintás itt valódi kárt okoz.
 */
export function BadBoyToggle({ userId, name, value, onChange, onAuthError }: Props) {
  const [saving, setSaving] = useState(false);

  async function apply(next: boolean) {
    setSaving(true);
    try {
      const saved = await setBadBoy(userId, next);
      onChange(saved);
      notifications.show({
        color: saved ? "red" : "green",
        message: saved ? `${name} mostantól badboy.` : `${name} már nem badboy.`,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        onAuthError();
        return;
      }
      notifications.show({
        color: "red",
        title: "Nem sikerült menteni",
        message: err instanceof Error ? err.message : "Ismeretlen hiba történt.",
      });
    } finally {
      setSaving(false);
    }
  }

  function confirm() {
    const next = !value;
    modals.openConfirmModal({
      title: next ? "Badboy-já teszed?" : "Visszaállítod?",
      children: (
        <Text size="sm">
          {next
            ? `${name} ezentúl csak a többi badboyt és azok tartalmait látja, a rendes felhasználók pedig őt és a bizniszeit nem. Erről nem kap értesítést.`
            : `${name} újra rendes felhasználó lesz: látja a többieket, és őt is látják.`}
        </Text>
      ),
      labels: { confirm: next ? "Badboy-já teszem" : "Visszaállítom", cancel: "Mégse" },
      confirmProps: { color: next ? "red" : "green" },
      onConfirm: () => apply(next),
    });
  }

  return (
    <Switch
      checked={value}
      onChange={confirm}
      disabled={saving}
      color="red"
      aria-label={`${name} badboy`}
    />
  );
}
