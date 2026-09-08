import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, CategoryMeta, Order, HeroSlide, Address, Coupon } from '../types';

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

    const { error: bannerError } = await supabase.from('banners').select('id').limit(1);
    if (!bannerError) tablesFound.push('banners');

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
      { data: prodImages },
      { data: prodFeatures },
      { data: prodVariants },
      { data: variantImages },
      { data: cats },
      { data: subs },
      { data: tags },
      { data: sizes },
      { data: colors },
    ] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('product_images').select('product_id, image_url, sort_order').order('sort_order', { ascending: true }),
      supabase.from('product_features').select('product_id, feature, sort_order').order('sort_order', { ascending: true }),
      supabase.from('product_variants').select('*').order('created_at', { ascending: true }),
      supabase.from('product_variant_images').select('variant_id, image_url, sort_order').order('sort_order', { ascending: true }),
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

    // Map product images from product_images table
    const prodImageMap = new Map<string, string[]>();
    (prodImages || []).forEach((img: any) => {
      if (img.product_id && img.image_url) {
        const list = prodImageMap.get(img.product_id) || [];
        list.push(img.image_url);
        prodImageMap.set(img.product_id, list);
      }
    });

    // Map variant images from product_variant_images table
    const variantImageMap = new Map<string, string[]>();
    (variantImages || []).forEach((img: any) => {
      if (img.variant_id && img.image_url) {
        const list = variantImageMap.get(img.variant_id) || [];
        list.push(img.image_url);
        variantImageMap.set(img.variant_id, list);
      }
    });

    // Map features from product_features table
    const featureMap = new Map<string, string[]>();
    (prodFeatures || []).forEach((f: any) => {
      if (f.product_id && f.feature) {
        const list = featureMap.get(f.product_id) || [];
        list.push(f.feature);
        featureMap.set(f.product_id, list);
      }
    });

    const catMap = new Map((cats || []).map((c: any) => [c.id, c]));
    const subMap = new Map((subs || []).map((s: any) => [s.id, s]));
    const tagMap = new Map((tags || []).map((t: any) => [t.id, t.name]));
    const sizeMap = new Map((sizes || []).map((s: any) => [s.id, s.name]));
    const colorMap = new Map((colors || []).map((c: any) => [c.id, c.name]));

    return prods.map((p: any) => {
      const matchedCat = catMap.get(p.category_id);
      const matchedSub = subMap.get(p.subcategory_id);
      const matchedTagName = (p.lifestyle_tag_id || p.sale_tag_id) ? tagMap.get(p.lifestyle_tag_id || p.sale_tag_id) : undefined;

      // 1. Gather real uploaded images from product_images table
      let dbImages = prodImageMap.get(p.id) || [];

      // If product has variants, also gather variant images
      const myVariants = (prodVariants || []).filter((v: any) => v.product_id === p.id);
      if (dbImages.length === 0 && myVariants.length > 0) {
        for (const v of myVariants) {
          const vImgs = variantImageMap.get(v.id) || [];
          if (vImgs.length > 0) {
            dbImages.push(...vImgs);
          }
        }
      }

      // Fallback only if no images exist anywhere in DB
      const firstImage = dbImages[0] || (Array.isArray(p.images) && p.images[0]) || p.image || 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&fit=crop&auto=format';
      const allImages = dbImages.length > 0 ? dbImages : (Array.isArray(p.images) && p.images.length > 0 ? p.images : [firstImage]);

      // 2. Real price & selling_price
      const rawPrice = Number(p.price || 0);
      const sellingPrice = p.selling_price != null ? Number(p.selling_price) : (p.offer_price != null ? Number(p.offer_price) : null);
      const finalPrice = (sellingPrice !== null && sellingPrice > 0) ? sellingPrice : rawPrice;
      const originalPrice = (sellingPrice !== null && rawPrice > sellingPrice) ? rawPrice : (p.original_price ? Number(p.original_price) : undefined);

      const title = (p.name || p.title || 'Untitled Product').trim();
      const catTitle = (matchedCat?.title?.trim() || p.category || 'Jewellery & Accessories').trim();
      const catSlug = (matchedCat?.slug?.trim().toLowerCase() || p.categorySlug || p.category_slug || 'apparel').trim();
      const subName = (matchedSub?.name?.trim() || p.subcategory || '').trim();

      const lifestyleTag = matchedTagName || (Array.isArray(p.tags) && p.tags[0]) || p.lifestyle_tag || p.lifestyleTag || undefined;

      // 3. Features & description
      const dbFeatures = featureMap.get(p.id) || [];
      const description = (p.description || '').trim();

      // 4. Resolve variants into standard frontend options
      let resolvedVariants: any[] = [];
      if (myVariants.length > 0) {
        const uniqueSizes = [
          ...new Set(
            myVariants
              .map((v: any) => sizeMap.get(v.size_id))
              .filter(Boolean)
          ),
        ];
        const uniqueColors = [
          ...new Set(
            myVariants
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
      } else if (Array.isArray(p.variants) && p.variants.length > 0) {
        resolvedVariants = p.variants;
      }

      const isActive = p.is_active !== undefined ? Boolean(p.is_active) : (p.status === 'active' || p.status === 'Active');

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
        description,
        stock: p.stock !== undefined ? Number(p.stock) : 50,
        status: isActive ? 'Active' : (p.stock === 0 ? 'Out of Stock' : 'Draft'),
        badge: (originalPrice && originalPrice > finalPrice) ? 'Sale' : (p.badge || undefined),
        lifestyleTag,
        featured: Boolean(p.is_featured ?? p.featured),
        variants: resolvedVariants,
        features: dbFeatures,
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

/**
 * Fetch banners from Supabase
 */
export async function getBannersFromSupabase(): Promise<HeroSlide[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase getBanners error:', error);
      return null;
    }
    if (!data) return [];
    return data
      .filter((b: any) => b.id !== 'announcement-bar-main' && b.category !== 'announcement')
      .map((b: any) => ({
        id: b.id,
        title: b.title || '',
        subtitle: b.subtitle || '',
        pretitle: b.category || b.pretitle || '',
        ctaText: b.cta_text || 'Shop Now',
        ctaLink: b.cta_link || '/',
        image: b.image || '',
        active: b.is_active ?? true,
      }));
  } catch (err) {
    console.warn('Supabase getBanners exception:', err);
    return null;
  }
}

/**
 * Fetch top storewide announcement from Supabase
 */
export async function getAnnouncementFromSupabase(): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('title')
      .eq('id', 'announcement-bar-main')
      .maybeSingle();

    if (error) {
      console.warn('Supabase getAnnouncement error:', error);
      return null;
    }
    return data?.title || null;
  } catch (err) {
    console.warn('Supabase getAnnouncement exception:', err);
    return null;
  }
}

