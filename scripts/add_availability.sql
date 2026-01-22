-- Add availability column
ALTER TABLE public.food_items 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;

-- Policy to allow admins to update availability 
-- (Assuming existing update policy covers it, but ensuring here)
-- You typically have a policy like "Admins can update food_items"
-- If not, ensure your app logic handles it (RLS might block if not set)

-- Ensure Orders are readable by admin (or everyone for now based on your simple setup)
-- If you need specific Admin Order viewing:
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'npalson@np.edu')); 
-- Note: Direct email check in policy is brittle, better to use a role or claim, but works for simple app.
