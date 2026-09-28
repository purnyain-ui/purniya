'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  ImageOff,
  Search,
  AlertTriangle,
  Package,
  RefreshCw,
  Eye,
  X,
  Layers,
  Tag,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { readAdminSession, getProductAccess, AdminSession } from '@/lib/adminPermissions';

// Never render <img src=""> — falls back to this instead.
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&fit=crop&auto=format';

// ---------------------------------------------------------------
// Types matching the REAL Supabase products table
// ---------------------------------------------------------------
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  lifestyle_tag_id: string | null;
  is_featured: boolean;
  has_variants: boolean;
  price: number | null;
  selling_price: number | null;
  stock: number;
  is_active: boolean;
  status?: string;
  created_at: string;
  updated_at: string;
  // Joined from product_images
  primary_image?: string | null;
};

type CategoryLite = { id: string; slug: string; title: string; priority?: number };
type SubcategoryLite = { id: string; category_id: string; name: string };
type LifestyleLite = { id: string; name: string | null };

// ---------------------------------------------------------------
// "View" modal types — everything that was added for one product
// ---------------------------------------------------------------
type ViewVariant = {
  id: string;
  color_id: string | null;
  size_id: string | null;
  sku: string | null;
  price: number | null;
  selling_price: number | null;
  stock: number | null;
  is_active: boolean;
  color: { id: string; name: string; hex: string } | null;
  size: { id: string; name: string; dimension: string } | null;
  images: string[];
};