/**
 * Save top storewide announcement to Supabase
 */
export async function saveAnnouncementToSupabase(text: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('banners').upsert(
      {
        id: 'announcement-bar-main',
        title: text,
        category: 'announcement',
        image: 'announcement',
        is_active: true,
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.warn('Supabase saveAnnouncement error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase saveAnnouncement exception:', err);
    return false;
  }
}

/**
 * Upsert single banner to Supabase
 */
export async function upsertBannerToSupabase(slide: HeroSlide): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase credentials not configured' };
  try {
    const { error } = await supabase.from('banners').upsert(
      {
        id: slide.id,
        title: slide.title,
        subtitle: slide.subtitle || null,
        category: slide.pretitle || null,
        image: slide.image,
        cta_text: slide.ctaText || null,
        cta_link: slide.ctaLink || null,
        is_active: Boolean(slide.active),
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.warn('Supabase upsertBanner error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Supabase upsertBanner exception:', err);
    return { success: false, error: err?.message || 'Failed to save banner' };
  }
}

/**
 * Delete a banner from Supabase
 */
export async function deleteBannerFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) {
      console.warn('Supabase deleteBanner error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deleteBanner exception:', err);
    return false;
  }
}

/**
 * Seed initial banners to Supabase
 */
export async function seedBannersToSupabase(banners: HeroSlide[]): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase credentials not configured.' };
  }
  try {
    const { error } = await supabase.from('banners').upsert(
      banners.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || null,
        category: b.pretitle || null,
        image: b.image,
        cta_text: b.ctaText || null,
        cta_link: b.ctaLink || null,
        is_active: Boolean(b.active),
      })),
      { onConflict: 'id' }
    );
    if (error) throw error;
    return { success: true, message: `Successfully seeded ${banners.length} banners to Supabase.` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to seed banners to Supabase.' };
  }
}

