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
}
