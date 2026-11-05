import { Tables } from "@/database.types";
import { Href } from "expo-router";

const getLinkForContact = (
  contact: Tables<"contacts">,
  edit?: boolean,
): Href => {
  if (contact.type === "EMAIL") return `mailto:${contact.data}`;
  if (contact.type === "TEL") return `tel:${contact.data}`;
  if (contact.type === "INSTAGRAM")
    return `https://instagram.com/${contact.data}`;
  if (contact.type === "FACEBOOK")
    return `https://facebook.com/${contact.data}`;
  if (contact.type === "WEB") return `https://${contact.data}`;
  if (contact.type === "MESSAGE") return { pathname: "/chat/[uid]", params: { uid: contact.author } };
  return "" as Href;
};

export default getLinkForContact;
