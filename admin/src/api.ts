import type {
  AdminReport,
  AdminUser,
  Newsletter,
  NewsletterAudience,
  NewsletterInput,
  Page,
  ReportFilters,
  UserFilters,
} from "./types";

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

/**
 * Hány címzettnek menne ki egy most indított élesküldés — a célcsoport és a
 * kivételek együtt. POST, mert a kivételek listája hosszú lehet; ettől még nem
 * ír semmit, a `count` paraméter dönti el, hogy nem létrehozás.
 */
export async function fetchRecipientCount(
  audience: NewsletterAudience,
  excluded: string[],
): Promise<number> {
  const res = await fetch(`/api/newsletters?count=${audience}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ excluded }),
  });
  if (res.status === 401) throw new AuthError();
  if (!res.ok) throw new Error(await parseErrorBody(res));
  const data = await res.json();
  return data.count as number;
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

export async function fetchUsers(filters: UserFilters): Promise<Page<AdminUser>> {
  const params = new URLSearchParams({ page: String(filters.page) });
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.badBoy !== "all") params.set("badBoy", filters.badBoy);
  if (filters.reported) params.set("reported", "true");

  const res = await fetch(`/api/users?${params}`, { credentials: "same-origin" });
  if (res.status === 401) throw new AuthError();
  if (!res.ok) throw new Error(await parseErrorBody(res));
  const data = await res.json();
  return { items: data.users, total: data.total, page: data.page, pageSize: data.pageSize };
}

export async function setBadBoy(id: string, badBoy: boolean): Promise<boolean> {
  const res = await fetch("/api/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ id, badBoy }),
  });
  if (res.status === 401) throw new AuthError();
  if (!res.ok) throw new Error(await parseErrorBody(res));
  const data = await res.json();
  return Boolean(data.bad_boy);
}

export async function fetchReports(filters: ReportFilters): Promise<Page<AdminReport>> {
  const params = new URLSearchParams({ page: String(filters.page) });
  if (filters.reportedId) params.set("reportedId", filters.reportedId);
  if (filters.reason) params.set("reason", filters.reason);

  const res = await fetch(`/api/reports?${params}`, { credentials: "same-origin" });
  if (res.status === 401) throw new AuthError();
  if (!res.ok) throw new Error(await parseErrorBody(res));
  const data = await res.json();
  return { items: data.reports, total: data.total, page: data.page, pageSize: data.pageSize };
}
