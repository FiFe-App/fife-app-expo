-- Add notification trigger for the comments table so users get notified
-- when someone comments on their buziness.

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_on_record_created();
