-- Run this in your ORIGINAL App Supabase SQL Editor to fix the 500 Error

-- Drop the trigger that is trying to write to the missing table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop the table if it exists (partial cleanup)
DROP TABLE IF EXISTS public.users;
