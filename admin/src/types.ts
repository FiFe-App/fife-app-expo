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
  target_type: ReportTargetType;
  /** A jelentett üzenet / biznisz / komment id-ja; profilnál null. */
  target_id: string | null;
  /** A tartalom szövege a feljelentés pillanatában — törlés után is megmarad. */
  target_excerpt: string | null;
  /** Biznisz feljelentésnél maga a biznisz, kommentnél az, amelyik alatt a komment van. */
  buziness_id: number | null;
  buziness_title: string | null;
  /** A tartalom szerzője / a profil. Null, ha a fiókot azóta törölték. */
  reported_id: string | null;
  reported_name: string | null;
  reported_email: string | null;
  reported_bad_boy: boolean;
}

export type ReportTargetType = "profile" | "message" | "group_message" | "biznisz" | "comment";

export const REPORT_TARGETS: Record<ReportTargetType, string> = {
  profile: "Profil",
  message: "Üzenet",
  group_message: "Csoportüzenet",
  biznisz: "Biznisz",
  comment: "Komment",
};

export interface ReportFilters {
  reportedId: string | null;
  buzinessId: number | null;
  reason: string | null;
  targetType: ReportTargetType | null;
  page: number;
}

export interface AdminBuziness {
  id: number;
  title: string;
  description: string;
  created_at: string;
  public: boolean;
  ingyen: boolean;
  author_id: string;
  author_name: string | null;
  author_email: string | null;
  author_bad_boy: boolean;
  /** Magára a bizniszre érkezett feljelentések. */
  report_count: number;
  /** A biznisz alatti kommentekre érkezett feljelentések. */
  comment_report_count: number;
}

/** "true" / "false" csak azokat mutatja, "all" mindet. */
export type PublicFilter = "all" | "true" | "false";

export interface BuzinessFilters {
  search: string;
  reported: boolean;
  public: PublicFilter;
  page: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Ugyanazok az értékek, mint az app ReportContentModal-jában. */
export const REPORT_REASONS: Record<string, string> = {
  objectionable_content: "Sértő, bántó vagy zaklató tartalom",
  spam: "Spam vagy átverés",
  terms_violation: "Megszegte a feltételeket",
  not_trustworthy: "Nem megbízható",
  illegal_activity: "Illegális tevékenység",
  child_safety: "Gyermekbántalmazás / Kiskorú védelme",
  other: "Egyéb",
};

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
