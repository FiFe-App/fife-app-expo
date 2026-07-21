import { Tables } from "@/database.types";

const getLinkForHelpContact = (contact: Tables<"help_contacts">): string => {
  if (contact.type === "TEL") return "tel:" + contact.data;
  if (contact.type === "PLACE")
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(contact.data);
  return "";
};

export default getLinkForHelpContact;
