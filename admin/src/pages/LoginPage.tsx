import { useState } from "react";
import { Alert, Button, Center, Paper, PasswordInput, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

import { login } from "../api";

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(password);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sikertelen bejelentkezés.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Center h="100vh" bg="#fff5e0">
      <Paper component="form" onSubmit={handleSubmit} withBorder shadow="md" radius="lg" p="xl" w={360}>
        <Stack gap="md">
          <div>
            <Title order={2}>FiFe Admin</Title>
            <Text c="dimmed" size="sm">
              Hírlevelek küldése és nyomon követése
            </Text>
          </div>

          {error && (
            <Alert color="red" icon={<IconAlertCircle size={18} />}>
              {error}
            </Alert>
          )}

          <PasswordInput
            label="Jelszó"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            autoFocus
            required
          />

          <Button type="submit" loading={loading} fullWidth>
            Belépés
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
