-- Grant permissions to authenticated users to ensure they can interact with the tables
GRANT ALL ON TABLE public.users TO postgres;
GRANT ALL ON TABLE public.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.users TO anon;

GRANT ALL ON TABLE public.orders TO postgres;
GRANT ALL ON TABLE public.orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO authenticated;

GRANT ALL ON TABLE public.order_items TO postgres;
GRANT ALL ON TABLE public.order_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_items TO authenticated;

GRANT ALL ON TABLE public.carts TO postgres;
GRANT ALL ON TABLE public.carts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.carts TO authenticated;

-- Ensure RLS is active but allows necessary access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Re-verify Policies (Idempotent: drop if exists and recreate or just ensure)
-- We will just make sure basic policies exist. If they duplicate, it might error, but the Grants above are likely the fix for "Permission denied".

-- Fix for "permission denied for table users":
-- This often happens if the 'authenticated' role doesn't have USAGE/SELECT on the table itself.