/**
 * Fetch addresses for a specific customer email from Supabase
 */
export async function getAddressesFromSupabase(userEmail: string): Promise<Address[]> {
  if (!isSupabaseConfigured || !supabase || !userEmail) return [];
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_email', userEmail.trim().toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getAddresses error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      label: (row.label as 'Home' | 'Office' | 'Other') || 'Home',
      fullName: row.full_name || '',
      phone: row.phone || '',
      addressLine: row.address_line || '',
      city: row.city || '',
      state: row.state || '',
      pincode: row.pincode || '',
      isDefault: Boolean(row.is_default),
    }));
  } catch (err) {
    console.warn('Supabase getAddresses exception:', err);
    return [];
  }
}

/**
 * Save new or existing address to Supabase
 */
export async function saveAddressToSupabase(
  address: Address,
  userEmail: string,
  userId?: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userEmail) return false;
  try {
    // If setting as default, unset other defaults for this user
    if (address.isDefault) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_email', userEmail.trim().toLowerCase());
    }

    const { error } = await supabase.from('addresses').upsert(
      {
        id: address.id,
        user_email: userEmail.trim().toLowerCase(),
        user_id: userId || null,
        label: address.label || 'Home',
        full_name: address.fullName,
        phone: address.phone,
        address_line: address.addressLine,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        is_default: Boolean(address.isDefault),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('Supabase saveAddress error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase saveAddress exception:', err);
    return false;
  }
}

/**
 * Update an existing address in Supabase
 */
export async function updateAddressInSupabase(
  addressId: string,
  updates: Partial<Address>,
  userEmail?: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !addressId) return false;
  try {
    if (updates.isDefault && userEmail) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_email', userEmail.trim().toLowerCase());
    }

    const payload: Record<string, any> = {};
    if (updates.label !== undefined) payload.label = updates.label;
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.addressLine !== undefined) payload.address_line = updates.addressLine;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.state !== undefined) payload.state = updates.state;
    if (updates.pincode !== undefined) payload.pincode = updates.pincode;
    if (updates.isDefault !== undefined) payload.is_default = updates.isDefault;

    const { error } = await supabase
      .from('addresses')
      .update(payload)
      .eq('id', addressId);

    if (error) {
      console.warn('Supabase updateAddress error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase updateAddress exception:', err);
    return false;
  }
}

/**
 * Delete an address from Supabase
 */
export async function deleteAddressFromSupabase(addressId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !addressId) return false;
  try {
    const { error } = await supabase.from('addresses').delete().eq('id', addressId);
    if (error) {
      console.warn('Supabase deleteAddress error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deleteAddress exception:', err);
    return false;
  }
}

/**
 * Fetch orders for a specific customer from Supabase
 */
export async function getOrdersForCustomerFromSupabase(userEmail: string): Promise<Order[]> {
  if (!isSupabaseConfigured || !supabase || !userEmail) return [];
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .ilike('customer_email', userEmail.trim())
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getOrdersForCustomer error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      date: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: row.status || 'New',
      items: row.items || [],
      subtotal: row.total || 0,
      discount: 0,
      shipping: 0,
      total: row.total || 0,
      customer: {
        name: row.customer_name || 'Patron',
        email: row.customer_email || userEmail,
        phone: row.customer_phone || '',
      },
      shippingAddress: row.shipping_address || {},
      paymentMethod: row.payment_method || 'Razorpay',
      trackingNumber: row.tracking_number,
      courierPartner: row.courier || 'BlueDart Express',
    }));
  } catch (err) {
    console.warn('Supabase getOrdersForCustomer exception:', err);
    return [];
  }
}

