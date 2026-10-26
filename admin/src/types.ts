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

/** Az appban megjelenő üzenet — a legújabb sor látszik. */
export interface InAppMessage {
  id: number;
  created_at: string;
  icon: string | null;
  /** Az app fejlécében az ablakot megnyitó menüpont ikonja. */
  open_icon: string | null;
  title: string;
  body: string;
  primary_label: string | null;
  primary_url: string | null;
  secondary_label: string | null;
  secondary_url: string | null;
}

export interface InAppMessageInput {
  icon: string;
  openIcon: string;
  title: string;
  body: string;
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel: string;
  secondaryUrl: string;
}
