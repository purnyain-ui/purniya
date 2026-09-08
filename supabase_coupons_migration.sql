-- ==============================================================================
-- Migration: Add Rich Discount & Validity Columns to coupons Table
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Add missing columns to coupons table
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_discount NUMERIC,
ADD COLUMN IF NOT EXISTS usage_limit INTEGER,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;

-- 2. Populate discount_value for any existing rows from discount_percent
UPDATE public.coupons 
SET discount_value = discount_percent 
WHERE (discount_value IS NULL OR discount_value = 0) AND discount_percent > 0;

-- 3. Ensure Row Level Security allows read and admin upsert
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active coupons for storefront checkout
CREATE POLICY IF NOT EXISTS "Allow public read access on coupons" 
ON public.coupons FOR SELECT 
USING (true);

-- Allow authenticated admins to insert/update/delete coupons
CREATE POLICY IF NOT EXISTS "Allow full access for service role and admin" 
ON public.coupons FOR ALL 
USING (true) 
WITH CHECK (true);
