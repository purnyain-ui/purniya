'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { Product, MainCategorySlug, ProductStatus, ProductBadge } from '../../../types';

export default function AdminProductsPage() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State for Adding / Editing
  const [formData, setFormData] = useState<{
    name: string;
    categorySlug: MainCategorySlug;
    subcategory: string;
    price: number;
    originalPrice?: number;
    stock: number;
    status: ProductStatus;
    badge?: ProductBadge;
    image: string;
    description: string;
  }>({
    name: '',
    categorySlug: 'jewellery',
    subcategory: 'Necklace',
    price: 1999,
    originalPrice: 2499,
    stock: 25,
    status: 'Active',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&fit=crop&auto=format',
    description: 'Artisanal piece crafted with refined materials.',
  });

  const currentCategoryMeta = useMemo(() => {
    return categories.find((c) => c.slug === formData.categorySlug) || categories[0];
  }, [categories, formData.categorySlug]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCat === 'all' || p.categorySlug === selectedCat;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCat]);

  const openAddModal = () => {
    setFormData({
      name: '',
      categorySlug: 'jewellery',
      subcategory: 'Necklace',
      price: 1999,
      originalPrice: 2499,
      stock: 25,
      status: 'Active',
      badge: 'New',
      image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&fit=crop&auto=format',
      description: 'Artisanal piece crafted with refined materials.',
    });
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      categorySlug: prod.categorySlug,
      subcategory: prod.subcategory,
      price: prod.price,
      originalPrice: prod.originalPrice,
      stock: prod.stock,
      status: prod.status,
      badge: prod.badge,
      image: prod.image,
      description: prod.description || '',
    });
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedCategory = categories.find((c) => c.slug === formData.categorySlug);
    const categoryTitle = matchedCategory ? matchedCategory.title : 'Jewellery & Accessories';

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        ...formData,
        category: categoryTitle,
      });
    } else {
      addProduct({
        ...formData,
        category: categoryTitle,
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Products Catalog
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Manage, upload, and update products across the five Purnya lifestyle categories.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2DBD0] shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#5A7469] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or subcategory..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2DBD0] rounded-xl focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-[#E2DBD0] rounded-xl text-xs font-semibold text-[#2C4A3E] bg-white cursor-pointer"
          >
            <option value="all">All 5 Categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
          <span className="text-xs text-[#5A7469] shrink-0">
            {filteredProducts.length} items
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-[#E2DBD0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E2DBD0] text-[#5A7469] uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4 pl-6">Product</th>
                <th className="p-4">Category / Subcategory</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEBE3]">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-[#FAF8F5]/40 transition-colors">
                  <td className="p-4 pl-6 flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-cover bg-[#EBF3EF] border border-[#E2DBD0] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-[#0B241C] truncate max-w-xs">{p.name}</p>
                      {p.badge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0B241C] text-[#FAF8F5] inline-block mt-0.5">
                          {p.badge}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-4 text-[#2C4A3E]">
                    <p className="font-semibold text-[#0B241C]">{p.category}</p>
                    <p className="text-[11px] text-[#5A7469]">{p.subcategory}</p>
                  </td>

                  <td className="p-4">
                    <p className="font-bold text-[#0B241C]">₹{p.price.toLocaleString('en-IN')}</p>
                    {p.originalPrice && (
                      <p className="text-[10px] text-[#5A7469] line-through">
                        ₹{p.originalPrice.toLocaleString('en-IN')}
                      </p>
                    )}
                  </td>

                  <td className="p-4">
                    <span
                      className={`font-semibold ${
                        p.stock < 15 ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {p.stock} units
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'Out of Stock'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  <td className="p-4 pr-6 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg border border-[#E2DBD0] hover:border-[#C5A059] text-[#2C4A3E] hover:text-[#C5A059]"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${p.name}?`)) deleteProduct(p.id);
                      }}
                      className="p-1.5 rounded-lg border border-[#E2DBD0] hover:border-rose-400 text-rose-600 hover:bg-rose-50"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-[#E2DBD0] shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#EFEBE3]">
              <h3 className="font-serif-title text-xl font-bold text-[#0B241C]">
                {editingProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-[#5A7469] hover:text-[#0B241C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. 18K Gold Emerald Pendant"
                  className="w-full p-3 rounded-xl border border-[#E2DBD0]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-[#2C4A3E]">Category</label>
                  <select
                    value={formData.categorySlug}
                    onChange={(e) => {
                      const newSlug = e.target.value as MainCategorySlug;
                      const matched = categories.find((c) => c.slug === newSlug);
                      setFormData({
                        ...formData,
                        categorySlug: newSlug,
                        subcategory: matched ? matched.subcategories[1] || 'General' : 'General',
                      });
                    }}
                    className="w-full p-3 rounded-xl border border-[#E2DBD0] bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#2C4A3E]">Subcategory</label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="w-full p-3 rounded-xl border border-[#E2DBD0] bg-white"
                  >
                    {currentCategoryMeta.subcategories
                      .filter((s) => s !== 'All')
                      .map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-[#2C4A3E]">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border border-[#E2DBD0]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#2C4A3E]">Original Price (₹)</label>
                  <input
                    type="number"
                    value={formData.originalPrice || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        originalPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full p-3 rounded-xl border border-[#E2DBD0]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#2C4A3E]">Inventory Stock</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border border-[#E2DBD0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-[#2C4A3E]">Product Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-3 rounded-xl border border-[#E2DBD0] bg-white"
                  >
                    <option value="Active">Active (Visible)</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Draft">Draft (Hidden)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#2C4A3E]">Promotional Badge</label>
                  <select
                    value={formData.badge || ''}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value as any })}
                    className="w-full p-3 rounded-xl border border-[#E2DBD0] bg-white"
                  >
                    <option value="">None</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="New">New</option>
                    <option value="Trending">Trending</option>
                    <option value="Premium">Premium</option>
                    <option value="Organic">Organic</option>
                    <option value="Festive">Festive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Image URL</label>
                <input
                  type="url"
                  required
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#E2DBD0]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Product Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#E2DBD0]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EFEBE3]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E2DBD0] text-[#2C4A3E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0B241C] font-bold shadow-md uppercase tracking-wider"
                >
                  {editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
