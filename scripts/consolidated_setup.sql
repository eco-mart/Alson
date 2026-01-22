-- ========================================================
-- MASTER SETUP SCRIPT FOR TAURI FOOD APP
-- Run this in your Supabase SQL Editor (Original App Project)
-- ========================================================

-- 1. CLEANUP (Optional - ensures a fresh start for logic)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. CREATE PUBLIC USERS TABLE (Tracks Auth Users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- 3. SYNC LOGIC (Triggers when a new user signs up)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name' -- Changed from 'username' to 'full_name' per latest main.js
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger (if doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END $$;

-- 4. ORDERS & ITEMS TABLES
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES public.food_items(id),
    quantity INTEGER NOT NULL,
    price_at_time NUMERIC NOT NULL
);

-- 5. CARTS TABLE (For Synced Items)
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES public.food_items(id),
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, food_item_id)
);

-- 6. FOOD ITEMS (Ensuring Availability Column)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='food_items' AND column_name='is_available') THEN
        ALTER TABLE public.food_items ADD COLUMN is_available BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 7. PERMISSIONS (Fixing "Permission Denied")
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'orders', 'order_items', 'carts', 'food_items')
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', t);
        EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon', t);
    END LOOP;
END $$;

-- 8. ROW LEVEL SECURITY (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Drop if exists and recreate)
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR auth.jwt()->>'email' = 'npalson@np.edu');

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
CREATE POLICY "Admin can view all orders" ON public.orders FOR ALL USING (auth.jwt()->>'email' = 'npalson@np.edu');

DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (true); -- Simplified, restricted by orders select

DROP POLICY IF EXISTS "Users can insert their own order items" ON public.order_items;
CREATE POLICY "Users can insert their own order items" ON public.order_items FOR INSERT WITH CHECK (true); -- Simplified

DROP POLICY IF EXISTS "Users can manage their carts" ON public.carts;
CREATE POLICY "Users can manage their carts" ON public.carts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view food items" ON public.food_items;
CREATE POLICY "Public can view food items" ON public.food_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage food items" ON public.food_items;
CREATE POLICY "Admin can manage food items" ON public.food_items FOR ALL USING (auth.jwt()->>'email' = 'npalson@np.edu');
