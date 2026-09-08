'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

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
  created_at: string;
  updated_at: string;
  // Joined from product_images
  primary_image?: string | null;
};

type CategoryLite = { id: string; slug: string; title: string };
type SubcategoryLite = { id: string; category_id: string; name: string };

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryLite[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string; kind: 'success' | 'error' } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const showToast = (title: string, message: string, kind: 'success' | 'error') => {
    setToast({ title, message, kind });
    setTimeout(() => setToast(null), 4000);
  };

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
      ] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('id, slug, title').order('title'),
        supabase.from('subcategories').select('id, category_id, name').order('sort_order'),
      ]);

      const firstError = productError || catError || subError;
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

  const toggleActive = async (p: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !p.is_active })
      .eq('id', p.id);

    if (error) {
      showToast('Update failed', error.message, 'error');
    } else {
      showToast('Updated', `${p.name} is now ${!p.is_active ? 'active' : 'inactive'}.`, 'success');
      await fetchData();
    }
  };

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  const categoryTitle = (id: string | null) =>
    categories.find((c) => c.id === id)?.title?.trim() || '—';
  const subcategoryTitle = (id: string | null) =>
    subcategories.find((s) => s.id === id)?.name?.trim() || '';

  // ---------------------------------------------------------------
  // Derived: filtered list + quick stats
  // ---------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesActive =
        activeFilter === 'all' ||
        (activeFilter === 'active' && p.is_active) ||
        (activeFilter === 'inactive' && !p.is_active);
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q);
      return matchesActive && matchesQuery;
    });
  }, [products, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.is_active).length;
    const lowStock = products.filter((p) => p.is_active && p.stock > 0 && p.stock <= 5).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">Products</h1>
          <p className="text-xs sm:text-sm text-[#5A7469] mt-0.5">
            {stats.total} product{stats.total === 1 ? '' : 's'} in your catalog
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/products/add')}
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
            placeholder="Search by name, slug, or SKU…"
            className="w-full pl-8 pr-3 py-2.5 bg-white border border-[#E2DBD0] rounded-xl text-xs font-medium text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-3.5 py-2.5 bg-white border border-[#E2DBD0] rounded-xl text-xs font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
        >
          <option value="all">All products</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
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
                <th className="p-3 font-bold">Price</th>
                <th className="p-3 font-bold">Stock</th>
                <th className="p-3 font-bold">Type</th>
                <th className="p-3 font-bold">Status</th>
                <th className="p-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="p-10">
                    <div className="flex items-center justify-center gap-2 text-[#5A7469]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading products…</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !loadError && filteredProducts.length === 0 && products.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-center">
                        <Package className="w-4 h-4 text-[#C5A059]" />
                      </div>
                      <p className="font-bold text-[#0B241C]">No products yet</p>
                      <p className="text-[#5A7469]">Add your first piece to start building the catalog.</p>
                      <button
                        onClick={() => router.push('/admin/products/add')}
                        className="mt-1 px-4 py-2 rounded-xl bg-[#0B241C] hover:bg-[#123528] text-white font-semibold flex items-center gap-1.5 cursor-pointer"
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
                  <td colSpan={7} className="p-10 text-center text-[#5A7469]">
                    No products match "{searchQuery}"{activeFilter !== 'all' ? ` (${activeFilter})` : ''}.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredProducts.map((p) => (
                  <tr key={p.id} className="border-b border-[#EFEBE3] hover:bg-[#FAF8F5]/60">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        {p.primary_image ? (
                          <img
                            src={p.primary_image}
                            alt={p.name}
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
                          <p className="font-bold text-[#0B241C]">{p.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10px] text-[#5A7469]">{p.sku || p.slug}</p>
                            {p.is_featured && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                ★ Featured
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
                    <td className="p-3">
                      {p.selling_price && p.price && p.selling_price < p.price ? (
                        <>
                          <span className="font-bold text-[#0B241C]">₹{p.selling_price}</span>{' '}
                          <span className="line-through text-[#5A7469]">₹{p.price}</span>
                        </>
                      ) : (
                        <span className="font-bold text-[#0B241C]">
                          {p.selling_price ? `₹${p.selling_price}` : p.price ? `₹${p.price}` : '—'}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={p.stock <= 5 && p.stock > 0 ? 'text-amber-700 font-bold' : 'text-[#2C4A3E]'}>
                        {p.has_variants ? '—' : p.stock}
                      </span>
                    </td>
                    <td className="p-3 text-[#2C4A3E]">
                      {p.has_variants ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Variants
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-[#5A7469]">Simple</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleActive(p)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-colors ${
                          p.is_active
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {p.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => router.push(`/admin/products/add?id=${p.id}`)}
                          className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-white border border-[#E2DBD0] text-[#0B241C] cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-rose-50 border border-[#E2DBD0] text-rose-700 cursor-pointer"
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