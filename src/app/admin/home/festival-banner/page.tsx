'use client';

import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, X, Edit3, Trash2, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { 
  uploadHomeImageToSupabase, 
  getFestivalBannersFromSupabase, 
  upsertFestivalBannerToSupabase,
  deleteFestivalBannerFromSupabase,
  getLifestyleSaleTagsFromSupabase
} from '../../../../lib/supabase';
import AdminImagePreview from '../../../../components/AdminImagePreview';
import { useStore } from '../../../../context/StoreContext';

export interface FestivalBanner {
  id: string;
  categoryId: string;
  categorySlug: string;
  imageUrl: string;
  lifestyleTag: string;
  isActive: boolean;
}

export default function FestivalBannerAdminPage() {
  const { categories } = useStore();
  const [banners, setBanners] = useState<FestivalBanner[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [lifestyleTag, setLifestyleTag] = useState('');
  const [imageDimensions, setImageDimensions] = useState<string>('');
  const [imageSize, setImageSize] = useState<string>('');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedBanners = await getFestivalBannersFromSupabase();
      setBanners(fetchedBanners);
      
      const tags = await getLifestyleSaleTagsFromSupabase();
      if (tags) {
        setAvailableTags(tags.filter(t => t.isActive));
      }
    } catch (e) {
      console.warn('Could not load festival banners', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setCategoryId('');
    setImageUrl('');
    setLifestyleTag('');
    setImageDimensions('');
    setImageSize('');
    setIsModalOpen(true);
  };

  const handleEdit = (banner: FestivalBanner) => {
    setEditingId(banner.id);
    setCategoryId(banner.categoryId);
    setImageUrl(banner.imageUrl);
    setLifestyleTag(banner.lifestyleTag || '');
    setImageDimensions('');
    setImageSize('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this festival banner?')) {
      const success = await deleteFestivalBannerFromSupabase(id);
      if (success) {
        setBanners(banners.filter(b => b.id !== id));
        showToast('Banner deleted successfully');
      } else {
        alert('Failed to delete banner');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageSize((file.size / 1024).toFixed(1));
    setImageDimensions('');
    setUploading(true);
    try {
      const url = await uploadHomeImageToSupabase(file);
      if (url) {
        setImageUrl(url);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!categoryId || !imageUrl || !lifestyleTag) {
      alert('Please select a category, upload an image, and provide a lifestyle tag.');
      return;
    }

    setSaving(true);
    const cat = categories.find(c => c.id === categoryId);
    
    const bannerData: FestivalBanner = {
      id: editingId || `festival-${Date.now().toString()}`,
      categoryId,
      categorySlug: cat?.slug || '',
      imageUrl,
      lifestyleTag,
      isActive: editingId ? (banners.find(b => b.id === editingId)?.isActive ?? true) : true,
    };
    
    const success = await upsertFestivalBannerToSupabase(bannerData);
    
    if (success) {
      if (editingId) {
        setBanners(banners.map(b => b.id === editingId ? bannerData : b));
        showToast('Banner updated successfully');
      } else {
        setBanners([...banners, bannerData]);
        showToast('Banner created successfully');
      }
      setIsModalOpen(false);
    } else {
      alert('Failed to save banner');
    }
    
    setSaving(false);
  };

  const handleToggleActive = async (id: string) => {
    const banner = banners.find(b => b.id === id);
    if (!banner) return;
    
    const updatedBanner = { ...banner, isActive: !banner.isActive };
    const success = await upsertFestivalBannerToSupabase(updatedBanner);
    
    if (success) {
      setBanners(banners.map(b => b.id === id ? updatedBanner : b));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin mb-4" />
        <p className="text-[#5A7469] font-medium">Loading Festival Banners...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-[#E2DBD0] shadow-sm">
        <div>
          <h1 className="font-serif-title text-2xl font-bold text-[#0B241C]">Festival Banners</h1>
          <p className="text-sm text-[#5A7469] mt-1">Manage promotional banners for category pages</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0C3B2E] text-white hover:bg-[#164E3D] font-bold text-sm shadow-md transition-all"
        >
          <Plus className="w-4 h-4 text-[#C5A059]" />
          <span>Add Banner</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-[#EBF3EF] border border-[#C5A059] flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-[#0C3B2E]" />
          <p className="text-sm font-semibold text-[#0B241C]">{notification}</p>
        </div>
      )}

      {banners.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E2DBD0] text-center space-y-4">
          <ImageIcon className="w-12 h-12 text-[#C5A059] mx-auto opacity-50" />
          <p className="font-serif-title text-lg font-bold text-[#0B241C]">No Festival Banners</p>
          <p className="text-sm text-[#5A7469]">Create a banner to display on category pages.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-3xl overflow-hidden border border-[#E2DBD0] shadow-sm flex flex-col group relative">
              <div className="relative aspect-[3000/563] w-full bg-[#FAF8F5]">
                <img
                  src={banner.imageUrl}
                  alt="Banner"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${banner.isActive ? 'opacity-100' : 'opacity-40 grayscale'}`}
                />
                {!banner.isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-3 py-1 bg-black/60 text-white rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                      Inactive
                    </span>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#0B241C] shadow-sm">
                  {categories.find(c => c.id === banner.categoryId)?.title || 'Unknown Category'}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] mb-1">
                    Lifestyle Tag: {banner.lifestyleTag}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#EFEBE3]">
                  <button
                    onClick={() => handleToggleActive(banner.id)}
                    className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full transition-colors ${
                      banner.isActive
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(banner)}
                      className="p-2 text-[#2C4A3E] hover:bg-[#EBF3EF] rounded-xl transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-[#EFEBE3]">
              <h2 className="font-serif-title text-2xl font-bold text-[#0B241C]">
                {editingId ? 'Edit Festival Banner' : 'Create Festival Banner'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF8F5] text-[#2C4A3E] hover:bg-[#E2DBD0] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <label className="font-semibold text-[#2C4A3E] block">Target Category *</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:border-[#0C3B2E] outline-none bg-white text-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-[#2C4A3E] block">Lifestyle Tag (Links to matching products) *</label>
                <select
                  value={lifestyleTag}
                  onChange={e => setLifestyleTag(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:border-[#0C3B2E] outline-none bg-white text-sm"
                >
                  <option value="">Select a Lifestyle Tag</option>
                  {availableTags.map(tag => (
                    <option key={tag.id} value={tag.name}>{tag.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-[#5A7469]">Populated from the database lifestyle tags.</p>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-[#2C4A3E] flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span>Banner Image *</span>
                  <span className="text-[11px] font-medium text-[#5A7469] normal-case tracking-normal">
                    (Recommended: 3000x563px)
                  </span>
                </label>
                {imageUrl && (
                  <div className="mb-4 space-y-2">
                    <div className="aspect-[3000/563] relative overflow-hidden rounded-xl border border-[#E2DBD0]">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          setImageDimensions(`${img.naturalWidth} × ${img.naturalHeight}`);
                        }}
                      />
                      <button
                        onClick={() => { setImageUrl(''); setImageDimensions(''); setImageSize(''); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-rose-600 flex items-center justify-center hover:bg-white transition-colors shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {(imageDimensions || imageSize) && (
                      <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-[#5A7469]">
                        {imageDimensions && <span>Dimensions: {imageDimensions}</span>}
                        {imageSize && <span>Size: {imageSize} KB</span>}
                      </div>
                    )}
                  </div>
                )}
                {!imageUrl && (
                  <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-[#C5A059] bg-[#EBF3EF]/30 hover:bg-[#EBF3EF] cursor-pointer text-[#0B241C] transition-all">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-[#C5A059]" />
                        <span className="font-semibold text-sm">Upload Photo (Supabase)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-[#EFEBE3] bg-[#FAF8F5] rounded-b-[2rem] flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-full border border-[#E2DBD0] text-[#2C4A3E] font-bold text-sm hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="px-8 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-[#08281F] font-bold text-sm shadow-md hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : 'Save Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
