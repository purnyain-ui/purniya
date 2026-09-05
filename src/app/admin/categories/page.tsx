'use client';

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Edit2,
  Trash2,
  X,
  Check,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { CategoryMeta, MainCategorySlug } from '../../../types';

export default function AdminCategoriesPage() {
  const {
    categories,
    products,
    addCategorySubcategory,
    updateCategorySubcategory,
    removeCategorySubcategory,
    updateCategory,
    showToast,
  } = useStore();

  const [activeCatSlug, setActiveCatSlug] = useState<MainCategorySlug>('jewellery');

  // Edit Category Modal State
  const [editingCategory, setEditingCategory] = useState<CategoryMeta | null>(null);
  const [catBannerPreview, setCatBannerPreview] = useState<string>('');
  const [catHeroPreview, setCatHeroPreview] = useState<string>('');

  // Add / Edit Subcategory Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSubOriginalName, setEditingSubOriginalName] = useState<string | null>(null);
  const [subcatName, setSubcatName] = useState('');
  const [subcatImage, setSubcatImage] = useState('');
  const [subcatImagePreview, setSubcatImagePreview] = useState('');

  const currentCat = categories.find((c) => c.slug === activeCatSlug) || categories[0];
  const catProducts = products.filter((p) => p.categorySlug === activeCatSlug);

  // File Upload Helper
  const handleLocalImageUpload = (
    file: File,
    onSuccess: (dataUrl: string) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select an image file (PNG, JPG, WEBP, etc.).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onSuccess(result);
      showToast('Image Loaded', 'Local image uploaded successfully.', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Open Add Subcategory Modal
  const handleOpenAddSub = () => {
    setEditingSubOriginalName(null);
    setSubcatName('');
    setSubcatImage('');
    setSubcatImagePreview('');
    setIsSubModalOpen(true);
  };

  // Open Edit Subcategory Modal
  const handleOpenEditSub = (subName: string) => {
    const existingImg = currentCat.subcatImages?.find((img) => img.name === subName)?.image || '';
    setEditingSubOriginalName(subName);
    setSubcatName(subName);
    setSubcatImage(existingImg);
    setSubcatImagePreview(existingImg);
    setIsSubModalOpen(true);
  };

  // Submit Subcategory Form
  const handleSaveSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcatName.trim()) {
      showToast('Validation Error', 'Subcategory name is required.', 'error');
      return;
    }

    const finalImage =
      subcatImagePreview ||
      subcatImage ||
      'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=300&fit=crop&auto=format';

    if (editingSubOriginalName) {
      updateCategorySubcategory(activeCatSlug, editingSubOriginalName, subcatName.trim(), finalImage);
    } else {
      addCategorySubcategory(activeCatSlug, subcatName.trim(), finalImage);
    }

    setIsSubModalOpen(false);
  };

  // Delete Subcategory
  const handleDeleteSub = (subName: string) => {
    if (confirm(`Are you sure you want to delete subcategory "${subName}" from ${currentCat.title}?`)) {
      removeCategorySubcategory(activeCatSlug, subName);
    }
  };

  // Open Edit Category Modal
  const handleOpenEditCategory = (cat: CategoryMeta) => {
    setEditingCategory({ ...cat });
    setCatBannerPreview(cat.bannerImage);
    setCatHeroPreview(cat.heroImage);
  };

  // Save Category Edit
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    updateCategory(editingCategory.slug, {
      title: editingCategory.title,
      subtitle: editingCategory.subtitle,
      bannerImage: catBannerPreview || editingCategory.bannerImage,
      heroImage: catHeroPreview || editingCategory.heroImage,
    });
    setEditingCategory(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Categories & Subcategories Taxonomy
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Configure the 5 lifestyle categories, upload visual banners, and manage subcategory lines with local image uploads (SOW Section 4 & 7).
          </p>
        </div>

        <button
          onClick={() => handleOpenEditCategory(currentCat)}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#0B241C] border border-[#E2DBD0] text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Edit Category Banners & Copy</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-[#E2DBD0] gap-2 overflow-x-auto text-xs font-bold pb-1">
        {categories.map((cat) => {
          const count = products.filter((p) => p.categorySlug === cat.slug).length;
          const isActive = cat.slug === activeCatSlug;

          return (
            <button
              key={cat.slug}
              onClick={() => setActiveCatSlug(cat.slug)}
              className={`px-4 py-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive
                  ? 'border-[#C5A059] text-[#0B241C] bg-white rounded-t-xl'
                  : 'border-transparent text-[#5A7469] hover:text-[#0B241C]'
              }`}
            >
              <span>{cat.title}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-[#0B241C] text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Category Banner Preview Card */}
      <div className="bg-white rounded-3xl border border-[#E2DBD0] overflow-hidden shadow-sm">
        <div className="relative aspect-[21/9] sm:aspect-[24/7] w-full bg-[#0B241C]">
          <img
            src={currentCat.bannerImage || currentCat.heroImage}
            alt={currentCat.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37] block">
                Category World
              </span>
              <h2 className="font-serif-title text-2xl sm:text-3xl font-bold">{currentCat.title}</h2>
              <p className="text-xs text-[#E2DBD0]">{currentCat.subtitle}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenEditCategory(currentCat)}
                className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm text-xs font-semibold flex items-center gap-1.5 border border-white/20"
              >
                <Edit2 className="w-3 h-3" />
                <span>Change Imagery</span>
              </button>
              <a
                href={`/category/${currentCat.slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0B241C] font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <span>Live Boutique</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategories Management Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="font-serif-title text-xl font-bold text-[#0B241C] flex items-center gap-2">
            <span>Subcategories in {currentCat.title}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {currentCat.subcategories.filter((s) => s !== 'All').length} Subcategories
            </span>
          </h2>
          <p className="text-xs text-[#5A7469]">
            Each subcategory is displayed visually across the circular quick-shop bars and navigation.
          </p>
        </div>

        <button
          onClick={handleOpenAddSub}
          className="px-4 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Subcategory</span>
        </button>
      </div>

      {/* Subcategories Visual Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentCat.subcategories
          .filter((s) => s !== 'All')
          .map((subName) => {
            const subImageObj = currentCat.subcatImages?.find((img) => img.name === subName);
            const subImage = subImageObj?.image || currentCat.bannerImage || currentCat.heroImage;
            const subCount = products.filter(
              (p) => p.categorySlug === currentCat.slug && p.subcategory === subName
            ).length;

            return (
              <div
                key={subName}
                className="bg-white rounded-2xl border border-[#E2DBD0] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-square w-full bg-[#FAF8F5] overflow-hidden">
                    <img
                      src={subImage}
                      alt={subName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditSub(subName)}
                        title="Edit subcategory & image"
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-[#0B241C] shadow-sm cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSub(subName)}
                        title="Delete subcategory"
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-rose-50 text-rose-700 shadow-sm cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-1">
                    <h3 className="font-bold text-xs text-[#0B241C]">{subName}</h3>
                    <p className="text-[11px] text-[#5A7469]">
                      {subCount} {subCount === 1 ? 'Live Product' : 'Live Products'}
                    </p>
                  </div>
                </div>

                <div className="p-3 pt-0 border-t border-[#EFEBE3] mt-2 flex justify-between items-center text-[11px]">
                  <button
                    onClick={() => handleOpenEditSub(subName)}
                    className="text-[#C5A059] font-bold hover:underline cursor-pointer"
                  >
                    Edit Details / Image
                  </button>
                  <span className="text-[10px] text-[#5A7469] uppercase font-bold">Active</span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Add / Edit Subcategory Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleSaveSubcategory}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-[#E2DBD0] shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3]">
              <h3 className="font-serif-title text-base font-bold text-[#0B241C]">
                {editingSubOriginalName ? `Edit Subcategory: ${editingSubOriginalName}` : `Add Subcategory to ${currentCat.title}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubModalOpen(false)}
                className="p-1 rounded-lg text-[#5A7469] hover:text-[#0B241C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-[#0B241C] mb-1">Subcategory Name</label>
                <input
                  type="text"
                  required
                  value={subcatName}
                  onChange={(e) => setSubcatName(e.target.value)}
                  placeholder="e.g. Baroque Pearl Chokers, Sand Wax Refills"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* Subcategory Visual Thumbnail (Local File Upload + URL) */}
              <div className="space-y-2">
                <label className="block font-bold text-[#0B241C]">
                  Subcategory Image (Circular Thumbnail)
                </label>

                {/* Image Preview Box */}
                {subcatImagePreview && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0]">
                    <img
                      src={subcatImagePreview}
                      alt="Preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#C5A059]"
                    />
                    <div className="text-[11px] space-y-0.5">
                      <p className="font-bold text-[#0B241C]">Preview Image Selected</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSubcatImagePreview('');
                          setSubcatImage('');
                        }}
                        className="text-rose-700 hover:underline cursor-pointer"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload from Local Computer */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-[#E2DBD0] hover:border-[#C5A059] bg-[#FAF8F5] transition-colors text-center cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleLocalImageUpload(file, (dataUrl) => {
                          setSubcatImagePreview(dataUrl);
                          setSubcatImage(dataUrl);
                        });
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 text-[#C5A059] mx-auto" />
                    <p className="font-bold text-[#0B241C]">Click or Drag to Upload from Computer</p>
                    <p className="text-[10px] text-[#5A7469]">Supports PNG, JPG, WEBP formats</p>
                  </div>
                </div>

                {/* Or Enter URL */}
                <div>
                  <label className="block text-[11px] text-[#5A7469] mb-1">
                    Or paste Image URL:
                  </label>
                  <input
                    type="url"
                    value={subcatImage}
                    onChange={(e) => {
                      setSubcatImage(e.target.value);
                      setSubcatImagePreview(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EFEBE3]">
              <button
                type="button"
                onClick={() => setIsSubModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E2DBD0] text-[#5A7469] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white font-bold transition-colors cursor-pointer"
              >
                {editingSubOriginalName ? 'Update Subcategory' : 'Add Subcategory'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleSaveCategory}
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 border border-[#E2DBD0] shadow-2xl text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3]">
              <div>
                <h3 className="font-serif-title text-base font-bold text-[#0B241C]">
                  Edit Category: {editingCategory.title}
                </h3>
                <p className="text-[11px] text-[#5A7469]">Update boutique title, subtitle, and visual banners.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded-lg text-[#5A7469] hover:text-[#0B241C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-[#0B241C] mb-1">Category Title</label>
                <input
                  type="text"
                  required
                  value={editingCategory.title}
                  onChange={(e) => setEditingCategory({ ...editingCategory, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1">Category Subtitle / Brand Tagline</label>
                <textarea
                  rows={2}
                  value={editingCategory.subtitle}
                  onChange={(e) => setEditingCategory({ ...editingCategory, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-medium text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* Banner Image Upload */}
              <div className="space-y-2">
                <label className="block font-bold text-[#0B241C]">Boutique Banner Image</label>
                {catBannerPreview && (
                  <div className="relative aspect-[21/9] rounded-xl overflow-hidden border border-[#E2DBD0]">
                    <img src={catBannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-3.5 rounded-2xl border-2 border-dashed border-[#E2DBD0] hover:border-[#C5A059] bg-[#FAF8F5] text-center relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleLocalImageUpload(file, (dataUrl) => {
                          setCatBannerPreview(dataUrl);
                        });
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-1">
                    <Upload className="w-5 h-5 text-[#C5A059] mx-auto" />
                    <p className="font-bold text-[#0B241C]">Upload Banner Image from Computer</p>
                  </div>
                </div>
                <input
                  type="url"
                  placeholder="Or enter Banner Image URL..."
                  value={catBannerPreview}
                  onChange={(e) => setCatBannerPreview(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EFEBE3]">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 rounded-xl border border-[#E2DBD0] text-[#5A7469] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white font-bold transition-colors cursor-pointer"
              >
                Save Category Updates
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
