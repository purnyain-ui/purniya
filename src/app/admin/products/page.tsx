'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Upload,
  Edit2,
  Trash2,
  X,
  Loader2,
  ImageOff,
  Tag as TagIcon,
  Search,
  AlertTriangle,
  Package,
  RefreshCw,
} from 'lucide-react';
import { supabase, PRODUCT_IMAGES_BUCKET } from '../../../lib/supabaseClient';

// Never render <img src=""> — falls back to this instead.
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&fit=crop&auto=format';

// ---------------------------------------------------------------
// Types matching the Supabase tables
// ---------------------------------------------------------------
type ProductStatus = 'draft' | 'active' | 'out_of_stock' | 'archived';

type ProductVariant = {
  size_id?: string | null;
  color_id?: string | null;
  sku?: string;
  stock: number;
  price_override?: number | null;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  images: string[];
  price: number;
  offer_price: number | null;
  stock: number;
  variants: ProductVariant[];
  status: ProductStatus;
  category_id: string | null;
  subcategory_id: string | null;
  collection_id: string | null;
  sale_tag_id?: string | null;
  tags: string[];
};

type CategoryLite = { id: string; slug: string; title: string };
type SubcategoryLite = { id: string; category_id: string; name: string };
type CollectionLite = { id: string; slug: string; title: string };
type SizeVariantLite = { id: string; name: string; category: string; dimension: string };
type ColorPaletteLite = { id: string; name: string; hex: string; category: string };
type LifestyleTagLite = { id: string; name: string; is_active?: boolean };

const STATUS_STYLES: Record<ProductStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-300',
  active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  out_of_stock: 'bg-rose-100 text-rose-800 border-rose-300',
  archived: 'bg-amber-100 text-amber-900 border-amber-300',
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  out_of_stock: 'Out of stock',
  archived: 'Archived',
};

