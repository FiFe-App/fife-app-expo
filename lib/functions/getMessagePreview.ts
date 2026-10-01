import { Tables } from "@/database.types";

/**
 * One-line preview of a message for reply quotes and the chat list. Image-only
 * messages have no text to show. With `otherUser` given (the 1:1 chat list),
 * my own messages get a "Te: " prefix.
 */
type Profile = Pick<Tables<"profiles">, "id">;
const getMessagePreview = (message: {
  author: string;
  text: string;
  image?: string | null;
  otherUser?: Pick<Profile, "id">;
}) =>
  (message.otherUser && message.author != message.otherUser.id ? "Te: " : "") +
  (message.text || (message.image ? "📷 Kép" : ""));

export default getMessagePreview;
