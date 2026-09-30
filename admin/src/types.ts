export type NewsletterStatus = "pending" | "sending" | "sent" | "failed";

/**
 * Kinek megy ki. A "subscribers" a hírlevélre feliratkozottak (alapértelmezés),
 * az "all" minden regisztrált felhasználó, megerősített email címmel. A
 * leiratkozottak mindkettőből kimaradnak.
 */
export type NewsletterAudience = "subscribers" | "all";

export interface Newsletter {
  id: number;
  created_at: string;
  subject: string;
  title: string | null;
  cta_label: string | null;
  cta_url: string | null;
  recipients: string[] | null;
  excluded: string[] | null;
  audience: NewsletterAudience;
  status: NewsletterStatus;
  sent_count: number;
  failed_count: number;
  error: string | null;
  sent_at: string | null;
}

export interface NewsletterInput {
  subject: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  testEmail: string;
  audience: NewsletterAudience;
  /** Ezek a címek kimaradnak, bármit is mond a célcsoport. */
  excluded: string[];
}

export interface AdminUser {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  registered_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  bad_boy: boolean;
  report_count: number;
  buziness_count: number;
}

/** "true" / "false" csak azokat mutatja, "all" mindenkit. */
export type BadBoyFilter = "all" | "true" | "false";

export interface UserFilters {
  search: string;
  badBoy: BadBoyFilter;
  reported: boolean;
  page: number;
}

export interface AdminReport {
  id: number;
  created_at: string;
  reason: string;
  description: string;
  author_id: string;
  author_name: string | null;
  author_email: string | null;
  reported_id: string;
  reported_name: string | null;
  reported_email: string | null;
  reported_bad_boy: boolean;
}

export interface ReportFilters {
  reportedId: string | null;
  reason: string | null;
  page: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Ugyanazok az értékek, mint az app ReportProfileModal-jában. */
export const REPORT_REASONS: Record<string, string> = {
  terms_violation: "Megszegte a feltételeket",
  not_trustworthy: "Nem megbízható",
  illegal_activity: "Illegális tevékenység",
  child_safety: "Gyermekbántalmazás / Kiskorú védelme",
  other: "Egyéb",
};
