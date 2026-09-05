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
  Upload,
  Image as ImageIcon,
  Tag,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { Product, MainCategorySlug, ProductStatus, ProductBadge, ProductVariant } from '../../../types';

export default function AdminProductsPage() {
  const { products, categories, addProduct, updateProduct, deleteProduct, showToast } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [categorySlug, setCategorySlug] = useState<MainCategorySlug>('jewellery');
  const [subcategory, setSubcategory] = useState('Necklace');
  const [price, setPrice] = useState<number>(1999);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(2499);
  const [stock, setStock] = useState<number>(25);
  const [status, setStatus] = useState<ProductStatus>('Active');
  const [badge, setBadge] = useState<ProductBadge | undefined>('New');
  const [image, setImage] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [description, setDescription] = useState('');

  // Variants / Sizes State (SOW Section 8 & 9)
  const [variantName, setVariantName] = useState('Size');
  const [variantOptionsInput, setVariantOptionsInput] = useState('');
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);

  // Specifications State (SOW Section 9)
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [specs, setSpecs] = useState<Record<string, string>>({});

  const currentCategoryMeta = useMemo(() => {
    return categories.find((c) => c.slug === categorySlug) || categories[0];
  }, [categories, categorySlug]);

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

  // Handle local file image upload
  const handleLocalImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select a valid image file (PNG, JPG, WEBP).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImage(result);
      setImagePreview(result);
      showToast('Image Uploaded', 'Local image ready for product catalog.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategorySlug('jewellery');
    setSubcategory('Necklace');
    setPrice(1999);
    setOriginalPrice(2499);
    setStock(25);
    setStatus('Active');
    setBadge('New');
    setImage('https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&fit=crop&auto=format');
    setImagePreview('https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&fit=crop&auto=format');
    setDescription('Handcrafted artisanal luxury piece designed for everyday sophistication.');
    setVariantsList([
      { name: 'Size', options: ['Standard', 'Custom Fit'] },
    ]);
    setSpecs({
      Material: '18K Gold Vermeil & 925 Sterling Silver',
      Purity: 'Certified BIS Hallmarked',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategorySlug(prod.categorySlug);
    setSubcategory(prod.subcategory);
    setPrice(prod.price);
    setOriginalPrice(prod.originalPrice);
    setStock(prod.stock);
    setStatus(prod.status);
    setBadge(prod.badge);
    setImage(prod.image);
    setImagePreview(prod.image);
    setDescription(prod.description || '');
    setVariantsList(prod.variants || []);
    setSpecs(prod.specifications || {});
    setIsAddModalOpen(true);
  };

  // Add Variant helper
  const handleAddVariant = () => {
    if (!variantName.trim() || !variantOptionsInput.trim()) {
      showToast('Missing Info', 'Please enter variant name and comma-separated options.');
      return;
    }
    const options = variantOptionsInput
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    if (options.length === 0) return;

    setVariantsList((prev) => [...prev, { name: variantName.trim(), options }]);
    setVariantOptionsInput('');
    showToast('Variant Added', `Added ${variantName} with ${options.length} options.`);
  };

  const handleRemoveVariant = (index: number) => {
    setVariantsList((prev) => prev.filter((_, i) => i !== index));
  };

  // Add Specification helper
  const handleAddSpec = () => {
    if (!specKey.trim() || !specValue.trim()) return;
    setSpecs((prev) => ({ ...prev, [specKey.trim()]: specValue.trim() }));
    setSpecKey('');
    setSpecValue('');
  };

  const handleRemoveSpec = (key: string) => {
    setSpecs((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedCategory = categories.find((c) => c.slug === categorySlug);
    const categoryTitle = matchedCategory ? matchedCategory.title : 'Jewellery & Accessories';

    const payload = {
      name: name.trim(),
      category: categoryTitle,
      categorySlug,
      subcategory,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      stock: Number(stock),
      status,
      badge: badge || undefined,
      image: imagePreview || image,
      description: description.trim(),
      variants: variantsList.length > 0 ? variantsList : undefined,
      specifications: Object.keys(specs).length > 0 ? specs : undefined,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Products Catalog & SKUs
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Add, edit, upload images from local storage, and configure prices, sizes, and attributes across all 5 Purnya categories (SOW Section 8, 9 & 17).
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E2DBD0] shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#5A7469] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or subcategory..."
            className="w-full pl-10 pr-3 py-2 text-xs border border-[#E2DBD0] rounded-xl focus:outline-none focus:border-[#C5A059] bg-[#FAF8F5]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-[#E2DBD0] rounded-xl text-xs font-semibold text-[#0B241C] bg-[#FAF8F5] cursor-pointer"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-[#E2DBD0] shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ImageIcon className="w-12 h-12 text-[#C5A059] mx-auto opacity-40" />
            <p className="text-sm font-bold text-[#0B241C]">No Products Found</p>
            <p className="text-xs text-[#5A7469]">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#5A7469] font-bold uppercase tracking-wider text-[10px] border-b border-[#E2DBD0]">
                <tr>
                  <th className="py-3.5 px-6">Product</th>
                  <th className="py-3.5 px-6">Category / Subcategory</th>
                  <th className="py-3.5 px-6">Price</th>
                  <th className="py-3.5 px-6">Sizes / Variants</th>
                  <th className="py-3.5 px-6">Stock & Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEBE3]">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-[#E2DBD0]"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-[#0B241C] truncate max-w-xs">{prod.name}</p>
                          <p className="text-[10px] text-[#5A7469]">SKU: {prod.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-[#0B241C] block">{prod.category}</span>
                      <span className="text-[#5A7469] text-[11px]">{prod.subcategory}</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-[#0B241C] text-sm">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </span>
                      {prod.originalPrice && (
                        <span className="text-[11px] text-[#8C827A] line-through block">
                          ₹{prod.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      {prod.variants && prod.variants.length > 0 ? (
                        <div className="space-y-1">
                          {prod.variants.map((v) => (
                            <span
                              key={v.name}
                              className="inline-block px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E2DBD0] text-[10px] font-semibold text-[#0B241C] mr-1"
                            >
                              {v.name}: {v.options.join(', ')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#8C827A] text-[11px]">Standard Size</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="space-y-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${
                            prod.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : prod.status === 'Out of Stock'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {prod.status}
                        </span>
                        <p className="text-[11px] text-[#5A7469] font-medium">{prod.stock} units available</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(prod)}
                          title="Edit Product"
                          className="p-1.5 rounded-lg text-[#5A7469] hover:text-[#0B241C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete product "${prod.name}"?`)) {
                              deleteProduct(prod.id);
                            }
                          }}
                          title="Delete Product"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Comprehensive Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E2DBD0] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-xs">
            <div className="p-5 bg-[#0B241C] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-serif-title text-base font-bold text-white">
                  {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Product Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-[#0B241C] mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. 18K Gold Emerald Pendant Necklace"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#0B241C] mb-1">Category</label>
                    <select
                      value={categorySlug}
                      onChange={(e) => {
                        const newSlug = e.target.value as MainCategorySlug;
                        setCategorySlug(newSlug);
                        const matched = categories.find((c) => c.slug === newSlug);
                        if (matched && matched.subcategories.length > 1) {
                          setSubcategory(matched.subcategories[1]);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                    >
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#0B241C] mb-1">Subcategory</label>
                    <select
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
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

                {/* Pricing & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-[#0B241C] mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0B241C] mb-1">Original Price / MRP (₹)</label>
                    <input
                      type="number"
                      value={originalPrice || ''}
                      onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Optional strikethrough"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0B241C] mb-1">Inventory Stock</label>
                    <input
                      type="number"
                      required
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#0B241C] mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C]"
                    >
                      <option value="Active">Active (Visible)</option>
                      <option value="Out of Stock">Out of Stock</option>
                      <option value="Draft">Draft (Hidden)</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#0B241C] mb-1">Badge</label>
                    <select
                      value={badge || ''}
                      onChange={(e) => setBadge((e.target.value as any) || undefined)}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C]"
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

                {/* Local Image Upload & URL input */}
                <div className="space-y-2 pt-2 border-t border-[#EFEBE3]">
                  <label className="block font-bold text-[#0B241C]">Product Imagery</label>

                  {imagePreview && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0]">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-xl object-cover border border-[#E2DBD0]"
                      />
                      <div className="text-[11px] space-y-0.5">
                        <p className="font-bold text-[#0B241C]">Active Product Image</p>
                        <p className="text-[10px] text-[#5A7469]">Will be rendered across all storefront listings.</p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl border-2 border-dashed border-[#E2DBD0] hover:border-[#C5A059] bg-[#FAF8F5] text-center cursor-pointer relative transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLocalImageUpload(file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-[#C5A059] mx-auto" />
                      <p className="font-bold text-[#0B241C]">Upload Image from Local Computer</p>
                      <p className="text-[10px] text-[#5A7469]">Supports high-resolution JPG, PNG, WEBP</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#5A7469] mb-1">Or paste Image URL:</label>
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => {
                        setImage(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="pt-2 border-t border-[#EFEBE3]">
                  <label className="block font-bold text-[#0B241C] mb-1">Product Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the artisanal craftsmanship, materials, notes, and aesthetic..."
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-medium text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                {/* Sizes & Variants Section (SOW Section 8, 9 & 17) */}
                <div className="space-y-3 pt-2 border-t border-[#EFEBE3]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#0B241C]">Sizes & Product Variants</h4>
                      <p className="text-[10px] text-[#5A7469]">
                        Configure ring sizes, necklace lengths, fragrance variants, or volume weights.
                      </p>
                    </div>
                  </div>

                  {variantsList.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-between gap-3"
                    >
                      <div>
                        <strong className="text-[#0B241C]">{v.name}:</strong>{' '}
                        <span className="text-[#5A7469]">{v.options.join(', ')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="text-rose-700 hover:underline text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Variant Type (e.g. Size, Ring Size, Net Wt)"
                      value={variantName}
                      onChange={(e) => setVariantName(e.target.value)}
                      className="sm:w-1/3 px-3 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Options separated by comma (e.g. 16 inch, 18 inch, 20 inch)"
                      value={variantOptionsInput}
                      onChange={(e) => setVariantOptionsInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-4 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#0B241C] hover:text-white border border-[#E2DBD0] font-bold text-xs transition-colors shrink-0"
                    >
                      Add Variant
                    </button>
                  </div>
                </div>

                {/* Specifications Key/Value (SOW Section 9) */}
                <div className="space-y-3 pt-2 border-t border-[#EFEBE3]">
                  <div>
                    <h4 className="font-bold text-[#0B241C]">Technical Specifications</h4>
                    <p className="text-[10px] text-[#5A7469]">
                      Add materials, hallmarking, dimensions, purity, or care instructions.
                    </p>
                  </div>

                  {Object.entries(specs).map(([k, v]) => (
                    <div
                      key={k}
                      className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-between text-xs"
                    >
                      <span>
                        <strong className="text-[#0B241C]">{k}:</strong> {v}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(k)}
                        className="text-rose-700 hover:underline text-[10px]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Attribute (e.g. Material)"
                      value={specKey}
                      onChange={(e) => setSpecKey(e.target.value)}
                      className="w-1/3 px-3 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 18K Gold Vermeil)"
                      value={specValue}
                      onChange={(e) => setSpecValue(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      className="px-3 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#0B241C] hover:text-white border border-[#E2DBD0] font-semibold text-xs transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit & Cancel */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#EFEBE3]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E2DBD0] text-[#5A7469] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white font-bold transition-colors cursor-pointer shadow-sm"
                >
                  {editingProduct ? 'Save Product Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
