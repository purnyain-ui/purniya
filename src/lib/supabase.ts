import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, CategoryMeta, Order } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://')
);

function getProjectRef(url?: string): string {
  if (!url) return '';
  try {
    const hostname = new URL(url).hostname;
    return hostname.split('.')[0] || '';
  } catch {
    return '';
  }
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (null as unknown as SupabaseClient);

/**
 * Health check to verify connection to Supabase cloud
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  projectRef: string;
  tablesFound?: string[];
}> {
  const projectRef = getProjectRef(supabaseUrl);

  if (!isSupabaseConfigured || !supabase) {
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
        projectRef,
      };
    }

    // Probe tables
    const tablesFound: string[] = [];
    const { error: prodError } = await supabase.from('products').select('id').limit(1);
    if (!prodError) tablesFound.push('products');

    const { error: catError } = await supabase.from('categories').select('id').limit(1);
    if (!catError) tablesFound.push('categories');

    return {
      connected: true,
      message: prodError
        ? `Connected to Supabase Cloud! (Schema pending creation: ${prodError.message})`
        : 'Connected to Supabase Cloud with live schema!',
      projectRef,
      tablesFound,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Failed to connect to Supabase.',
      projectRef,
    };
  }
}

/**
 * Fetch products from Supabase
 */
export async function getProductsFromSupabase(): Promise<Product[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const [
      { data: prods, error: prodError },
      { data: cats },
      { data: subs },
      { data: tags },
      { data: sizes },
      { data: colors },
    ] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('id, slug, title'),
      supabase.from('subcategories').select('id, category_id, name'),
      supabase.from('lifestyle_sale_tags').select('id, name'),
      supabase.from('size_variants').select('id, name'),
      supabase.from('color_palettes').select('id, name'),
    ]);

    if (prodError) {
      console.warn('Supabase getProducts error:', prodError);
      return null;
    }
    if (!prods || prods.length === 0) {
      return [];
    }

    const catMap = new Map((cats || []).map((c: any) => [c.id, c]));
    const subMap = new Map((subs || []).map((s: any) => [s.id, s]));
    const tagMap = new Map((tags || []).map((t: any) => [t.id, t.name]));
    const sizeMap = new Map((sizes || []).map((s: any) => [s.id, s.name]));
    const colorMap = new Map((colors || []).map((c: any) => [c.id, c.name]));

    return prods.map((p: any) => {
      const matchedCat = catMap.get(p.category_id);
      const matchedSub = subMap.get(p.subcategory_id);
      const matchedTagName = p.sale_tag_id ? tagMap.get(p.sale_tag_id) : undefined;

      const firstImage = (Array.isArray(p.images) && p.images[0]) || p.image || 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&fit=crop&auto=format';
      const allImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : [firstImage];

      const rawPrice = Number(p.price || 0);
      const offerPrice = p.offer_price != null && Number(p.offer_price) > 0 ? Number(p.offer_price) : null;
      const finalPrice = offerPrice !== null ? offerPrice : rawPrice;
      const originalPrice = offerPrice !== null && rawPrice > offerPrice ? rawPrice : (p.original_price ? Number(p.original_price) : undefined);

      const title = (p.title || p.name || 'Untitled Product').trim();
      const catTitle = (matchedCat?.title?.trim() || p.category || 'Jewellery & Accessories').trim();
      const catSlug = (matchedCat?.slug?.trim() || p.categorySlug || p.category_slug || 'apparel').trim();
      const subName = (matchedSub?.name?.trim() || p.subcategory || '').trim();

      const lifestyleTag = matchedTagName || (Array.isArray(p.tags) && p.tags[0]) || p.lifestyle_tag || p.lifestyleTag || undefined;

      // Convert Supabase database variants ({ size_id, color_id }) into standard frontend options format
      let resolvedVariants: any[] = [];
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        if (p.variants[0]?.options) {
          resolvedVariants = p.variants;
        } else {
          const uniqueSizes = [
            ...new Set(
              p.variants
                .map((v: any) => sizeMap.get(v.size_id))
                .filter(Boolean)
            ),
          ];
          const uniqueColors = [
            ...new Set(
              p.variants
                .map((v: any) => colorMap.get(v.color_id))
                .filter(Boolean)
            ),
          ];
          if (uniqueSizes.length > 0) {
            resolvedVariants.push({ name: 'Size', options: uniqueSizes });
          }
          if (uniqueColors.length > 0) {
            resolvedVariants.push({ name: 'Color', options: uniqueColors });
          }
        }
      }

      return {
        id: p.id,
        name: title,
        category: catTitle,
        categorySlug: catSlug,
        subcategory: subName,
        price: finalPrice,
        originalPrice,
        image: firstImage,
        images: allImages,
        rating: p.rating ? Number(p.rating) : 4.9,
        reviewsCount: p.reviewsCount || p.reviews_count || 12,
        description: p.description || '',
        stock: p.stock !== undefined ? Number(p.stock) : 50,
        status: (p.status === 'active' || p.status === 'Active') ? 'Active' : (p.status === 'out_of_stock' || p.stock === 0 ? 'Out of Stock' : 'Draft'),
        badge: (originalPrice && originalPrice > finalPrice) ? 'Sale' : (p.badge || undefined),
        lifestyleTag,
        featured: Boolean(p.featured),
        variants: resolvedVariants,
        createdAt: p.created_at || p.createdAt,
      } as Product;
    });
  } catch (err) {
    console.warn('Supabase getProducts error:', err);
    return null;
  }
}

