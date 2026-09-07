'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Loader2,
  ImageOff,
  Search,
  AlertTriangle,
  Package,
  RefreshCw,
  Minus,
  Plus,
  X,
  Boxes,
  PackageX,
  PackageCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

// Never render <img src=""> — falls back to this instead.
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&fit=crop&auto=format';

const LOW_STOCK_THRESHOLD = 5;

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
  images: string[];
  stock: number;
  variants: ProductVariant[];
  status: ProductStatus;
  category_id: string | null;
};

type CategoryLite = { id: string; slug: string; title: string };
type SizeVariantLite = { id: string; name: string; category: string; dimension: string };
type ColorPaletteLite = { id: string; name: string; hex: string; category: string };

type StockFilter = 'all' | 'in_stock' | 'low' | 'out';

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

const totalStockFor = (p: Product) =>
  p.variants && p.variants.length > 0 ? p.variants.reduce((sum, v) => sum + (v.stock || 0), 0) : p.stock || 0;

const stockTone = (units: number) => (units === 0 ? 'rose' : units <= LOW_STOCK_THRESHOLD ? 'amber' : 'emerald');

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [sizeVariants, setSizeVariants] = useState<SizeVariantLite[]>([]);
  const [colorPalettes, setColorPalettes] = useState<ColorPaletteLite[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string; kind: 'success' | 'error' } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  // Adjust modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [draftStock, setDraftStock] = useState<string>('');
  const [draftVariants, setDraftVariants] = useState<ProductVariant[]>([]);

  const showToast = (title: string, message: string, kind: 'success' | 'error') => {
    setToast({ title, message, kind });
    setTimeout(() => setToast(null), 4000);
  };

  // ---------------------------------------------------------------
  // Fetch everything. Every request is wrapped so a single failed
  // query (RLS, network hiccup, renamed column) surfaces as a
  // dismissible banner instead of leaving the page on a spinner
  // forever.
  // ---------------------------------------------------------------
  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [
        { data: productData, error: productError },
        { data: catData, error: catError },
        { data: sizeData, error: sizeError },
        { data: colorData, error: colorError },
      ] = await Promise.all([
        supabase
          .from('products')
          .select('id, title, slug, images, stock, variants, status, category_id')
          .order('title'),
        supabase.from('categories').select('id, slug, title').order('title'),
        supabase.from('size_variants').select('id, name, category, dimension').eq('is_active', true).order('name'),
        supabase.from('color_palettes').select('id, name, hex, category').eq('is_active', true).order('name'),
      ]);

      const firstError = productError || catError || sizeError || colorError;
      if (firstError) throw firstError;

      setProducts(productData || []);
      setCategories(catData || []);
      setSizeVariants(sizeData || []);
      setColorPalettes(colorData || []);
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
          { data: sizeData, error: sizeError },
          { data: colorData, error: colorError },
        ] = await Promise.all([
          supabase
            .from('products')
            .select('id, title, slug, images, stock, variants, status, category_id')
            .order('title'),
          supabase.from('categories').select('id, slug, title').order('title'),
          supabase.from('size_variants').select('id, name, category, dimension').eq('is_active', true).order('name'),
          supabase.from('color_palettes').select('id, name, hex, category').eq('is_active', true).order('name'),
        ]);

        const firstError = productError || catError || sizeError || colorError;
        if (firstError) throw firstError;

        if (active) {
          setProducts(productData || []);
          setCategories(catData || []);
          setSizeVariants(sizeData || []);
          setColorPalettes(colorData || []);
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

  const sizeName = (id?: string | null) => sizeVariants.find((s) => s.id === id)?.name;
  const colorName = (id?: string | null) => colorPalettes.find((c) => c.id === id)?.name;
  const colorHex = (id?: string | null) => colorPalettes.find((c) => c.id === id)?.hex;
  const categoryTitle = (id: string | null) => categories.find((c) => c.id === id)?.title || '—';

  // ---------------------------------------------------------------
  // Persist a stock change. Also flips status to/from out_of_stock
  // automatically so the storefront stays in sync with reality.
  // ---------------------------------------------------------------
  const persistStock = async (product: Product, newStock: number, newVariants: ProductVariant[] | null) => {
    setSavingId(product.id);
    try {
      const nextStatus: ProductStatus =
        newStock <= 0 && product.status !== 'archived' && product.status !== 'draft' ? 'out_of_stock' : product.status;
      const revivedStatus: ProductStatus =
        newStock > 0 && product.status === 'out_of_stock' ? 'active' : nextStatus;

      const payload: Record<string, any> = { stock: newStock, status: revivedStatus };
      if (newVariants) payload.variants = newVariants;

      const { error } = await supabase.from('products').update(payload).eq('id', product.id);
      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, stock: newStock, variants: newVariants ?? p.variants, status: revivedStatus } : p
        )
      );
      showToast('Stock updated', `${product.title} now has ${newStock} unit${newStock === 1 ? '' : 's'}.`, 'success');
    } catch (err: any) {
      showToast('Update failed', err?.message || 'Could not update this stock level.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  // Quick +/- 1 on the base stock number, for products without variants.
  const nudgeStock = (product: Product, delta: number) => {
    if (product.variants && product.variants.length > 0) return;
    const next = Math.max(0, (product.stock || 0) + delta);
    persistStock(product, next, null);
  };

  // ---------------------------------------------------------------
  // Adjust modal (per-variant editing, or base stock if no variants)
  // ---------------------------------------------------------------
  const openAdjust = (product: Product) => {
    setAdjustingProduct(product);
    setDraftStock(String(product.stock ?? 0));
    setDraftVariants(product.variants ? product.variants.map((v) => ({ ...v })) : []);
  };

  const closeAdjust = () => {
    setAdjustingProduct(null);
    setDraftStock('');
    setDraftVariants([]);
  };

  const updateDraftVariantStock = (index: number, value: string) => {
    const n = Math.max(0, Number(value) || 0);
    setDraftVariants((prev) => prev.map((v, i) => (i === index ? { ...v, stock: n } : v)));
  };

  const handleSaveAdjust = async () => {
    if (!adjustingProduct) return;
    const hasVariants = draftVariants.length > 0;
    const newStock = hasVariants
      ? draftVariants.reduce((sum, v) => sum + (v.stock || 0), 0)
      : Math.max(0, Number(draftStock) || 0);
    await persistStock(adjustingProduct, newStock, hasVariants ? draftVariants : null);
    closeAdjust();
  };

  // ---------------------------------------------------------------
  // Derived: filtered list + stats
  // ---------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const units = totalStockFor(p);
      const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'out' && units === 0) ||
        (stockFilter === 'low' && units > 0 && units <= LOW_STOCK_THRESHOLD) ||
        (stockFilter === 'in_stock' && units > LOW_STOCK_THRESHOLD);
      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, stockFilter]);

  const stats = useMemo(() => {
    const totalUnits = products.reduce((sum, p) => sum + totalStockFor(p), 0);
    const low = products.filter((p) => {
      const u = totalStockFor(p);
      return u > 0 && u <= LOW_STOCK_THRESHOLD;
    }).length;
    const out = products.filter((p) => totalStockFor(p) === 0).length;
    return { totalUnits, skus: products.length, low, out };
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
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">Inventory</h1>
          <p className="text-xs sm:text-sm text-[#5A7469] mt-0.5">
            {stats.skus} product{stats.skus === 1 ? '' : 's'} · {stats.totalUnits} unit
            {stats.totalUnits === 1 ? '' : 's'} on hand
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#123528] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Data load error banner */}
      {loadError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-800">Couldn't load your stock data</p>
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
          <StatCard icon={Boxes} label="Units on hand" value={stats.totalUnits} />
          <StatCard icon={Package} label="Tracked SKUs" value={stats.skus} />
          <StatCard icon={AlertTriangle} label={`Low stock (≤${LOW_STOCK_THRESHOLD})`} value={stats.low} tone="amber" />
          <StatCard icon={PackageX} label="Out of stock" value={stats.out} tone="rose" />
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
            placeholder="Search by title or slug…"
            className="w-full pl-8 pr-3 py-2.5 bg-white border border-[#E2DBD0] rounded-xl text-xs font-medium text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-[#E2DBD0] rounded-xl text-xs font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as StockFilter)}
          className="px-3.5 py-2.5 bg-white border border-[#E2DBD0] rounded-xl text-xs font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
        >
          <option value="all">All stock levels</option>
          <option value="in_stock">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-[#E2DBD0] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] text-[#5A7469] text-left border-b border-[#E2DBD0]">
                <th className="p-3 font-bold">Product</th>
                <th className="p-3 font-bold">Category</th>
                <th className="p-3 font-bold">Breakdown</th>
                <th className="p-3 font-bold">Units</th>
                <th className="p-3 font-bold">Status</th>
                <th className="p-3 font-bold text-right">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="p-10">
                    <div className="flex items-center justify-center gap-2 text-[#5A7469]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading stock levels…</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !loadError && filteredProducts.length === 0 && products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-center">
                        <PackageCheck className="w-4 h-4 text-[#C5A059]" />
                      </div>
                      <p className="font-bold text-[#0B241C]">No products to track yet</p>
                      <p className="text-[#5A7469]">Add products from the Products page and stock will show up here.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !loadError && filteredProducts.length === 0 && products.length > 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[#5A7469]">
                    No products match these filters.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredProducts.map((p) => {
                  const units = totalStockFor(p);
                  const tone = stockTone(units);
                  const hasVariants = p.variants && p.variants.length > 0;
                  const isSaving = savingId === p.id;
                  return (
                    <tr key={p.id} className="border-b border-[#EFEBE3] hover:bg-[#FAF8F5]/60 align-top">
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
                            <p className="text-[10px] text-[#5A7469]">{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-[#2C4A3E]">{categoryTitle(p.category_id)}</td>
                      <td className="p-3">
                        {hasVariants ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {p.variants.map((v, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold flex items-center gap-1 ${v.stock === 0
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : v.stock <= LOW_STOCK_THRESHOLD
                                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                                      : 'bg-[#FAF8F5] border-[#E2DBD0] text-[#2C4A3E]'
                                  }`}
                              >
                                {v.color_id && (
                                  <span
                                    className="w-2 h-2 rounded-full border border-black/10"
                                    style={{ backgroundColor: colorHex(v.color_id) }}
                                  />
                                )}
                                {[sizeName(v.size_id), colorName(v.color_id)].filter(Boolean).join(' / ') || 'Base'}: {v.stock}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#8A9A92]">No variants</span>
                        )}
                      </td>
                      <td className="p-3">
                        {hasVariants ? (
                          <span
                            className={`font-bold ${tone === 'rose' ? 'text-rose-700' : tone === 'amber' ? 'text-amber-700' : 'text-[#0B241C]'
                              }`}
                          >
                            {units}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => nudgeStock(p, -1)}
                              disabled={isSaving || units === 0}
                              className="p-1 rounded-md bg-[#FAF8F5] border border-[#E2DBD0] text-[#0B241C] disabled:opacity-40"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span
                              className={`font-bold w-6 text-center ${tone === 'rose' ? 'text-rose-700' : tone === 'amber' ? 'text-amber-700' : 'text-[#0B241C]'
                                }`}
                            >
                              {isSaving ? <Loader2 className="w-3 h-3 animate-spin inline" /> : units}
                            </span>
                            <button
                              onClick={() => nudgeStock(p, 1)}
                              disabled={isSaving}
                              className="p-1 rounded-md bg-[#FAF8F5] border border-[#E2DBD0] text-[#0B241C] disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[p.status]}`}
                        >
                          {STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => openAdjust(p)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-white border border-[#E2DBD0] text-[#0B241C] font-semibold"
                          title="Adjust stock"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust stock modal */}
      {adjustingProduct && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAdjust();
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-[#E2DBD0] shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3]">
              <h3 className="font-serif-title text-base font-bold text-[#0B241C]">
                Adjust Stock: {adjustingProduct.title}
              </h3>
              <button onClick={closeAdjust} className="p-1 rounded-lg text-[#5A7469] hover:text-[#0B241C]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {draftVariants.length > 0 ? (
              <div className="space-y-2">
                <p className="font-bold text-[#0B241C]">Per-variant stock</p>
                {draftVariants.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E2DBD0]"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {v.color_id && (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/10"
                          style={{ backgroundColor: colorHex(v.color_id) }}
                        />
                      )}
                      <span className="font-semibold text-[#0B241C]">
                        {[sizeName(v.size_id), colorName(v.color_id)].filter(Boolean).join(' / ') || 'Base'}
                      </span>
                      {v.sku && <span className="text-[#5A7469]">SKU: {v.sku}</span>}
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => updateDraftVariantStock(i, e.target.value)}
                      className="w-20 px-2 py-1.5 bg-white border border-[#E2DBD0] rounded-lg text-xs font-bold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                ))}
                <p className="text-[#5A7469] pt-1">
                  Total will update to{' '}
                  <span className="font-bold text-[#0B241C]">
                    {draftVariants.reduce((sum, v) => sum + (v.stock || 0), 0)}
                  </span>{' '}
                  units.
                </p>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-[#0B241C] mb-1">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={draftStock}
                  onChange={(e) => setDraftStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-bold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EFEBE3]">
              <button
                onClick={closeAdjust}
                className="px-4 py-2 rounded-xl border border-[#E2DBD0] text-[#5A7469] font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdjust}
                disabled={savingId === adjustingProduct.id}
                className="px-5 py-2 rounded-xl bg-[#0B241C] hover:bg-[#123528] text-white font-bold transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {savingId === adjustingProduct.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Small presentational helper for the stats strip
// ---------------------------------------------------------------
function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: React.ComponentType<{ className?: string }>;
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
      <div className="flex items-center justify-between">
        <p className={`text-2xl font-bold ${toneStyles[tone]}`}>{value}</p>
        <Icon className={`w-4 h-4 ${toneStyles[tone]} opacity-60`} />
      </div>
      <p className="text-[11px] text-[#5A7469] font-medium mt-0.5">{label}</p>
    </div>
  );
}