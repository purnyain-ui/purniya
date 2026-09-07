'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  ExternalLink,
  Upload,
  Edit2,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';
import { supabase, CATEGORY_IMAGES_BUCKET } from '../../../lib/supabaseClient';
import { useStore } from '../../../context/StoreContext'; // still used for products/counts

// Fallback used whenever a category/subcategory has no image set yet.
// Never render <img src=""> — an empty string re-requests the current page.
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&fit=crop&auto=format';

// ---------------------------------------------------------------
// Types matching the Supabase tables
// ---------------------------------------------------------------
type Category = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  banner_image: string | null;
  hero_image: string | null;
};

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  image: string | null;
  sort_order: number;
};

export default function AdminCategoriesPage() {
  const { products, showToast } = useStore(); // products still comes from your existing store

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeCatSlug, setActiveCatSlug] = useState<string>('');

  // Edit Category Modal State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catBannerFile, setCatBannerFile] = useState<File | null>(null);
  const [catBannerPreview, setCatBannerPreview] = useState<string>('');

  // Add / Edit Subcategory Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [subcatName, setSubcatName] = useState('');
  const [subcatImageFile, setSubcatImageFile] = useState<File | null>(null);
  const [subcatImagePreview, setSubcatImagePreview] = useState('');
  const [subcatImageUrl, setSubcatImageUrl] = useState(''); // pasted URL fallback

  const currentCat = categories.find((c) => c.slug === activeCatSlug) || categories[0];

  // Slugs coming from Supabase can have stray casing/whitespace
  // ('Fragrance ', 'apparel', 'Lifestyle'...), so compare normalized values
  // and fall back to matching the category title too.
  const normalize = (s: string | null | undefined) => (s || '').trim().toLowerCase();

  const getProductCountForCategory = (cat: Category) =>
    products.filter((p) => {
      const productCat = normalize(p.categorySlug);
      return productCat === normalize(cat.slug) || productCat === normalize(cat.title);
    }).length;

  const currentSubcats = subcategories
    .filter((s) => s.category_id === currentCat?.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  // ---------------------------------------------------------------
  // Fetch categories + subcategories from Supabase
  // ---------------------------------------------------------------
  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('title', { ascending: true });

    const { data: subData, error: subError } = await supabase
      .from('subcategories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (catError || subError) {
      showToast('Load Failed', catError?.message || subError?.message || 'Could not load categories.', 'error');
    } else {
      setCategories(catData || []);
      setSubcategories(subData || []);
      if (catData && catData.length > 0 && !activeCatSlug) {
        setActiveCatSlug(catData[0].slug);
      }
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------
  // Upload a file to the Supabase storage bucket, return public URL
  // ---------------------------------------------------------------
  const uploadImageToBucket = async (file: File, pathPrefix: string): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file (PNG, JPG, WEBP, etc.).');
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(CATEGORY_IMAGES_BUCKET)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from(CATEGORY_IMAGES_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Local preview only (doesn't upload yet — upload happens on save)
  const handleLocalPreview = (file: File, onSuccess: (previewUrl: string) => void) => {
    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select an image file (PNG, JPG, WEBP, etc.).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onSuccess(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // ---------------------------------------------------------------
  // Subcategory modal open/close
  // ---------------------------------------------------------------
  const handleOpenAddSub = () => {
    setEditingSub(null);
    setSubcatName('');
    setSubcatImageFile(null);
    setSubcatImagePreview('');
    setSubcatImageUrl('');
    setIsSubModalOpen(true);
  };

  const handleOpenEditSub = (sub: Subcategory) => {
    setEditingSub(sub);
    setSubcatName(sub.name);
    setSubcatImageFile(null);
    setSubcatImagePreview(sub.image || '');
    setSubcatImageUrl(sub.image || '');
    setIsSubModalOpen(true);
  };

  // ---------------------------------------------------------------
  // Save subcategory (insert or update in `subcategories` table)
  // ---------------------------------------------------------------
  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcatName.trim() || !currentCat) {
      showToast('Validation Error', 'Subcategory name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      let finalImage = subcatImageUrl || subcatImagePreview;

      // If a real file was chosen, upload it to the bucket and use that URL
      if (subcatImageFile) {
        finalImage = await uploadImageToBucket(subcatImageFile, `subcategories/${currentCat.slug}`);
      }

      if (!finalImage) {
        finalImage = 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=300&fit=crop&auto=format';
      }

      if (editingSub) {
        const { error } = await supabase
          .from('subcategories')
          .update({ name: subcatName.trim(), image: finalImage })
          .eq('id', editingSub.id);
        if (error) throw error;
        showToast('Updated', 'Subcategory updated.', 'success');
      } else {
        const { error } = await supabase.from('subcategories').insert({
          category_id: currentCat.id,
          name: subcatName.trim(),
          image: finalImage,
          sort_order: currentSubcats.length,
        });
        if (error) throw error;
        showToast('Added', 'Subcategory created.', 'success');
      }

      setIsSubModalOpen(false);
      await fetchData();
    } catch (err: any) {
      showToast('Save Failed', err.message || 'Could not save subcategory.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------
  // Delete subcategory
  // ---------------------------------------------------------------
  const handleDeleteSub = async (sub: Subcategory) => {
    if (!confirm(`Are you sure you want to delete subcategory "${sub.name}"?`)) return;

    const { error } = await supabase.from('subcategories').delete().eq('id', sub.id);
    if (error) {
      showToast('Delete Failed', error.message, 'error');
    } else {
      showToast('Deleted', 'Subcategory removed.', 'success');
      await fetchData();
    }
  };

  // ---------------------------------------------------------------
  // Edit category modal
  // ---------------------------------------------------------------
  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory({ ...cat });
    setCatBannerFile(null);
    setCatBannerPreview(cat.banner_image || '');
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setSaving(true);
    try {
      let bannerUrl = catBannerPreview;
      if (catBannerFile) {
        bannerUrl = await uploadImageToBucket(catBannerFile, `categories/${editingCategory.slug}`);
      }

      const { error } = await supabase
        .from('categories')
        .update({
          title: editingCategory.title,
          subtitle: editingCategory.subtitle,
          banner_image: bannerUrl || editingCategory.banner_image,
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      showToast('Saved', 'Category updated.', 'success');
      setEditingCategory(null);
      await fetchData();
    } catch (err: any) {
      showToast('Save Failed', err.message || 'Could not save category.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#5A7469] gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading categories…</span>
      </div>
    );
  }

  if (!currentCat) {
    return (
      <div className="text-sm text-[#5A7469]">
        No categories found. Seed the <code>categories</code> table to get started.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Categories & Subcategories Taxonomy
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Backed by Supabase — categories and subcategories are stored in their own tables, images live in the{' '}
            <code>{CATEGORY_IMAGES_BUCKET}</code> storage bucket.
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
          const count = getProductCountForCategory(cat);
          const isActive = cat.slug === activeCatSlug;

          return (
            <button
              key={cat.slug}
              onClick={() => setActiveCatSlug(cat.slug)}
              className={`px-4 py-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${isActive
                  ? 'border-[#C5A059] text-[#0B241C] bg-white rounded-t-xl'
                  : 'border-transparent text-[#5A7469] hover:text-[#0B241C]'
                }`}
            >
              <span>{cat.title}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isActive ? 'bg-[#0B241C] text-white' : 'bg-gray-100 text-[#5A7469]'
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
            src={currentCat.banner_image || currentCat.hero_image || PLACEHOLDER_IMAGE}
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
              {currentSubcats.length} Subcategories
            </span>
          </h2>
          <p className="text-xs text-[#5A7469]">
            Each subcategory lives as a row in the <code>subcategories</code> table, linked to this category by{' '}
            <code>category_id</code>.
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
        {currentSubcats.map((sub) => {
          const subImage = sub.image || currentCat.banner_image || currentCat.hero_image || PLACEHOLDER_IMAGE;
          const subCount = products.filter(
            (p) =>
              (normalize(p.categorySlug) === normalize(currentCat.slug) ||
                normalize(p.categorySlug) === normalize(currentCat.title)) &&
              normalize(p.subcategory) === normalize(sub.name)
          ).length;

          return (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-[#E2DBD0] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-square w-full bg-[#FAF8F5] overflow-hidden">
                  <img
                    src={subImage}
                    alt={sub.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditSub(sub)}
                      title="Edit subcategory & image"
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-[#0B241C] shadow-sm cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSub(sub)}
                      title="Delete subcategory"
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-rose-50 text-rose-700 shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 space-y-1">
                  <h3 className="font-bold text-xs text-[#0B241C]">{sub.name}</h3>
                  <p className="text-[11px] text-[#5A7469]">
                    {subCount} {subCount === 1 ? 'Live Product' : 'Live Products'}
                  </p>
                </div>
              </div>

              <div className="p-3 pt-0 border-t border-[#EFEBE3] mt-2 flex justify-between items-center text-[11px]">
                <button
                  onClick={() => handleOpenEditSub(sub)}
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
                {editingSub ? `Edit Subcategory: ${editingSub.name}` : `Add Subcategory to ${currentCat.title}`}
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

              {/* Subcategory Visual Thumbnail (Local File Upload → Supabase Storage + URL fallback) */}
              <div className="space-y-2">
                <label className="block font-bold text-[#0B241C]">
                  Subcategory Image (Circular Thumbnail)
                </label>

                {subcatImagePreview && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0]">
                    <img
                      src={subcatImagePreview}
                      alt="Preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#C5A059]"
                    />
                    <div className="text-[11px] space-y-0.5">
                      <p className="font-bold text-[#0B241C]">
                        {subcatImageFile ? 'New image selected — will upload on save' : 'Current image'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSubcatImagePreview('');
                          setSubcatImageFile(null);
                          setSubcatImageUrl('');
                        }}
                        className="text-rose-700 hover:underline cursor-pointer"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-2xl border-2 border-dashed border-[#E2DBD0] hover:border-[#C5A059] bg-[#FAF8F5] transition-colors text-center cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSubcatImageFile(file);
                        handleLocalPreview(file, (previewUrl) => setSubcatImagePreview(previewUrl));
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 text-[#C5A059] mx-auto" />
                    <p className="font-bold text-[#0B241C]">Click or Drag to Upload from Computer</p>
                    <p className="text-[10px] text-[#5A7469]">
                      Uploads to Supabase Storage (<code>{CATEGORY_IMAGES_BUCKET}</code>) on save
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#5A7469] mb-1">Or paste Image URL:</label>
                  <input
                    type="url"
                    value={subcatImageUrl}
                    onChange={(e) => {
                      setSubcatImageUrl(e.target.value);
                      setSubcatImagePreview(e.target.value);
                      setSubcatImageFile(null);
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
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white font-bold transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingSub ? 'Update Subcategory' : 'Add Subcategory'}
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
                <p className="text-[11px] text-[#5A7469]">Update boutique title, subtitle, and banner image.</p>
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
                  value={editingCategory.subtitle || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-medium text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

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
                        setCatBannerFile(file);
                        handleLocalPreview(file, (previewUrl) => setCatBannerPreview(previewUrl));
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
                  onChange={(e) => {
                    setCatBannerPreview(e.target.value);
                    setCatBannerFile(null);
                  }}
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
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white font-bold transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Category Updates
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}