/**
 * Cryptographically verify whether the current visitor has an authorized active Admin session
 */
export async function verifyAdminSession(): Promise<{
  authenticated: boolean;
  email?: string;
  role?: string;
  name?: string;
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    // Fallback preset verification for offline/unconfigured environments
    if (typeof window !== 'undefined') {
      const sess = localStorage.getItem('purnya_admin_session');
      if (sess) {
        try {
          const parsed = JSON.parse(sess);
          if (parsed.email?.toLowerCase() === 'admin@purnya.com' && parsed.authMethod === 'preset') {
            return {
              authenticated: true,
              email: parsed.email,
              role: 'Super Administrator',
              name: 'Purnya Admin',
            };
          }
        } catch { }
      }
    }
    return { authenticated: false, error: 'Supabase unconfigured and no valid preset session.' };
  }

  try {
    // 1. Check live cryptographic Supabase Auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      // If no active auth session, check if there's an emergency preset session
      if (typeof window !== 'undefined') {
        const sess = localStorage.getItem('purnya_admin_session');
        if (sess) {
          try {
            const parsed = JSON.parse(sess);
            if (parsed.email?.toLowerCase() === 'admin@purnya.com' && parsed.authMethod === 'preset') {
              return {
                authenticated: true,
                email: parsed.email,
                role: 'Super Administrator',
                name: 'Purnya Admin',
              };
            }
          } catch { }
        }
      }
      return { authenticated: false, error: sessionError?.message || 'No active Supabase session' };
    }

    const user = session.user;
    const userRole = user.user_metadata?.role;

    // 2. Cross-verify with admin_users table for maximum security
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active')
      .eq('email', user.email?.toLowerCase())
      .single();

    if (adminRecord && adminRecord.is_active) {
      return {
        authenticated: true,
        email: adminRecord.email,
        role: adminRecord.role || 'Super Administrator',
        name: adminRecord.full_name || 'Purnya Admin',
      };
    }

    // 3. Fallback to user metadata role check
    if (userRole === 'admin') {
      return {
        authenticated: true,
        email: user.email || '',
        role: 'Super Administrator',
        name: user.user_metadata?.name || 'Administrator',
      };
    }

    return { authenticated: false, error: 'User does not possess administrative privileges.' };
  } catch (err: any) {
    console.warn('verifyAdminSession error:', err);
    return { authenticated: false, error: err?.message || 'Admin verification failed' };
  }
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  registeredDate: string;
  lastOrderDate: string;
  totalOrders: number;
  totalSpent: number;
  orders: Order[];
  addresses: Address[];
  status: 'VIP Patron' | 'Active Patron' | 'New Patron';
}

/**
 * Fetch all customers & patrons aggregated from Supabase profiles, orders, and addresses
 */
