-- Add pickup_time column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_time TEXT;
