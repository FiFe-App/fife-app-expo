-- Add RLS policies for messages table to enable chat functionality

-- Allow users to view messages where they are either the sender or recipient
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = author OR auth.uid() = "to"::uuid
);

-- Allow users to insert messages where they are the sender
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author
);

-- Allow users to delete their own sent messages
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (
  auth.uid() = author
);