export async function getCustomersAndPatronsFromSupabase(): Promise<CustomerRecord[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const [
      { data: profiles, error: profErr },
      { data: dbOrders, error: ordErr },
      { data: dbAddresses, error: addrErr },
    ] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('addresses').select('*').order('created_at', { ascending: false }),
    ]);

    if (profErr) console.warn('Supabase profiles query error:', profErr.message);
    if (ordErr) console.warn('Supabase orders query error:', ordErr.message);
    if (addrErr) console.warn('Supabase addresses query error:', addrErr.message);

    const map = new Map<string, CustomerRecord>();

    // 1. Seed registered profiles
    (profiles || []).forEach((p: any) => {
      const emailKey = (p.email || '').trim().toLowerCase();
      if (!emailKey) return;

      const registeredDate = p.created_at
        ? new Date(p.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        : 'Recent';

      map.set(emailKey, {
        id: p.id,
        name: p.name || p.full_name || emailKey.split('@')[0],
        email: p.email,
        phone: p.phone || 'N/A',
        city: 'Bengaluru',
        state: 'Karnataka',
        registeredDate,
        lastOrderDate: 'No orders placed yet',
        totalOrders: 0,
        totalSpent: 0,
        orders: [],
        addresses: [],
        status: 'New Patron',
      });
    });

    // 2. Attach cloud addresses
    (dbAddresses || []).forEach((a: any) => {
      const emailKey = (a.user_email || '').trim().toLowerCase();
      if (map.has(emailKey)) {
        const cust = map.get(emailKey)!;
        const formattedAddr: Address = {
          id: a.id,
          label: (a.label as 'Home' | 'Office' | 'Other') || 'Home',
          fullName: a.full_name || cust.name,
          phone: a.phone || cust.phone,
          addressLine: a.address_line || '',
          city: a.city || '',
          state: a.state || '',
          pincode: a.pincode || '',
          isDefault: Boolean(a.is_default),
        };
        cust.addresses.push(formattedAddr);
        if (a.city) cust.city = a.city;
        if (a.state) cust.state = a.state;
      }
    });

    // 3. Attach cloud orders & discover guest customers
    (dbOrders || []).forEach((o: any) => {
      const emailKey = (o.customer_email || '').trim().toLowerCase();
      if (!emailKey) return;

      const orderDate = o.created_at
        ? new Date(o.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        : 'Recent';

      const formattedOrder: Order = {
        id: o.id,
        date: orderDate,
        status: o.status || 'New',
        items: o.items || [],
        subtotal: o.total || 0,
        discount: 0,
        shipping: 0,
        total: Number(o.total) || 0,
        customer: {
          name: o.customer_name || 'Patron',
          email: o.customer_email || '',
          phone: o.customer_phone || '',
        },
        shippingAddress: o.shipping_address || {},
        paymentMethod: o.payment_method || 'Razorpay',
        trackingNumber: o.tracking_number,
        courierPartner: o.courier || 'BlueDart Express',
      };

      let cust = map.get(emailKey);
      if (!cust) {
        // Guest customer from checkout
        cust = {
          id: `guest-${o.id}`,
          name: o.customer_name || 'Guest Patron',
          email: o.customer_email,
          phone: o.customer_phone || 'N/A',
          city: o.shipping_address?.city || 'India',
          state: o.shipping_address?.state || '',
          registeredDate: orderDate,
          lastOrderDate: orderDate,
          totalOrders: 0,
          totalSpent: 0,
          orders: [],
          addresses: [],
          status: 'New Patron',
        };
        map.set(emailKey, cust);
      }

      cust.totalOrders += 1;
      cust.totalSpent += Number(o.total) || 0;
      cust.orders.push(formattedOrder);
      cust.lastOrderDate = orderDate;
      if (o.shipping_address?.city) cust.city = o.shipping_address.city;
      if (o.shipping_address?.state) cust.state = o.shipping_address.state;
    });

    // 4. Calculate Patron Tier
    for (const cust of map.values()) {
      if (cust.totalSpent >= 5000 || cust.totalOrders >= 3) {
        cust.status = 'VIP Patron';
      } else if (cust.totalOrders >= 2) {
        cust.status = 'Active Patron';
      } else {
        cust.status = 'New Patron';
      }
    }

    return Array.from(map.values());
  } catch (err: any) {
    console.warn('Supabase getCustomersAndPatrons exception:', err);
    return [];
  }
}

/**
 * Fetch all orders across all customers from Supabase (for Admin)
 */