type ViewDetails = {
  features: string[];
  images: string[];
  variants: ViewVariant[];
};

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryLite[]>([]);
  const [lifestyleTags, setLifestyleTags] = useState<LifestyleLite[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string; kind: 'success' | 'error' } | null>(null);

  // Authentication & RBAC Session
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    setAdminSession(readAdminSession());
  }, []);

  const productAccess = useMemo(() => getProductAccess(adminSession), [adminSession]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  // '' means "All Categories" tab
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  // '' means all subcategories in the selected category
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string>('');

  // "View" modal state
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [viewDetails, setViewDetails] = useState<ViewDetails | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  const showToast = (title: string, message: string, kind: 'success' | 'error') => {
    setToast({ title, message, kind });
    setTimeout(() => setToast(null), 4000);
  };

  // Categories visible to this admin/subadmin
  const visibleCategories = useMemo(() => {
    if (productAccess.all) return categories;
    return categories.filter((c) => productAccess.categoryIds.includes(c.id));
  }, [categories, productAccess]);

  // ---------------------------------------------------------------
  // Keep the active category & subcategory in sync with the URL's
  // ?category= and ?sub= / ?subcategoryId= params.
  // ---------------------------------------------------------------
  useEffect(() => {
    const catParam = searchParams.get('category') || '';
    const subParam = searchParams.get('sub') || searchParams.get('subcategoryId') || '';
    setActiveCategoryId(catParam);
    setActiveSubcategoryId(subParam);
  }, [searchParams]);

  // Selecting a category tab clears subcategory and updates the URL
  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setActiveCategoryId(categoryId);
      setActiveSubcategoryId('');
      router.push(categoryId ? `/admin/products?category=${categoryId}` : '/admin/products');
    },
    [router]
  );

  // If restricted staff lands on products with no category or disallowed category, auto-select their allowed category
  useEffect(() => {
    if (!productAccess.all && productAccess.categoryIds.length > 0) {
      if (!activeCategoryId || !productAccess.categoryIds.includes(activeCategoryId)) {
        handleCategorySelect(productAccess.categoryIds[0]);
      }
    }
  }, [productAccess, activeCategoryId, handleCategorySelect]);

  // Selecting a subcategory updates URL to include both category and subcategory
  const handleSubcategorySelect = useCallback(
    (subId: string) => {
      setActiveSubcategoryId(subId);
      if (subId) {
        const subObj = subcategories.find((s) => s.id === subId);
        const targetCatId = activeCategoryId || subObj?.category_id || '';
        if (targetCatId) {
          router.push(`/admin/products?category=${targetCatId}&sub=${subId}`);
        } else {
          router.push(`/admin/products?sub=${subId}`);
        }
      } else {
        router.push(activeCategoryId ? `/admin/products?category=${activeCategoryId}` : '/admin/products');
      }
    },
    [router, activeCategoryId, subcategories]
  );

  // ---------------------------------------------------------------
  // Fetch products + categories
  // ---------------------------------------------------------------
  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [
        { data: productData, error: productError },
        { data: catData, error: catError },
        { data: subData, error: subError },
        { data: lifestyleData, error: lifestyleError },
      ] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id, slug, title, priority')
          .order('priority', { ascending: true })
          .order('title', { ascending: true }),
        supabase.from('subcategories').select('id, category_id, name').order('sort_order'),
        supabase.from('lifestyle_sale_tags').select('id, name'),
      ]);

      const firstError = productError || catError || subError || lifestyleError;
      if (firstError) throw firstError;

      // Fetch primary image for each product from product_images
      const productIds = (productData || []).map((p: Product) => p.id);
      let imageMap: Record<string, string> = {};

      if (productIds.length > 0) {
        const { data: imageData } = await supabase
          .from('product_images')
          .select('product_id, image_url')
          .in('product_id', productIds)
          .order('sort_order', { ascending: true });

        if (imageData) {
          // Take the first image per product
          for (const img of imageData) {
            if (!imageMap[img.product_id]) {
              imageMap[img.product_id] = img.image_url;
            }
          }
        }
      }

      const enrichedProducts = (productData || []).map((p: Product) => ({
        ...p,
        primary_image: imageMap[p.id] || null,
      }));

      setProducts(enrichedProducts);
      setCategories(catData || []);
      setSubcategories(subData || []);
      setLifestyleTags(lifestyleData || []);
    } catch (err: any) {
      setLoadError(err?.message || 'Could not reach Supabase. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------
  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;

    try {
      // Delete related data first
      await supabase.from('product_features').delete().eq('product_id', p.id);
      await supabase.from('product_images').delete().eq('product_id', p.id);

      // Delete variants and their images
      const { data: variants } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', p.id);

      if (variants && variants.length > 0) {
        const variantIds = variants.map((v: { id: string }) => v.id);
        await supabase.from('product_variant_images').delete().in('variant_id', variantIds);
        await supabase.from('product_variants').delete().eq('product_id', p.id);
      }

      // Delete the product itself
      const { error } = await supabase.from('products').delete().eq('id', p.id);
      if (error) throw error;

      showToast('Deleted', `${p.name} was removed.`, 'success');
      await fetchData();
    } catch (err: any) {
      showToast('Delete failed', err.message || 'Could not delete this product.', 'error');
    }
  };

  const toggleActive = async (p: any) => {
    const isCurrentlyActive = p.is_active !== undefined ? Boolean(p.is_active) : (p.status === 'Active');
    const nextActive = !isCurrentlyActive;

    const { error } = await supabase
      .from('products')
      .update({
        is_active: nextActive,
      })
      .eq('id', p.id);

    if (error) {
      showToast('Update failed', error.message, 'error');
    } else {
      showToast('Updated', `${p.name || 'Product'} is now ${nextActive ? 'Active' : 'Inactive'}.`, 'success');
      if (viewProduct && viewProduct.id === p.id) {
        setViewProduct({
          ...viewProduct,
          is_active: nextActive,
          status: nextActive ? 'Active' : 'Inactive',
        });
      }
      await fetchData();
    }
  };

  // ---------------------------------------------------------------
  // "View" — load every piece of data that was added for this product
  // ---------------------------------------------------------------
  const openView = async (p: Product) => {
    setViewProduct(p);
    setViewDetails(null);
    setViewError(null);
    setViewLoading(true);

    try {
      const [{ data: featuresData }, { data: imagesData }] = await Promise.all([
        supabase
          .from('product_features')
          .select('feature')
          .eq('product_id', p.id)
          .order('sort_order'),
        supabase
          .from('product_images')
          .select('id,image_url,sort_order')
          .eq('product_id', p.id)
          .order('sort_order'),
      ]);

      let variantDetails: ViewVariant[] = [];

      if (p.has_variants) {
        const { data: variantRows } = await supabase
          .from('product_variants')
          .select('id,color_id,size_id,sku,price,selling_price,stock,is_active')
          .eq('product_id', p.id)
          .order('created_at');

        const colorIds = Array.from(
          new Set((variantRows || []).map((v: any) => v.color_id).filter(Boolean))
        );
        const sizeIds = Array.from(
          new Set((variantRows || []).map((v: any) => v.size_id).filter(Boolean))
        );
        const variantIds = (variantRows || []).map((v: any) => v.id);

        const [colorsRes, sizesRes, variantImagesRes] = await Promise.all([
          colorIds.length > 0
            ? supabase.from('color_palettes').select('id,name,hex').in('id', colorIds)
            : Promise.resolve({ data: [] as any[] }),
          sizeIds.length > 0
            ? supabase.from('size_variants').select('id,name,dimension').in('id', sizeIds)
            : Promise.resolve({ data: [] as any[] }),
          variantIds.length > 0
            ? supabase
              .from('product_variant_images')
              .select('variant_id,image_url,sort_order')
              .in('variant_id', variantIds)
              .order('sort_order')
            : Promise.resolve({ data: [] as any[] }),
        ]);

        const colorsById = new Map((colorsRes.data || []).map((c: any) => [c.id, c]));
        const sizesById = new Map((sizesRes.data || []).map((s: any) => [s.id, s]));
        const imagesByVariant = new Map<string, string[]>();
        (variantImagesRes.data || []).forEach((row: any) => {
          const list = imagesByVariant.get(row.variant_id) || [];
          list.push(row.image_url);
          imagesByVariant.set(row.variant_id, list);
        });

        variantDetails = (variantRows || []).map((v: any) => ({
          id: v.id,
          color_id: v.color_id,
          size_id: v.size_id,
          sku: v.sku,
          price: v.price,
          selling_price: v.selling_price,
          stock: v.stock,
          is_active: v.is_active,
          color: v.color_id ? colorsById.get(v.color_id) || null : null,
          size: v.size_id ? sizesById.get(v.size_id) || null : null,
          images: imagesByVariant.get(v.id) || [],
        }));
      }

      setViewDetails({
        features: (featuresData || []).map((f: { feature: string }) => f.feature),
        images: (imagesData || []).map((i: { image_url: string }) => i.image_url),
        variants: variantDetails,
      });
    } catch (err: any) {
      setViewError(err?.message || 'Could not load the full details for this product.');
    } finally {
      setViewLoading(false);
    }
  };

  const closeView = () => {
    setViewProduct(null);
    setViewDetails(null);
    setViewError(null);
  };

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  const categoryTitle = (id: string | null) =>
    categories.find((c) => c.id === id)?.title?.trim() || '—';
  const subcategoryTitle = (id: string | null) =>
    subcategories.find((s) => s.id === id)?.name?.trim() || '';
  const lifestyleTitle = (id: string | null) =>
    lifestyleTags.find((l) => l.id === id)?.name?.trim() || '';

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // ---------------------------------------------------------------
  // Derived: active category & subcategory objects
  // ---------------------------------------------------------------
  const activeSubcategory = useMemo(() => {
    if (!activeSubcategoryId) return null;
    return subcategories.find((s) => s.id === activeSubcategoryId) || null;
  }, [subcategories, activeSubcategoryId]);

  const activeCategory = useMemo(() => {
    const targetId = activeCategoryId || activeSubcategory?.category_id || '';
    if (!targetId) return null;
    return (
      categories.find(
        (c) =>
          c.id === targetId ||
          (c.slug && c.slug.trim().toLowerCase() === targetId.trim().toLowerCase())
      ) || null
    );
  }, [categories, activeCategoryId, activeSubcategory]);

  const activeCategoryLabel = activeCategory
    ? activeCategory.title.trim()
    : activeCategoryId
      ? 'Category'
      : 'All Categories';

  const availableSubcategories = useMemo(() => {
    const targetCatId = activeCategory ? activeCategory.id : activeCategoryId;
    if (!targetCatId) return [];
    return subcategories.filter((s) => s.category_id === targetCatId);
  }, [subcategories, activeCategoryId, activeCategory]);

  const productCountForCategory = (categoryId: string) =>
    products.filter((p) => p.category_id === categoryId).length;

  const productCountForSubcategory = (subId: string) =>
    products.filter((p) => p.subcategory_id === subId).length;

  // ---------------------------------------------------------------
  // Derived: filtered list (category + subcategory + search + active/inactive)
  // ---------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory =
        !activeCategoryId ||
        p.category_id === activeCategoryId ||
        (activeCategory && p.category_id === activeCategory.id);

      const matchesSubcategory =
        !activeSubcategoryId ||
        p.subcategory_id === activeSubcategoryId;

      const matchesActive =
        activeFilter === 'all' ||
        (activeFilter === 'active' && p.is_active) ||
        (activeFilter === 'inactive' && !p.is_active);

      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q);

      return matchesCategory && matchesSubcategory && matchesActive && matchesQuery;
    });
  }, [products, searchQuery, activeFilter, activeCategoryId, activeCategory, activeSubcategoryId]);

  // ---------------------------------------------------------------
  // Derived: stat cards — scoped to the active category & subcategory
  // ---------------------------------------------------------------
  const stats = useMemo(() => {
    const scoped = products.filter((p) => {
      const matchesCategory =
        !activeCategoryId ||
        p.category_id === activeCategoryId ||
        (activeCategory && p.category_id === activeCategory.id);

      const matchesSubcategory =
        !activeSubcategoryId ||
        p.subcategory_id === activeSubcategoryId;

      return matchesCategory && matchesSubcategory;
    });

    const active = scoped.filter((p) => p.is_active).length;
    const inactive = scoped.filter((p) => !p.is_active).length;
    const lowStock = scoped.filter((p) => p.is_active && p.stock > 0 && p.stock <= 5).length;
    const outOfStock = scoped.filter((p) => p.stock === 0).length;
    return { total: scoped.length, active, inactive, lowStock, outOfStock };
  }, [products, activeCategoryId, activeCategory, activeSubcategoryId]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[70] px-4 py-3 rounded-xl shadow-lg text-xs font-semibold border ${toast.kind === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
        >
          <p className="font-bold">{toast.title}</p>
          <p>{toast.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">Products</h1>
            {activeCategory && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#0B241C] text-[#FAF8F5]">
                {activeCategory.title}
              </span>
            )}
            {activeSubcategory && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#C5A059] text-[#1E130D] flex items-center gap-1.5 shadow-2xs">
                <span>{activeSubcategory.name}</span>
                <button
                  type="button"
                  onClick={() => handleSubcategorySelect('')}
                  className="hover:opacity-75 cursor-pointer ml-0.5"
                  title="Clear subcategory filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#2C4A3E] mt-1">
            {stats.total} product{stats.total === 1 ? '' : 's'} {activeSubcategory ? `in ${activeSubcategory.name}` : activeCategory ? `in ${activeCategory.title}` : 'in your catalog'}.
          </p>
        </div>
        <button
          onClick={() => {
            const params = new URLSearchParams();
            if (activeCategoryId) params.set('categoryId', activeCategoryId);
            if (activeSubcategoryId) params.set('subcategoryId', activeSubcategoryId);
            const qs = params.toString();
            router.push(qs ? `/admin/products/add?${qs}` : '/admin/products/add');
          }}
          className="px-4 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#123528] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Data load error banner */}
      {loadError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-800">Couldn't load your catalog data</p>
            <p className="text-rose-700 mt-0.5">{loadError}</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 font-semibold hover:bg-rose-100 shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* Quick stats */}
      {!loadError && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <StatCard label="Total products" value={stats.total} />
          <StatCard label="Active" value={stats.active} tone="emerald" />
          <StatCard label="Inactive" value={stats.inactive} tone="rose" />
          <StatCard label="Low stock (≤5)" value={stats.lowStock} tone="amber" />
          <StatCard label="Out of stock" value={stats.outOfStock} tone="neutral" />
        </div>
      )}

      {/* Category Tabs — ALWAYS visible so admin can freely switch between categories */}
      <div className="flex border-b border-[#E2DBD0] gap-2 overflow-x-auto text-xs font-bold pb-1 scrollbar-none">
        {productAccess.all && (
          <button
            onClick={() => handleCategorySelect('')}
            className={`px-4 py-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 rounded-t-xl ${
              !activeCategoryId
                ? 'border-[#C5A059] text-[#0B241C] bg-white shadow-2xs font-bold'
                : 'border-transparent text-[#5A7469] hover:text-[#0B241C] hover:bg-white/50'
            }`}
          >
            <span>All Categories</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                !activeCategoryId ? 'bg-[#0B241C] text-white' : 'bg-gray-100 text-[#5A7469]'
              }`}
            >
              {products.length}
            </span>
          </button>
        )}

        {visibleCategories.map((cat) => {
          const isSelected = activeCategoryId === cat.id || (activeCategory && activeCategory.id === cat.id);
          const count = productCountForCategory(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-4 py-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 rounded-t-xl ${
                isSelected
                  ? 'border-[#C5A059] text-[#0B241C] bg-white shadow-2xs font-bold'
                  : 'border-transparent text-[#5A7469] hover:text-[#0B241C] hover:bg-white/50'
              }`}
            >
              <span>{cat.title.trim()}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isSelected ? 'bg-[#0B241C] text-white' : 'bg-gray-100 text-[#5A7469]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Subcategory Filter Pills — shown when category has subcategories */}
      {availableSubcategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 px-3 scrollbar-none bg-[#FAF8F5] rounded-2xl border border-[#E2DBD0]">
          <span className="text-[11px] font-bold text-[#5A7469] uppercase tracking-wider pr-1 shrink-0 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
            Subcategories:
          </span>

          <button
            type="button"
            onClick={() => handleSubcategorySelect('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
              !activeSubcategoryId
                ? 'bg-[#0B241C] text-[#FAF8F5] font-bold shadow-xs'
                : 'bg-white text-[#2C4A3E] border border-[#E2DBD0] hover:border-[#C5A059] hover:text-[#0B241C]'
            }`}
          >
            <span>All {activeCategory?.title || 'in Category'}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                !activeSubcategoryId
                  ? 'bg-[#C5A059] text-[#1E130D]'
                  : 'bg-gray-100 text-[#5A7469]'
              }`}
            >
              {products.filter((p) => p.category_id === (activeCategory?.id || activeCategoryId)).length}
            </span>
          </button>

          {availableSubcategories.map((sub) => {
            const isSubSelected = activeSubcategoryId === sub.id;
            const subCount = productCountForSubcategory(sub.id);
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleSubcategorySelect(sub.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSubSelected
                    ? 'bg-[#C5A059] text-[#1E130D] font-bold shadow-xs'
                    : 'bg-white text-[#2C4A3E] border border-[#E2DBD0] hover:border-[#C5A059] hover:text-[#0B241C]'
                }`}
              >
                <span>{sub.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSubSelected
                      ? 'bg-[#1E130D] text-white'
                      : 'bg-gray-100 text-[#5A7469]'
                  }`}
                >
                  {subCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#8A9A92] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${activeSubcategory ? activeSubcategory.name : activeCategoryLabel}…`}
            className="w-full pl-8 pr-3 py-2.5 bg-white border border-[#E2DBD0] rounded-xl text-xs font-medium text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white p-1 border border-[#E2DBD0] rounded-xl self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#0B241C] text-white shadow-xs'
                : 'text-[#5A7469] hover:text-[#0B241C] hover:bg-[#FAF8F5]'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Active ({stats.active})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'inactive'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Inactive ({stats.inactive})</span>
          </button>
        </div>
      </div>

      {/* Section header — scoped to category and subcategory */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="font-serif-title text-xl font-bold text-[#0B241C] flex items-center gap-2">
            <span>
              Products in {activeSubcategory ? `${activeSubcategory.name} (${activeCategoryLabel})` : activeCategoryLabel}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
            </span>
          </h2>
          <p className="text-xs text-[#5A7469]">
            {activeSubcategory
              ? `Showing only products under the "${activeSubcategory.name}" subcategory.`
              : activeCategory
                ? `Showing products under the "${activeCategory.title}" category.`
                : 'Showing all products in your catalog.'}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-[#5A7469] py-16">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading products…</span>
        </div>
      )}

      {/* Empty states */}
      {!loading && !loadError && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center gap-2 text-center py-16 bg-white rounded-2xl border border-[#E2DBD0]">
          <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-center">
            <Package className="w-4 h-4 text-[#C5A059]" />
          </div>
          {products.length === 0 ? (
            <>
              <p className="font-bold text-[#0B241C] text-sm">No products in your catalog yet</p>
              <p className="text-[#5A7469] text-xs">Add your first piece to start building your catalog.</p>
              <button
                onClick={() => router.push('/admin/products/add')}
                className="mt-2 px-4 py-2 rounded-xl bg-[#0B241C] hover:bg-[#123528] text-white font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product
              </button>
            </>
          ) : searchQuery ? (
            <>
              <p className="font-bold text-[#0B241C] text-sm">No matching products found</p>
              <p className="text-[#5A7469] text-xs">
                No products match &ldquo;{searchQuery}&rdquo; in {activeSubcategory ? activeSubcategory.name : activeCategoryLabel}
                {activeFilter !== 'all' ? ` (${activeFilter})` : ''}.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-semibold text-[#C5A059] hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            </>
          ) : activeFilter !== 'all' ? (
            <>
              <p className="font-bold text-[#0B241C] text-sm">No {activeFilter} products</p>
              <p className="text-[#5A7469] text-xs">
                There are currently no {activeFilter} products in {activeSubcategory ? activeSubcategory.name : activeCategoryLabel}.
              </p>
              <button
                onClick={() => setActiveFilter('all')}
                className="mt-2 text-xs font-semibold text-[#C5A059] hover:underline cursor-pointer"
              >
                Show All in {activeSubcategory ? activeSubcategory.name : activeCategoryLabel}
              </button>
            </>
          ) : activeSubcategory ? (
            <>
              <p className="font-bold text-[#0B241C] text-sm">No products in &ldquo;{activeSubcategory.name}&rdquo; yet</p>
              <p className="text-[#5A7469] text-xs max-w-sm">
                No products have been added to this subcategory yet. You can add one now or select another subcategory.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => router.push(`/admin/products/add?categoryId=${activeCategoryId}&subcategoryId=${activeSubcategoryId}`)}
                  className="px-4 py-2 rounded-xl bg-[#0B241C] hover:bg-[#123528] text-white font-semibold flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product in {activeSubcategory.name}</span>
                </button>
                <button
                  onClick={() => handleSubcategorySelect('')}
                  className="px-3.5 py-2 rounded-xl border border-[#E2DBD0] hover:bg-[#FAF8F5] text-[#0B241C] font-semibold text-xs cursor-pointer transition-colors"
                >
                  View All in {activeCategoryLabel}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="font-bold text-[#0B241C] text-sm">No products in {activeCategoryLabel} yet</p>
              <p className="text-[#5A7469] text-xs max-w-sm">
                No products have been added to this category yet. You can add one now or select another category from the tabs above.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() =>
                    router.push(
                      activeCategoryId
                        ? `/admin/products/add?categoryId=${activeCategoryId}`
                        : '/admin/products/add'
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-[#0B241C] hover:bg-[#123528] text-white font-semibold flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product in {activeCategoryLabel}</span>
                </button>
                {productAccess.all && activeCategoryId && (
                  <button
                    onClick={() => handleCategorySelect('')}
                    className="px-3.5 py-2 rounded-xl border border-[#E2DBD0] hover:bg-[#FAF8F5] text-[#0B241C] font-semibold text-xs cursor-pointer transition-colors"
                  >
                    View All Products ({products.length})
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Product Visual Grid — same card pattern as the Subcategories grid */}
      {!loading && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-[#E2DBD0] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-square w-full bg-[#FAF8F5] overflow-hidden">
                  {p.primary_image ? (
                    <img
                      src={p.primary_image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-6 h-6 text-[#C5A059]" />
                    </div>
                  )}

                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs backdrop-blur-xs flex items-center gap-1.5 border ${
                        p.is_active
                          ? 'bg-emerald-600/90 text-white border-emerald-400/50'
                          : 'bg-rose-600/90 text-white border-rose-400/50'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-emerald-200 animate-pulse' : 'bg-rose-200'}`} />
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {p.is_featured && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/90 text-white border border-amber-300 shadow-xs">
                        ★ Featured
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 flex gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openView(p)}
                      title="View"
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-[#0B241C] shadow-sm cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => router.push(`/admin/products/add?id=${p.id}`)}
                      title="Edit"
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-[#0B241C] shadow-sm cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p)}
                      title="Delete"
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-rose-50 text-rose-700 shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-[#5A7469]">
                    <span className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E2DBD0] truncate font-medium" title={`Product ID: ${p.id}`}>
                      ID: {p.id}
                    </span>
                    {p.sku && (
                      <span className="text-[#8C7A6B] truncate max-w-[120px]" title={`SKU: ${p.sku}`}>
                        SKU: {p.sku}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-xs text-[#0B241C] truncate">{p.name}</h3>
                  <p className="text-[11px] text-[#5A7469] truncate">
                    {categoryTitle(p.category_id)}
                    {subcategoryTitle(p.subcategory_id) ? ` • ${subcategoryTitle(p.subcategory_id)}` : ''}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-[#0B241C] text-xs">
                      {p.selling_price
                        ? `₹${p.selling_price}`
                        : p.price
                          ? `₹${p.price}`
                          : '—'}
                    </span>
                    {p.selling_price && p.price && p.selling_price < p.price && (
                      <span className="text-[10px] line-through text-[#5A7469]">₹{p.price}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#5A7469]">
                    {p.has_variants ? (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Variants
                      </span>
                    ) : (
                      <span className={p.stock <= 5 && p.stock > 0 ? 'text-amber-700 font-bold' : ''}>
                        {p.stock} in stock
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="p-3 pt-2 border-t border-[#EFEBE3] mt-2 flex justify-between items-center text-[11px]">
                <button
                  onClick={() => router.push(`/admin/products/add?id=${p.id}`)}
                  className="text-[#0B241C] font-semibold hover:text-[#C5A059] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Edit Product</span>
                </button>
                <button
                  onClick={() => toggleActive(p)}
                  title={`Click to set as ${p.is_active ? 'Inactive' : 'Active'}`}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs ${p.is_active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span>{p.is_active ? 'Active' : 'Inactive'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -----------------------------------------------------------
          "View" modal — everything that was added for this product
          (unchanged from the original table version)
      ----------------------------------------------------------- */}
      {viewProduct && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[80] flex items-center justify-center p-4"
          onClick={closeView}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-[#E2DBD0]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-[#E2DBD0] p-5 sm:p-6 flex items-start justify-between gap-4 rounded-t-3xl z-10">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-[#0B241C]">
                    {viewProduct.name}
                  </h2>
                  {viewProduct.is_featured && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      ★ Featured
                    </span>
                  )}
                  <button
                    onClick={() => toggleActive(viewProduct)}
                    title={`Click to set as ${viewProduct.is_active ? 'Inactive' : 'Active'}`}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs ${viewProduct.is_active
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                      }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${viewProduct.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>{viewProduct.is_active ? 'Active' : 'Inactive'} (Click to toggle)</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#5A7469] mt-1">
                  {viewProduct.sku || viewProduct.slug}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/admin/products/add?id=${viewProduct.id}`)}
                  className="px-3 py-2 rounded-xl bg-[#0B241C] hover:bg-[#123528] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Edit Product</span>
                </button>
                <button
                  onClick={closeView}
                  className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EFEBE3] border border-[#E2DBD0] text-[#0B241C] shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 text-xs">
              {viewLoading && (
                <div className="flex items-center justify-center gap-2 text-[#5A7469] py-10">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading full product details…</span>
                </div>
              )}

              {viewError && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-800">Couldn't load product details</p>
                    <p className="text-rose-700 mt-0.5">{viewError}</p>
                  </div>
                </div>
              )}

              {!viewLoading && !viewError && viewDetails && (
                <>
                  {/* Basic info */}
                  <div>
                    <SectionLabel icon={Package} text="Product Details" />
                    <div className="divide-y divide-[#EFEBE3] border border-[#E2DBD0] rounded-2xl overflow-hidden bg-[#FAF8F5]/60 mt-3">
                      <InfoRow label="Product ID" value={viewProduct.id} />
                      <InfoRow label="Category" value={categoryTitle(viewProduct.category_id)} />
                      {subcategoryTitle(viewProduct.subcategory_id) && (
                        <InfoRow label="Subcategory" value={subcategoryTitle(viewProduct.subcategory_id)} />
                      )}
                      {lifestyleTitle(viewProduct.lifestyle_tag_id) && (
                        <InfoRow label="Lifestyle Tag" value={lifestyleTitle(viewProduct.lifestyle_tag_id)} />
                      )}
                      <InfoRow label="SKU" value={viewProduct.sku || '—'} />
                      <InfoRow label="Slug" value={viewProduct.slug} />
                      <InfoRow label="Created" value={formatDateTime(viewProduct.created_at)} />
                      <InfoRow label="Last Updated" value={formatDateTime(viewProduct.updated_at)} />
                    </div>
                    {viewProduct.description && (
                      <p className="mt-3 text-[#2C4A3E] leading-relaxed">{viewProduct.description}</p>
                    )}
                  </div>

                  {/* Pricing & stock — simple products only */}
                  {!viewProduct.has_variants && (
                    <div>
                      <SectionLabel icon={Tag} text="Pricing & Stock" />
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <StatBlock label="Price" value={viewProduct.price != null ? `₹${viewProduct.price}` : '—'} />
                        <StatBlock
                          label="Selling Price"
                          value={viewProduct.selling_price != null ? `₹${viewProduct.selling_price}` : '—'}
                        />
                        <StatBlock label="Stock" value={String(viewProduct.stock)} />
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div>
                    <SectionLabel icon={Sparkles} text={`Features (${viewDetails.features.length})`} />
                    {viewDetails.features.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                        {viewDetails.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#FAF8F5]/60 border border-[#E2DBD0]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0C3B2E] shrink-0 mt-0.5" />
                            <span className="text-[#2C4A3E]">{feature}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#5A7469] mt-3">No features added.</p>
                    )}
                  </div>

                  {/* Images — simple products only */}
                  {!viewProduct.has_variants && (
                    <div>
                      <SectionLabel icon={ImageOff} text={`Images (${viewDetails.images.length})`} />
                      {viewDetails.images.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                          {viewDetails.images.map((url, i) => (
                            <div key={i} className="relative rounded-xl overflow-hidden border border-[#E2DBD0]">
                              <img src={url} alt="" className="w-full aspect-square object-cover" />
                              {i === 0 && (
                                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-[#0B241C] text-[#C5A059] text-[9px] font-bold">
                                  Primary
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#5A7469] mt-3">No images uploaded.</p>
                      )}
                    </div>
                  )}

                  {/* Variants */}
                  {viewProduct.has_variants && (
                    <div>
                      <SectionLabel icon={Layers} text={`Variants (${viewDetails.variants.length})`} />
                      {viewDetails.variants.length > 0 ? (
                        <div className="space-y-4 mt-3">
                          {viewDetails.variants.map((v, index) => (
                            <div key={v.id} className="border border-[#E2DBD0] rounded-2xl p-4 bg-[#FAF8F5]/40">
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {index + 1}
                                  </span>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {v.color && (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[#E2DBD0] bg-white">
                                        <span
                                          className="w-3 h-3 rounded-full border border-[#E2DBD0]"
                                          style={{ backgroundColor: v.color.hex }}
                                        />
                                        <span className="font-semibold text-[#0B241C]">{v.color.name}</span>
                                      </span>
                                    )}
                                    {v.size && (
                                      <span className="px-2 py-1 rounded-lg border border-[#E2DBD0] bg-white font-semibold text-[#0B241C]">
                                        {v.size.name}
                                        {v.size.dimension ? ` · ${v.size.dimension}` : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${v.is_active
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-gray-100 text-gray-700 border-gray-300'
                                    }`}
                                >
                                  {v.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                                <StatBlock label="SKU" value={v.sku || '—'} />
                                <StatBlock label="Price" value={v.price != null ? `₹${v.price}` : '—'} />
                                <StatBlock
                                  label="Selling Price"
                                  value={v.selling_price != null ? `₹${v.selling_price}` : '—'}
                                />
                                <StatBlock label="Stock" value={v.stock != null ? String(v.stock) : '—'} />
                              </div>

                              {v.images.length > 0 && (
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
                                  {v.images.map((url, i) => (
                                    <div key={i} className="rounded-lg overflow-hidden border border-[#E2DBD0]">
                                      <img src={url} alt="" className="w-full aspect-square object-cover" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#5A7469] mt-3">No variants added.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------
function StatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'emerald' | 'amber' | 'rose';
}) {
  const toneStyles: Record<string, string> = {
    neutral: 'text-[#0B241C]',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    rose: 'text-rose-700',
  };
  return (
    <div className="bg-white rounded-2xl border border-[#E2DBD0] p-4">
      <p className={`text-2xl font-bold ${toneStyles[tone]}`}>{value}</p>
      <p className="text-[11px] text-[#5A7469] font-medium mt-0.5">{label}</p>
    </div>
  );
}

function SectionLabel({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-lg bg-[#0B241C] flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-[#C5A059]" />
      </div>
      <h3 className="font-bold text-[#0B241C] text-sm">{text}</h3>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 p-3">
      <span className="font-semibold text-[#5A7469]">{label}</span>
      <span className="col-span-2 font-medium text-[#0B241C]">{value}</span>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E2DBD0] bg-white p-2.5">
      <p className="text-[10px] text-[#5A7469] font-semibold">{label}</p>
      <p className="font-bold text-[#0B241C] mt-0.5">{value}</p>
    </div>
  );
}