import { Tables } from "@/database.types";
import { Href } from "expo-router";

const getLinkForContact = (
  contact: Tables<"contacts">,
  edit?: boolean,
): Href<string> => {
  if (edit)
    return {
      pathname: "/contact-edit/[editId]",
      params: { editId: contact.id },
    };
  if (contact.type === "EMAIL") return "mailto:" + contact.data;
  if (contact.type === "TEL") return "tel:" + contact.data;
  if (contact.type === "INSTAGRAM")
    return "https://instagram.com/" + contact.data;
  if (contact.type === "FACEBOOK")
    return "https://facebook.com/" + contact.data;
  if (contact.type === "WEB") return "https://" + contact.data;
  return "";
};

export default getLinkForContact;
