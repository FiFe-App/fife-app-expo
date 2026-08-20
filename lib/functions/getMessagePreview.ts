/**
 * One-line preview of a message for reply quotes and the chat list. Image-only
 * messages have no text to show.
 */
const getMessagePreview = (message: {
  text: string;
  image?: string | null;
}) => message.text || (message.image ? "📷 Kép" : "");

export default getMessagePreview;
