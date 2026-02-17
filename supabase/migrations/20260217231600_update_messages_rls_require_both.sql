-- Update RLS policies to require both users have MESSAGE contact type enabled

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- Allow users to view messages where they are either the sender or recipient
-- AND both users have MESSAGE contact enabled
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  (auth.uid() = author OR auth.uid() = "to"::uuid)
  AND EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE author = messages.author 
    AND type = 'MESSAGE' 
    AND data != ''
  )
  AND EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE author = messages."to" 
    AND type = 'MESSAGE' 
    AND data != ''
  )
);

-- Allow users to insert messages only if both sender and recipient have MESSAGE enabled
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author
  AND EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE author = messages.author 
    AND type = 'MESSAGE' 
    AND data != ''
  )
  AND EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE author = messages."to" 
    AND type = 'MESSAGE' 
    AND data != ''
  )
);

-- Allow users to delete their own sent messages
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (
  auth.uid() = author
);
