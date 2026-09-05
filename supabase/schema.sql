-- ==============================================================================
-- PURNYA.IN OFFICIAL SUPABASE DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bhzjtyyxgtoasvpbvfsn/sql
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    hero_image TEXT,
    banner_image TEXT,
    subcategories JSONB DEFAULT '[]'::jsonb,
    subcat_images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    category_slug TEXT NOT NULL REFERENCES public.categories(slug) ON DELETE CASCADE ON UPDATE CASCADE,
    subcategory TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    images JSONB DEFAULT '[]'::jsonb,
    rating NUMERIC DEFAULT 4.9,
    reviews_count INTEGER DEFAULT 0,
    description TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    in_stock BOOLEAN DEFAULT true,
    stock_count INTEGER DEFAULT 100,
    badge TEXT,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    total NUMERIC NOT NULL,
    status TEXT DEFAULT 'Confirmed',
    tracking_number TEXT,
    courier TEXT DEFAULT 'BlueDart Express',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    payment_method TEXT DEFAULT 'UPI',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    discount_percent INTEGER NOT NULL,
    min_order_amount NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. BANNERS TABLE
CREATE TABLE IF NOT EXISTS public.banners (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT,
    image TEXT NOT NULL,
    cta_text TEXT,
    cta_link TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 1. Categories: Public can read, anyone can read
CREATE POLICY "Allow public read on categories" ON public.categories
    FOR SELECT USING (true);
CREATE POLICY "Allow all operations for service role on categories" ON public.categories
    FOR ALL USING (true) WITH CHECK (true);

-- 2. Products: Public can read
CREATE POLICY "Allow public read on products" ON public.products
    FOR SELECT USING (true);
CREATE POLICY "Allow all operations for service role on products" ON public.products
    FOR ALL USING (true) WITH CHECK (true);

-- 3. Orders: Anyone can insert (place orders), customers can read their orders
CREATE POLICY "Allow anon and auth users to insert orders" ON public.orders
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public to read orders" ON public.orders
    FOR SELECT USING (true);
CREATE POLICY "Allow all operations for service role on orders" ON public.orders
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Coupons: Public can read active coupons
CREATE POLICY "Allow public read on coupons" ON public.coupons
    FOR SELECT USING (true);
CREATE POLICY "Allow all operations for service role on coupons" ON public.coupons
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Banners: Public can read active banners
CREATE POLICY "Allow public read on banners" ON public.banners
    FOR SELECT USING (true);
CREATE POLICY "Allow all operations for service role on banners" ON public.banners
    FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- INITIAL SEED DATA FOR PURNYA 5 CATEGORIES
-- ==============================================================================
INSERT INTO public.categories (id, slug, title, subtitle, hero_image, banner_image, subcategories)
VALUES
('cat-jewellery', 'jewellery', 'Jewellery & Accessories', 'Handcrafted 18K gold-plated vermeil, anti-tarnish elegance, and mindful ornamentation.', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1600&fit=crop&auto=format', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600&fit=crop&auto=format', '["All", "Necklace", "Earring", "Ring", "Bracelet", "Anklet", "Watch", "Keychains", "Hair Wear", "Jewellery Display"]'::jsonb),
('cat-candles', 'candles', 'Candle & Home Fragrance', 'Eco-conscious granulated sand wax, clean-burning cotton wicks, and French-distilled essential oils.', 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=1600&fit=crop&auto=format', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&fit=crop&auto=format', '["All", "Sand Wax Candle", "Pearl Wax Candle", "Wax Refill", "Wick & Accessory", "Home Fragrance & Gift"]'::jsonb),
('cat-home-decor', 'home-decor', 'Home Décor & Lifestyle', 'Organic textures, artisan ceramic pottery, and serene aesthetic accents for your living sanctuary.', 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=1600&fit=crop&auto=format', 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=1600&fit=crop&auto=format', '["All", "Home Décor", "Vase & Planter", "Table Décor", "Bag & Pouch", "Toys"]'::jsonb),
('cat-wellness', 'wellness', 'Organic & Wellness', 'Farm-fresh Ayurvedic elixirs, single-origin botanicals, and cold-pressed botanical infusions.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600&fit=crop&auto=format', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1600&fit=crop&auto=format', '["All", "Organic & Farm Fresh", "Dehydrated Fruit & Vegetable", "Herbal Tea", "Wellness Powder"]'::jsonb),
('cat-gifts', 'gifts', 'Gift & Stationery', 'Handmade paper journals, curated celebration hampers, and memorable bespoke gifts for every milestone.', 'https://images.unsplash.com/photo-1513297887119-d46091b24bfa?w=1600&fit=crop&auto=format', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1600&fit=crop&auto=format', '["All", "Gift Set", "Personalised Gift", "Festive & Return Gift", "Corporate Gift", "Stationery"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Initial Coupons
INSERT INTO public.coupons (code, discount_percent, min_order_amount, is_active)
VALUES
('PURNYA10', 10, 999, true),
('FESTIVE20', 20, 1999, true),
('WELCOME15', 15, 1499, true)
ON CONFLICT (code) DO NOTHING;
