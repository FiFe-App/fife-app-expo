import { Tables } from "@/database.types";

/**
 * Expands a single help_contacts row (one organization) into the
 * Tables<"contacts">-shaped list that ContactsCard renders, one entry per
 * available contact method (phone / website / place / linked buziness).
 * The synthesized rows are display-only — author is left blank since these
 * entries are not owned by any user.
 */
export default function helpContactToContacts(
  helpContact: Tables<"help_contacts">,
): Tables<"contacts">[] {
  const base = { author: "", created_at: helpContact.created_at, public: true };
  const contacts: Tables<"contacts">[] = [];

  if (helpContact.tel) {
    contacts.push({ ...base, id: helpContact.id * 10 + 1, type: "TEL", data: helpContact.tel, title: "Telefon" });
  }
  if (helpContact.web) {
    contacts.push({ ...base, id: helpContact.id * 10 + 2, type: "WEB", data: helpContact.web, title: "Weboldal" });
  }
  if (helpContact.place) {
    contacts.push({ ...base, id: helpContact.id * 10 + 3, type: "PLACE", data: helpContact.place, title: "Cím" });
  }
  if (helpContact.buziness_id != null) {
    contacts.push({ ...base, id: helpContact.id * 10 + 4, type: "BUZINESS", data: String(helpContact.buziness_id), title: "Kapcsolódó biznisz" });
  }

  return contacts;
}
