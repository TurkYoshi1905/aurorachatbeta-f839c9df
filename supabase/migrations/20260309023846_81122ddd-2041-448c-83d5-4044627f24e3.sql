
-- Fix permissive INSERT policy on notifications - restrict to authenticated users inserting for others (needed for mention notifications)
DROP POLICY "Users can insert notifications" ON notifications;
CREATE POLICY "Authenticated users can insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