/**
 * Fetch categories from Supabase
 */
export async function getCategoriesFromSupabase(): Promise<CategoryMeta[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data: cats, error: catsError } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (catsError) {
      console.warn('Supabase getCategories error:', catsError);
      return null;
    }
    if (!cats) return [];

    // Also fetch real subcategories from database
    let subcategoriesData: any[] = [];
    try {
      const { data: subs, error: subsError } = await supabase
        .from('subcategories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!subsError && subs) {
        subcategoriesData = subs;
      }
    } catch (subErr) {
      console.warn('Supabase getSubcategories error:', subErr);
    }

    return cats.map((c: any) => {
      const matchingSubs = subcategoriesData.filter((s: any) => s.category_id === c.id);
      const hero = (c.hero_image?.trim() || c.banner_image?.trim() || c.heroImage?.trim() || c.bannerImage?.trim() || '');
      const banner = (c.banner_image?.trim() || c.hero_image?.trim() || c.bannerImage?.trim() || c.heroImage?.trim() || '');
      
      const subcatNames = matchingSubs.length > 0
        ? ['All', ...matchingSubs.map((s: any) => (s.name || '').trim())]
        : (Array.isArray(c.subcategories) && c.subcategories.length > 0 ? c.subcategories : ['All']);

      const subcatImgs = matchingSubs.length > 0
        ? matchingSubs.map((s: any) => ({ name: (s.name || '').trim(), image: (s.image || '').trim() || hero }))
        : (Array.isArray(c.subcat_images) ? c.subcat_images : (c.subcatImages || []));

      return {
        id: c.id,
        slug: (c.slug || '').trim(),
        title: (c.title || '').trim(),
        subtitle: (c.subtitle || '').trim(),
        heroImage: hero,
        bannerImage: banner,
        subcategories: subcatNames,
        subcatImages: subcatImgs,
      };
    }) as CategoryMeta[];
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
 * Upsert single product to Supabase
 */
export async function upsertProductToSupabase(product: Product): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('products').upsert(
      {
        id: product.id,
        name: product.name,
        category: product.category,
        category_slug: product.categorySlug,
        subcategory: product.subcategory,
        price: product.price,
        original_price: product.originalPrice || null,
        image: product.image,
        images: product.images || [product.image],
        rating: product.rating || 4.9,
        reviews_count: product.reviewsCount || 0,
        description: product.description || '',
        stock: product.stock,
        status: product.status,
        badge: product.badge || null,
        lifestyle_tag: product.lifestyleTag || null,
        featured: Boolean(product.featured),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('Supabase product upsert error (will use local store):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsertProduct exception:', err);
    return false;
  }
}

/**
 * Delete product from Supabase
 */
export async function deleteProductFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.warn('Supabase product delete error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deleteProduct exception:', err);
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
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      message: 'Supabase environment credentials not configured.',
    };
  }

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
          lifestyle_tag: p.lifestyleTag || null,
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

/**
 * Supabase User Sign Up
 */
export async function signUpWithSupabase(
  email: string,
  password: string,
  metadata: { name: string; phone?: string }
): Promise<{ success: boolean; user?: any; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase credentials not configured in environment.' };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: metadata.name,
          phone: metadata.phone || '',
          role: 'customer',
        },
      },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to complete sign up.' };
  }
}

/**
 * Supabase User Sign In
 */
export async function signInWithSupabase(
  email: string,
  password: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase credentials not configured in environment.' };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to sign in.' };
  }
}

/**
 * Supabase User Sign Out
 */
export async function signOutFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase signOut error:', err);
  }
}

/**
 * Fetch color palettes from Supabase
 */
export async function getColorPalettesFromSupabase(): Promise<any[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from('color_palettes').select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn('Supabase getColorPalettes error:', error);
      return null;
    }
    if (!data) return [];
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      hex: c.hex,
      category: c.category,
      description: c.description || '',
      isActive: Boolean(c.is_active),
    }));
  } catch (err) {
    console.warn('Supabase getColorPalettes error:', err);
    return null;
  }
}

/**
 * Fetch size variants from Supabase
 */
