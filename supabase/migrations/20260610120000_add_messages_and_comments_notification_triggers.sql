-- Add notification triggers for messages and comments tables.
-- Reuses existing trigger_notify_on_record_created() function.

-- Trigger on messages (new message → notify recipient)
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_on_record_created();

-- Trigger on comments (new comment → notify buziness owner)
DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_on_record_created();