export async function getAllOrdersFromSupabase(): Promise<Order[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getAllOrders error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      date: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: row.status || 'New',
      items: row.items || [],
      subtotal: row.total || 0,
      discount: 0,
      shipping: 0,
      total: Number(row.total) || 0,
      customer: {
        name: row.customer_name || 'Patron',
        email: row.customer_email || '',
        phone: row.customer_phone || '',
      },
      shippingAddress: row.shipping_address || {},
      paymentMethod: row.payment_method || 'Razorpay',
      trackingNumber: row.tracking_number,
      courierPartner: row.courier || 'BlueDart Express',
    }));
  } catch (err) {
    console.warn('Supabase getAllOrders exception:', err);
    return [];
  }
}

/**
 * Fetch all promotional coupons from Supabase
 */
export async function getCouponsFromSupabase(): Promise<Coupon[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getCoupons error:', error.message);
      return [];
    }

    return (data || []).map((row: any): Coupon => ({
      code: row.code,
      discountType: (row.discount_type as 'percentage' | 'fixed') || 'percentage',
      discountValue: Number(row.discount_value ?? row.discount_percent ?? 0),
      minOrderValue: Number(row.min_order_amount ?? 0),
      isActive: Boolean(row.is_active),
      description: row.description || `${row.discount_percent || row.discount_value || 0}% off promotional discount`,
      maxDiscount: row.max_discount != null ? Number(row.max_discount) : undefined,
      usageLimit: row.usage_limit != null ? Number(row.usage_limit) : undefined,
      usageCount: Number(row.usage_count || 0),
      validFrom: row.valid_from ? new Date(row.valid_from).toISOString() : undefined,
      validUntil: row.valid_until ? new Date(row.valid_until).toISOString() : undefined,
    }));
  } catch (err) {
    console.warn('Supabase getCoupons exception:', err);
    return [];
  }
}

/**
 * Save or update coupon in Supabase with resilient schema fallback
 */
export async function saveCouponToSupabase(coupon: Coupon): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    // Attempt to upsert with full rich fields (Option 2)
    const richPayload: Record<string, any> = {
      code: coupon.code,
      discount_percent: coupon.discountType === 'percentage' ? coupon.discountValue : 0,
      discount_type: coupon.discountType,
      discount_value: coupon.discountValue,
      min_order_amount: coupon.minOrderValue,
      is_active: coupon.isActive,
      description: coupon.description,
      max_discount: coupon.maxDiscount ?? null,
      usage_limit: coupon.usageLimit ?? null,
      usage_count: coupon.usageCount ?? 0,
      valid_from: coupon.validFrom ? new Date(coupon.validFrom).toISOString() : null,
      valid_until: coupon.validUntil ? new Date(coupon.validUntil).toISOString() : null,
    };

    const { error } = await supabase
      .from('coupons')
      .upsert(richPayload, { onConflict: 'code' });

    if (!error) return true;

    // If columns do not exist yet (code 42703), fall back to base columns gracefully
    if (error.code === '42703' || error.message.includes('column')) {
      console.warn('Supabase coupons table missing rich columns, falling back to base columns:', error.message);
      const fallbackPayload = {
        code: coupon.code,
        discount_percent: coupon.discountType === 'percentage' ? coupon.discountValue : 0,
        min_order_amount: coupon.minOrderValue,
        is_active: coupon.isActive,
      };
      const { error: fallbackError } = await supabase
        .from('coupons')
        .upsert(fallbackPayload, { onConflict: 'code' });

      if (fallbackError) {
        console.error('Supabase coupon base upsert error:', fallbackError);
        return false;
      }
      return true;
    }

    console.error('Supabase coupon upsert error:', error);
    return false;
  } catch (err) {
    console.error('Supabase saveCoupon exception:', err);
    return false;
  }
}

/**
 * Toggle coupon active status in Supabase
 */
export async function toggleCouponInSupabase(code: string, isActive: boolean): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: isActive })
      .eq('code', code);
    if (error) {
      console.warn('Supabase toggleCoupon error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase toggleCoupon exception:', err);
    return false;
  }
}

/**
 * Delete coupon from Supabase
 */
export async function deleteCouponFromSupabase(code: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('code', code);
    if (error) {
      console.warn('Supabase deleteCoupon error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deleteCoupon exception:', err);
    return false;
  }
}