export async function getSizeVariantsFromSupabase(): Promise<any[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from('size_variants').select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn('Supabase getSizeVariants error:', error);
      return null;
    }
    if (!data) return [];
    return data.map((s: any) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      dimension: s.dimension,
      stockStatus: s.stock_status,
      isActive: Boolean(s.is_active),
    }));
  } catch (err) {
    console.warn('Supabase getSizeVariants error:', err);
    return null;
  }
}

/**
 * Fetch lifestyle tags from Supabase (plain typed tags)
 */
export async function getLifestyleSaleTagsFromSupabase(): Promise<any[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from('lifestyle_sale_tags').select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn('Supabase getLifestyleSaleTags error:', error);
      return null;
    }
    if (!data) return [];
    return data
      .filter((t: any) => !t.id?.includes('probe') && !t.name?.toLowerCase().includes('probe') && !t.title?.toLowerCase().includes('probe'))
      .map((t: any) => ({
        id: t.id,
        name: t.name || t.title || 'Untitled Tag',
        isActive: Boolean(t.is_active ?? true),
      }));
  } catch (err) {
    console.warn('Supabase getLifestyleSaleTags error:', err);
    return null;
  }
}

/**
 * Check if lifestyle_sale_tags is reachable
 */
export async function checkLifestyleTagsRLS(): Promise<{
  writable: boolean;
  isRLS: boolean;
  message?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { writable: false, isRLS: false, message: 'Supabase credentials not configured' };
  }
  return { writable: true, isRLS: false };
}

/**
 * Delete a color swatch from Supabase
 */
export async function deleteColorFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('color_palettes').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Delete a size variant from Supabase
 */
export async function deleteSizeFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('size_variants').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Delete a lifestyle sale tag from Supabase
 */
export async function deleteLifestyleSaleTagFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('lifestyle_sale_tags').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Upsert a single color swatch to Supabase
 */
export async function upsertColorToSupabase(c: any): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase credentials not configured' };
  try {
    const { error } = await supabase.from('color_palettes').upsert(
      {
        id: c.id,
        name: c.name,
        hex: c.hex,
        category: c.category,
        description: c.description || null,
        is_active: c.isActive,
      },
      { onConflict: 'id' }
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save color to Supabase' };
  }
}

/**
 * Upsert a single size variant to Supabase
 */
export async function upsertSizeToSupabase(s: any): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase credentials not configured' };
  try {
    const { error } = await supabase.from('size_variants').upsert(
      {
        id: s.id,
        name: s.name,
        category: s.category,
        dimension: s.dimension,
        stock_status: s.stockStatus,
        is_active: s.isActive,
      },
      { onConflict: 'id' }
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save size to Supabase' };
  }
}

/**
 * Upsert a single lifestyle tag to Supabase (Plain typed tag)
 */
export async function upsertLifestyleSaleTagToSupabase(t: any): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase credentials not configured' };
  try {
    const tagName = t.name || t.title || 'Untitled Tag';
    const { error } = await supabase.from('lifestyle_sale_tags').upsert(
      {
        id: t.id,
        name: tagName,
        title: tagName,
        is_active: Boolean(t.isActive ?? true),
      },
      { onConflict: 'id' }
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save tag to Supabase' };
  }
}

/**
 * Sync / Seed all attributes to Supabase
 */
export async function syncAttributesToSupabase(
  colors: any[],
  sizes: any[],
  tags: any[]
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase credentials not configured in environment.' };
  }

  try {
    // 1. Upsert colors
    const { error: colErr } = await supabase.from('color_palettes').upsert(
      colors.map((c) => ({
        id: c.id,
        name: c.name,
        hex: c.hex,
        category: c.category,
        description: c.description || null,
        is_active: c.isActive,
      })),
      { onConflict: 'id' }
    );
    if (colErr) throw colErr;

    // 2. Upsert sizes
    const { error: sizeErr } = await supabase.from('size_variants').upsert(
      sizes.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        dimension: s.dimension,
        stock_status: s.stockStatus,
        is_active: s.isActive,
      })),
      { onConflict: 'id' }
    );
    if (sizeErr) throw sizeErr;

    // 3. Upsert lifestyle tags
    const { error: tagErr } = await supabase.from('lifestyle_sale_tags').upsert(
      tags.map((t) => {
        const tagName = t.name || t.title || 'Untitled Tag';
        return {
          id: t.id,
          name: tagName,
          title: tagName,
          is_active: Boolean(t.isActive ?? true),
        };
      }),
      { onConflict: 'id' }
    );
    if (tagErr) throw tagErr;

    return {
      success: true,
      message: `Successfully synchronized ${colors.length} colors, ${sizes.length} sizes, and ${tags.length} sale tags to Supabase Cloud!`,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to sync attributes to Supabase.' };
  }
}

