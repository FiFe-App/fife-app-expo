import type { Newsletter, NewsletterInput } from "./types";

export class AuthError extends Error {}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.error === "string") return data.error;
  } catch {
    // no-op — nem volt JSON body
  }
  return "Ismeretlen hiba történt.";
}

export async function login(password: string): Promise<void> {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(await parseErrorBody(res));
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
}

export async function fetchSession(): Promise<boolean> {
  const res = await fetch("/api/session", { credentials: "same-origin" });
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data.authenticated);
}

export async function fetchNewsletters(): Promise<Newsletter[]> {
  const res = await fetch("/api/newsletters", { credentials: "same-origin" });
  if (res.status === 401) throw new AuthError();
  if (!res.ok) throw new Error(await parseErrorBody(res));
  const data = await res.json();
  return data.newsletters as Newsletter[];
}

export async function createNewsletter(input: NewsletterInput): Promise<Newsletter> {
  const res = await fetch("/api/newsletters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  if (res.status === 401) throw new AuthError();
  if (!res.ok) throw new Error(await parseErrorBody(res));
  const data = await res.json();
  return data.newsletter as Newsletter;
}
