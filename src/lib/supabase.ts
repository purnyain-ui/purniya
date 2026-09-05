import { createClient } from '@supabase/supabase-js';
import { Product, CategoryMeta, Order } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bhzjtyyxgtoasvpbvfsn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoemp0eXl4Z3RvYXN2cGJ2ZnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTU5NzIsImV4cCI6MjEwNDE5MTk3Mn0.6zBYhb5Cyjvywo8cp7e_Aik_a9kDIhzluzPl_uDNpsU';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey &&
  supabaseAnonKey.length > 20
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Health check to verify connection to Supabase cloud
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  projectRef: string;
  tablesFound?: string[];
}> {
  if (!isSupabaseConfigured) {
    return {
      connected: false,
      message: 'Supabase environment credentials not configured.',
      projectRef: '',
    };
  }

  try {
    // Check auth endpoint health
    const { error } = await supabase.auth.getSession();
    if (error) {
      return {
        connected: false,
        message: `Auth check failed: ${error.message}`,
        projectRef: 'bhzjtyyxgtoasvpbvfsn',
      };
    }

    // Probe tables
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    const tablesFound: string[] = [];
    if (!prodError) {
      tablesFound.push('products');
    }

    return {
      connected: true,
      message: prodError
        ? `Connected to Supabase Cloud! (Schema pending creation: ${prodError.message})`
        : 'Connected to Supabase Cloud with live schema!',
      projectRef: 'bhzjtyyxgtoasvpbvfsn',
      tablesFound,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Failed to connect to Supabase.',
      projectRef: 'bhzjtyyxgtoasvpbvfsn',
    };
  }
}

/**
 * Fetch products from Supabase
 */
export async function getProductsFromSupabase(): Promise<Product[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }
    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      categorySlug: p.categorySlug || p.category_slug,
      subcategory: p.subcategory || '',
      price: Number(p.price),
      originalPrice: p.originalPrice || p.original_price ? Number(p.originalPrice || p.original_price) : undefined,
      image: p.image || (Array.isArray(p.images) && p.images[0]) || '',
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image || ''],
      rating: p.rating ? Number(p.rating) : 4.9,
      reviewsCount: p.reviewsCount || p.reviews_count || 0,
      description: p.description || '',
      stock: p.stock !== undefined ? Number(p.stock) : 50,
      status: p.status || 'Active',
      badge: p.badge || undefined,
      featured: Boolean(p.featured),
      createdAt: p.created_at || p.createdAt,
    })) as Product[];
  } catch (err) {
    console.warn('Supabase getProducts error:', err);
    return null;
  }
}

/**
 * Fetch categories from Supabase
 */
export async function getCategoriesFromSupabase(): Promise<CategoryMeta[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }
    return data.map((c: any) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle || '',
      heroImage: c.heroImage || c.hero_image || '',
      bannerImage: c.bannerImage || c.banner_image || '',
      subcategories: c.subcategories || ['All'],
      subcatImages: c.subcatImages || c.subcat_images || [],
    })) as CategoryMeta[];
  } catch (err) {
    console.warn('Supabase getCategories error:', err);
    return null;
  }
}

/**
 * Save new order to Supabase
 */
export async function saveOrderToSupabase(order: Order): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('orders').insert([
      {
        id: order.id,
        customer_name: order.customer.name,
        customer_email: order.customer.email,
        customer_phone: order.customer.phone,
        total: order.total,
        status: order.status,
        tracking_number: order.trackingNumber,
        courier: order.courierPartner || 'BlueDart Express',
        items: order.items,
        shipping_address: order.shippingAddress,
        payment_method: order.paymentMethod,
        created_at: order.date,
      },
    ]);

    if (error) {
      console.warn('Supabase order insert error (will use local store):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase saveOrder exception:', err);
    return false;
  }
}

/**
 * Seed initial catalog to Supabase
 */
export async function seedCatalogToSupabase(
  categories: CategoryMeta[],
  products: Product[]
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Insert categories
    const { error: catError } = await supabase
      .from('categories')
      .upsert(
        categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          subtitle: c.subtitle,
          hero_image: c.heroImage,
          banner_image: c.bannerImage,
          subcategories: c.subcategories,
          subcat_images: c.subcatImages,
        })),
        { onConflict: 'slug' }
      );

    if (catError) {
      return {
        success: false,
        message: `Category upsert failed: ${catError.message}. Make sure SQL schema is executed first.`,
      };
    }

    // 2. Insert products
    const { error: prodError } = await supabase
      .from('products')
      .upsert(
        products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          category_slug: p.categorySlug,
          subcategory: p.subcategory,
          price: p.price,
          original_price: p.originalPrice || null,
          image: p.image,
          images: p.images || [p.image],
          rating: p.rating || 4.9,
          reviews_count: p.reviewsCount || 0,
          description: p.description || '',
          stock: p.stock,
          status: p.status,
          badge: p.badge || null,
          featured: Boolean(p.featured),
        })),
        { onConflict: 'id' }
      );

    if (prodError) {
      return {
        success: false,
        message: `Products upsert failed: ${prodError.message}. Make sure SQL schema is executed first.`,
      };
    }

    return {
      success: true,
      message: `Successfully synced ${categories.length} categories and ${products.length} products to Supabase!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to seed catalog to Supabase.',
    };
  }
}
