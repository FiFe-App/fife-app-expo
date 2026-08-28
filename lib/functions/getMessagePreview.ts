import { Tables } from "@/database.types";

/**
 * One-line preview of a message for reply quotes and the chat list. Image-only
 * messages have no text to show.
 */
type Profile = Tables<"profiles">;
const getMessagePreview = (message: {
  author: string;
  created_at: string;
  id: number;
  image: string | null;
  reply_to: number | null;
  text: string;
  to: string | null;
  otherUser: Profile;
}) => (message.author != message.otherUser.id ? "Te: ":"") + (message.text || (message.image ? "📷 Kép" : ""));

export default getMessagePreview;