const EMPTY_FORM = {
  title: '',
  slug: '',
  description: '',
  price: '',
  offer_price: '',
  stock: '50',
  status: 'active' as ProductStatus,
  category_id: '',
  subcategory_id: '',
  collection_id: '',
  sale_tag_id: '',
  tags: '' as string, // comma-separated in the UI
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryLite[]>([]);
  const [collections, setCollections] = useState<CollectionLite[]>([]);
  const [sizeVariants, setSizeVariants] = useState<SizeVariantLite[]>([]);
  const [colorPalettes, setColorPalettes] = useState<ColorPaletteLite[]>([]);
  const [lifestyleTags, setLifestyleTags] = useState<LifestyleTagLite[]>([]);

  // `loading` only gates the table body now — header + Add button
  // always render, so the page never feels "stuck" or broken.
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; kind: 'success' | 'error' } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');

  const showToast = (title: string, message: string, kind: 'success' | 'error') => {
    setToast({ title, message, kind });
    setTimeout(() => setToast(null), 4000);
  };

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Images: existing URLs (editable list) + newly picked files pending upload
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // Variant builder
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantSizeId, setVariantSizeId] = useState('');
  const [variantColorId, setVariantColorId] = useState('');
  const [variantSku, setVariantSku] = useState('');
  const [variantStock, setVariantStock] = useState('');
  const [variantPriceOverride, setVariantPriceOverride] = useState('');

  // ---------------------------------------------------------------
  // Fetch everything
  //
  // BUG FIX: the previous version awaited Promise.all with no
  // try/catch. If a single query failed for any reason (RLS,
  // network hiccup, a renamed column) the whole promise rejected,
  // the catch block never ran, and setLoading(false) was never
  // called — the page stayed on the loading spinner forever and
  // the "Add Product" button never appeared. Every request is now
  // wrapped, loading always resolves, and failures surface as a
  // dismissible banner instead of a silent hang.
  // ---------------------------------------------------------------
  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [
        { data: productData, error: productError },
        { data: catData, error: catError },
        { data: subData, error: subError },
        { data: collData, error: collError },
        { data: sizeData, error: sizeError },
        { data: colorData, error: colorError },
        { data: tagData, error: tagError },
      ] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('id, slug, title').order('title'),
        supabase.from('subcategories').select('id, category_id, name').order('sort_order'),
        supabase.from('collections').select('id, slug, title').order('sort_order'),
        supabase.from('size_variants').select('id, name, category, dimension').eq('is_active', true).order('name'),
        supabase.from('color_palettes').select('id, name, hex, category').eq('is_active', true).order('name'),
        supabase.from('lifestyle_sale_tags').select('id, name, is_active').order('name'),
      ]);

      const firstError = productError || catError || subError || collError || sizeError || colorError || tagError;
      if (firstError) throw firstError;

      setProducts(productData || []);
      setCategories(catData || []);
      setSubcategories(subData || []);
      setCollections(collData || []);
      setSizeVariants(sizeData || []);
      setColorPalettes(colorData || []);
      setLifestyleTags(tagData || []);
    } catch (err: any) {
      setLoadError(err?.message || 'Could not reach Supabase. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [
          { data: productData, error: productError },
          { data: catData, error: catError },
          { data: subData, error: subError },
          { data: collData, error: collError },
          { data: sizeData, error: sizeError },
          { data: colorData, error: colorError },
          { data: tagData, error: tagError },
        ] = await Promise.all([
          supabase.from('products').select('*').order('created_at', { ascending: false }),
          supabase.from('categories').select('id, slug, title').order('title'),
          supabase.from('subcategories').select('id, category_id, name').order('sort_order'),
          supabase.from('collections').select('id, slug, title').order('sort_order'),
          supabase.from('size_variants').select('id, name, category, dimension').eq('is_active', true).order('name'),
          supabase.from('color_palettes').select('id, name, hex, category').eq('is_active', true).order('name'),
          supabase.from('lifestyle_sale_tags').select('id, name, is_active').order('name'),
        ]);

        const firstError = productError || catError || subError || collError || sizeError || colorError || tagError;
        if (firstError) throw firstError;

        if (active) {
          setProducts(productData || []);
          setCategories(catData || []);
          setSubcategories(subData || []);
          setCollections(collData || []);
          setSizeVariants(sizeData || []);
          setColorPalettes(colorData || []);
          setLifestyleTags(tagData || []);
        }
      } catch (err: any) {
        if (active) {
          setLoadError(err?.message || 'Could not reach Supabase. Check your connection and try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // ---------------------------------------------------------------
  // Image upload helper
  // ---------------------------------------------------------------
  const uploadImageToBucket = async (file: File, pathPrefix: string): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file (PNG, JPG, WEBP, etc.).');
    }
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handlePickImages = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files);
    setNewImageFiles((prev) => [...prev, ...picked]);
    picked.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setNewImagePreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (url: string) => setExistingImages((prev) => prev.filter((u) => u !== url));
  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ---------------------------------------------------------------
  // Modal open/close
  // ---------------------------------------------------------------
  const resetModalState = () => {
    setForm(EMPTY_FORM);
    setExistingImages([]);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setVariants([]);
    setVariantSizeId('');
    setVariantColorId('');
    setVariantSku('');
    setVariantStock('');
    setVariantPriceOverride('');
  };

  // Always available — not blocked by data-loading state, so it
  // works even if categories/collections failed to load (the form
  // will just show empty dropdowns and the load-error banner).
  const handleOpenAdd = () => {
    setEditingProduct(null);
    resetModalState();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    const matchedTagId =
      p.sale_tag_id || lifestyleTags.find((t) => (p.tags || []).includes(t.name))?.id || '';

    setForm({
      title: p.title,
      slug: p.slug,
      description: p.description || '',
      price: String(p.price ?? ''),
      offer_price: p.offer_price != null ? String(p.offer_price) : '',
      stock: String(p.stock ?? ''),
      status: p.status,
      category_id: p.category_id || '',
      subcategory_id: p.subcategory_id || '',
      collection_id: p.collection_id || '',
      sale_tag_id: matchedTagId,
      tags: (p.tags || []).join(', '),
    });
    setExistingImages(p.images || []);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setVariants(p.variants || []);
    setIsModalOpen(true);
  };

  const availableSubcategories = subcategories.filter((s) => s.category_id === form.category_id);

  // ---------------------------------------------------------------
  // Variant builder
  // ---------------------------------------------------------------
  const handleAddVariant = () => {
    if (!variantSizeId && !variantColorId) {
      showToast('Pick an option', 'Choose a size and/or color for the variant.', 'error');
      return;
    }
    setVariants((prev) => [
      ...prev,
      {
        size_id: variantSizeId || null,
        color_id: variantColorId || null,
        sku: variantSku.trim() || undefined,
        stock: Number(variantStock) || 0,
        price_override: variantPriceOverride ? Number(variantPriceOverride) : null,
      },
    ]);
    setVariantSizeId('');
    setVariantColorId('');
    setVariantSku('');
    setVariantStock('');
    setVariantPriceOverride('');
  };

  const removeVariant = (index: number) => setVariants((prev) => prev.filter((_, i) => i !== index));

  const sizeName = (id?: string | null) => sizeVariants.find((s) => s.id === id)?.name;
  const colorName = (id?: string | null) => colorPalettes.find((c) => c.id === id)?.name;
  const colorHex = (id?: string | null) => colorPalettes.find((c) => c.id === id)?.hex;

  // ---------------------------------------------------------------
  // Save (insert or update)
  // ---------------------------------------------------------------
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      showToast('Title needed', 'Give the product a title before saving.', 'error');
      return;
    }
    if (!form.category_id) {
      showToast('Category needed', 'Choose a category before saving.', 'error');
      return;
    }

    setSaving(true);
    try {
      const slug = form.slug.trim() ? slugify(form.slug) : slugify(form.title);

      // Upload any newly picked files
      const uploadedUrls: string[] = [];
      for (const file of newImageFiles) {
        const url = await uploadImageToBucket(file, `products/${slug}`);
        uploadedUrls.push(url);
      }
      const finalImages = [...existingImages, ...uploadedUrls];

      const chosenTag = lifestyleTags.find((t) => t.id === form.sale_tag_id);
      const tagsArray = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (chosenTag && !tagsArray.includes(chosenTag.name)) {
        tagsArray.unshift(chosenTag.name);
      }

      const payload = {
        title: form.title.trim(),
        slug,
        description: form.description.trim() || null,
        images: finalImages,
        price: Number(form.price) || 0,
        offer_price: form.offer_price ? Number(form.offer_price) : null,
        stock: Number(form.stock) || 0,
        variants,
        status: form.status,
        category_id: form.category_id,
        subcategory_id: form.subcategory_id || null,
        collection_id: form.collection_id || null,
        sale_tag_id: form.sale_tag_id || null,
        tags: tagsArray,
      };

      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        showToast('Saved', `${payload.title} was updated.`, 'success');
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        showToast('Added', `${payload.title} was created.`, 'success');
      }

      setIsModalOpen(false);
      await fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('purnya_catalog_updated'));
      }
    } catch (err: any) {
      showToast('Save failed', err.message || 'Could not save this product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) {
      showToast('Delete failed', error.message, 'error');
    } else {
      showToast('Deleted', `${p.title} was removed.`, 'success');
      await fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('purnya_catalog_updated'));
      }
    }
  };

  const categoryTitle = (id: string | null) => categories.find((c) => c.id === id)?.title?.trim() || '—';
  const subcategoryTitle = (id: string | null) => subcategories.find((s) => s.id === id)?.name?.trim() || '';
  const collectionTitle = (id: string | null) => collections.find((c) => c.id === id)?.title?.trim() || '—';
  const tagTitle = (id?: string | null, tags?: string[]) => {
    if (id) {
      const found = lifestyleTags.find((t) => t.id === id);
      if (found) return found.name;
    }
    if (tags && tags.length > 0) {
      const matched = lifestyleTags.find((t) => tags.includes(t.name));
      if (matched) return matched.name;
      return tags[0];
    }
    return '';
  };

  // ---------------------------------------------------------------
  // Derived: filtered list + quick stats
  // ---------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [products, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.status === 'active').length;
    const lowStock = products.filter((p) => p.status !== 'archived' && p.stock > 0 && p.stock <= 5).length;
    const outOfStock = products.filter((p) => p.status === 'out_of_stock' || p.stock === 0).length;
    return { total: products.length, active, lowStock, outOfStock };
  }, [products]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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

      {/* Header — always rendered, independent of data-loading state */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">Products</h1>
          <p className="text-xs sm:text-sm text-[#5A7469] mt-0.5">
            {stats.total} product{stats.total === 1 ? '' : 's'} · images upload to{' '}
            <code className="text-[#2C4A3E]">{PRODUCT_IMAGES_BUCKET}</code>
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#123528] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Data load error banner — replaces the old infinite spinner */}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total products" value={stats.total} />
          <StatCard label="Active" value={stats.active} tone="emerald" />
          <StatCard label="Low stock (≤5)" value={stats.lowStock} tone="amber" />
          <StatCard label="Out of stock" value={stats.outOfStock} tone="rose" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#8A9A92] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, slug, or tag…"
            className="w-full pl-8 pr-3 py-2.5 bg-white border border-[#E2DBD0] rounded-xl text-xs font-medium text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProductStatus | 'all')}
          className="px-3.5 py-2.5 bg-white border border-[#E2DBD0] rounded-xl text-xs font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="out_of_stock">Out of stock</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#E2DBD0] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] text-[#5A7469] text-left border-b border-[#E2DBD0]">
                <th className="p-3 font-bold">Product</th>
                <th className="p-3 font-bold">Category</th>
                <th className="p-3 font-bold">Collection</th>
                <th className="p-3 font-bold">Price</th>
                <th className="p-3 font-bold">Stock</th>
                <th className="p-3 font-bold">Variants</th>
                <th className="p-3 font-bold">Status</th>
                <th className="p-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="p-10">
                    <div className="flex items-center justify-center gap-2 text-[#5A7469]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading products…</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !loadError && filteredProducts.length === 0 && products.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-center">
                        <Package className="w-4 h-4 text-[#C5A059]" />
                      </div>
                      <p className="font-bold text-[#0B241C]">No products yet</p>
                      <p className="text-[#5A7469]">Add your first piece to start building the catalog.</p>
                      <button
                        onClick={handleOpenAdd}
                        className="mt-1 px-4 py-2 rounded-xl bg-[#0B241C] hover:bg-[#123528] text-white font-semibold flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Product
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !loadError && filteredProducts.length === 0 && products.length > 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[#5A7469]">
                    No products match "{searchQuery}"{statusFilter !== 'all' ? ` in ${STATUS_LABELS[statusFilter]}` : ''}.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredProducts.map((p) => (
                  <tr key={p.id} className="border-b border-[#EFEBE3] hover:bg-[#FAF8F5]/60">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            className="w-10 h-10 rounded-lg object-cover border border-[#E2DBD0]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-center">
                            <ImageOff className="w-4 h-4 text-[#C5A059]" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-[#0B241C]">{p.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10px] text-[#5A7469]">{p.slug}</p>
                            {tagTitle(p.sale_tag_id, p.tags) && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FAF8F5] text-[#0B241C] border border-[#E2DBD0]">
                                #{tagTitle(p.sale_tag_id, p.tags)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-[#2C4A3E]">
                      <p className="font-semibold">{categoryTitle(p.category_id)}</p>
                      {subcategoryTitle(p.subcategory_id) && (
                        <p className="text-[10px] text-[#5A7469]">{subcategoryTitle(p.subcategory_id)}</p>
                      )}
                    </td>
                    <td className="p-3 text-[#2C4A3E]">{collectionTitle(p.collection_id)}</td>
                    <td className="p-3">
                      {p.offer_price ? (
                        <>
                          <span className="font-bold text-[#0B241C]">₹{p.offer_price}</span>{' '}
                          <span className="line-through text-[#5A7469]">₹{p.price}</span>
                        </>
                      ) : (
                        <span className="font-bold text-[#0B241C]">₹{p.price}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={p.stock <= 5 && p.stock > 0 ? 'text-amber-700 font-bold' : 'text-[#2C4A3E]'}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-3 text-[#2C4A3E]">{p.variants?.length || 0}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[p.status]}`}
                      >
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-white border border-[#E2DBD0] text-[#0B241C]"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-rose-50 border border-[#E2DBD0] text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 space-y-5 border border-[#E2DBD0] shadow-2xl text-xs max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3]">
              <h3 className="font-serif-title text-base font-bold text-[#0B241C]">
                {editingProduct ? `Edit Product: ${editingProduct.title}` : 'Add New Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#5A7469] hover:text-[#0B241C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p>Categories and collections couldn't be loaded, so those dropdowns may be empty. Fix the connection and reopen this form.</p>
              </div>
            )}

            {/* Title + Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#0B241C] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                  placeholder="e.g. Baroque Pearl Choker"
                />
              </div>
              <div>
                <label className="block font-bold text-[#0B241C] mb-1">Slug (auto if left blank)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder={form.title ? slugify(form.title) : 'baroque-pearl-choker'}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-medium text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-[#0B241C] mb-1">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-medium text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            {/* Price / Offer Price / Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-[#0B241C] mb-1">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#0B241C] mb-1">Offer Price (₹, optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.offer_price}
                  onChange={(e) => setForm({ ...form, offer_price: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#0B241C] mb-1">Stock</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            {/* Status / Lifestyle Tag / Category / Subcategory / Collection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#0B241C] mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="active">Active (Visible in Store)</option>
                  <option value="draft">Draft</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1 flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-[#C5A059]" /> Lifestyle Tag
                </label>
                <select
                  value={form.sale_tag_id}
                  onChange={(e) => setForm({ ...form, sale_tag_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="">— None (No Tag) —</option>
                  {lifestyleTags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1">Category *</label>
                <select
                  required
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value, subcategory_id: '' })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="">— Select Category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1">Subcategory</label>
                <select
                  value={form.subcategory_id}
                  onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
                  disabled={!form.category_id}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059] disabled:opacity-50"
                >
                  <option value="">— Select Subcategory —</option>
                  {availableSubcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[#0B241C] mb-1">Collection (Optional)</label>
                <select
                  value={form.collection_id}
                  onChange={(e) => setForm({ ...form, collection_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="">— None —</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Search Keywords / Tags */}
            <div>
              <label className="block font-bold text-[#0B241C] mb-1 flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5 text-[#C5A059]" /> Additional Tags (comma-separated keywords)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="bestseller, festive, handcrafted"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-medium text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <label className="block font-bold text-[#0B241C]">Images</label>

              {(existingImages.length > 0 || newImagePreviews.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((url) => (
                    <div key={url} className="relative w-16 h-16">
                      <img src={url} className="w-16 h-16 rounded-lg object-cover border border-[#E2DBD0]" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {newImagePreviews.map((src, i) => (
                    <div key={i} className="relative w-16 h-16">
                      <img src={src} className="w-16 h-16 rounded-lg object-cover border-2 border-[#C5A059]" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(i)}
                        className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="block p-4 rounded-2xl border-2 border-dashed border-[#E2DBD0] hover:border-[#C5A059] bg-[#FAF8F5] transition-colors text-center cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handlePickImages(e.target.files)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="space-y-1">
                  <Upload className="w-6 h-6 text-[#C5A059] mx-auto" />
                  <p className="font-bold text-[#0B241C]">Click or drag to upload (multiple allowed)</p>
                  <p className="text-[10px] text-[#5A7469]">
                    Uploads to <code>{PRODUCT_IMAGES_BUCKET}</code> on save
                  </p>
                </div>
              </label>
            </div>

            {/* Variants */}
            <div className="space-y-2">
              <label className="block font-bold text-[#0B241C]">Variants</label>

              {variants.length > 0 && (
                <div className="space-y-1.5">
                  {variants.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E2DBD0]"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {v.size_id && (
                          <span className="px-2 py-0.5 rounded-full bg-white border border-[#E2DBD0] font-semibold">
                            {sizeName(v.size_id)}
                          </span>
                        )}
                        {v.color_id && (
                          <span className="px-2 py-0.5 rounded-full bg-white border border-[#E2DBD0] font-semibold flex items-center gap-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10"
                              style={{ backgroundColor: colorHex(v.color_id) }}
                            />
                            {colorName(v.color_id)}
                          </span>
                        )}
                        {v.sku && <span className="text-[#5A7469]">SKU: {v.sku}</span>}
                        <span className="text-[#5A7469]">Stock: {v.stock}</span>
                        {v.price_override != null && (
                          <span className="text-[#5A7469]">Price: ₹{v.price_override}</span>
                        )}
                      </div>
                      <button type="button" onClick={() => removeVariant(i)} className="text-rose-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0]">
                <select
                  value={variantSizeId}
                  onChange={(e) => setVariantSizeId(e.target.value)}
                  className="px-2 py-2 bg-white border border-[#E2DBD0] rounded-lg text-xs"
                >
                  <option value="">Size…</option>
                  {sizeVariants.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.dimension})
                    </option>
                  ))}
                </select>
                <select
                  value={variantColorId}
                  onChange={(e) => setVariantColorId(e.target.value)}
                  className="px-2 py-2 bg-white border border-[#E2DBD0] rounded-lg text-xs"
                >
                  <option value="">Color…</option>
                  {colorPalettes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="SKU"
                  value={variantSku}
                  onChange={(e) => setVariantSku(e.target.value)}
                  className="px-2 py-2 bg-white border border-[#E2DBD0] rounded-lg text-xs"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Stock"
                  value={variantStock}
                  onChange={(e) => setVariantStock(e.target.value)}
                  className="px-2 py-2 bg-white border border-[#E2DBD0] rounded-lg text-xs"
                />
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min="0"
                    placeholder="₹ override"
                    value={variantPriceOverride}
                    onChange={(e) => setVariantPriceOverride(e.target.value)}
                    className="px-2 py-2 bg-white border border-[#E2DBD0] rounded-lg text-xs w-full"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-2.5 rounded-lg bg-[#0B241C] hover:bg-[#123528] text-white shrink-0"
                    title="Add variant"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EFEBE3] sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E2DBD0] text-[#5A7469] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#0B241C] hover:bg-[#123528] text-white font-bold transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingProduct ? 'Save changes' : 'Add product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Small presentational helper for the stats strip
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