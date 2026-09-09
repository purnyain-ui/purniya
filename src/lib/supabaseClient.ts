// lib/supabaseClient.ts
import { supabase as configuredSupabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase =
  configuredSupabase ||
  (supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as any));

export const CATEGORY_IMAGES_BUCKET = 'category-images';
export const PRODUCT_IMAGES_BUCKET = 'product-images';