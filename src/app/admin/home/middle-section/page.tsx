'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle2, X, Edit3, Trash2, ArrowUpRight, Upload, Loader2, Database } from 'lucide-react';
import { HomeMiddleSection } from '../../../../types';
import {
  getHomeMiddleSectionsFromSupabase,
  upsertHomeMiddleSectionToSupabase,
  deleteHomeMiddleSectionFromSupabase,
  uploadHomeImageToSupabase,
} from '../../../../lib/supabase';

const DEFAULT_MIDDLE_ITEM: HomeMiddleSection = {
  id: 'homepage-middle-standard',
  tag: 'THE PURNYA STANDARD',
  title: 'Artisanal Metallurgy & Anti-Tarnish Elegance',
  description: 'Every piece of Purnya Jewellery is cast from premium hypoallergenic alloys, finished with lustrous 18K micro-gold plating and sealed with an invisible protective nano-ceramic barrier to guard against moisture, perfume, and daily wear.',
  imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
  features: [
    'Skin-Safe Hypoallergenic & Nickel Free',
    'Anti-Tarnish Protective Ceramic Seal',
    'Ethically Sourced Genuine Freshwater Pearls',
    'Hand-Set AAA Cubic Zirconia & Gemstones'
  ],
  primaryButtonText: 'SHOP COMPLETE CATALOG',
  primaryButtonLink: '/catalog',
  secondaryButtonText: 'EXPLORE OTHER 4 WORLDS',
  secondaryButtonLink: '/worlds',
  isActive: true,
};

export default function AdminStandardsPage() {
  const [banners, setBanners] = useState<HomeMiddleSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [tag, setTag] = useState('THE PURNYA STANDARD');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [feat1, setFeat1] = useState('Skin-Safe Hypoallergenic & Nickel Free');
  const [feat2, setFeat2] = useState('Anti-Tarnish Protective Ceramic Seal');
  const [feat3, setFeat3] = useState('Ethically Sourced Genuine Freshwater Pearls');
  const [feat4, setFeat4] = useState('Hand-Set AAA Cubic Zirconia & Gemstones');
  const [primaryText, setPrimaryText] = useState('SHOP COMPLETE CATALOG');
  const [primaryLink, setPrimaryLink] = useState('/catalog');
  const [secondaryText, setSecondaryText] = useState('EXPLORE OTHER 4 WORLDS');
  const [secondaryLink, setSecondaryLink] = useState('/worlds');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHomeMiddleSectionsFromSupabase();
      if (data && data.length > 0) {
        setBanners(data);
      } else {
        // If empty in Supabase, auto-seed default item
        await upsertHomeMiddleSectionToSupabase(DEFAULT_MIDDLE_ITEM);
        setBanners([DEFAULT_MIDDLE_ITEM]);
      }
    } catch (err) {
      console.error('Failed to load middle section from Supabase:', err);
      setBanners([DEFAULT_MIDDLE_ITEM]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTag('THE PURNYA STANDARD');
    setTitle('');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1535632066927-ab7c9ab60908');
    setFeat1('Skin-Safe Hypoallergenic & Nickel Free');
    setFeat2('Anti-Tarnish Protective Ceramic Seal');
    setFeat3('Ethically Sourced Genuine Freshwater Pearls');
    setFeat4('Hand-Set AAA Cubic Zirconia & Gemstones');
    setPrimaryText('SHOP COMPLETE CATALOG');
    setPrimaryLink('/catalog');
    setSecondaryText('EXPLORE OTHER 4 WORLDS');
    setSecondaryLink('/worlds');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: HomeMiddleSection) => {
    setEditingId(item.id);
    setTag(item.tag);
    setTitle(item.title);
    setDescription(item.description);
    setImageUrl(item.imageUrl);
    setFeat1(item.features[0] || '');
    setFeat2(item.features[1] || '');
    setFeat3(item.features[2] || '');
    setFeat4(item.features[3] || '');
    setPrimaryText(item.primaryButtonText);
    setPrimaryLink(item.primaryButtonLink);
    setSecondaryText(item.secondaryButtonText);
    setSecondaryLink(item.secondaryButtonLink);
    setIsModalOpen(true);
  };

  // Upload file directly to Supabase storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const publicUrl = await uploadHomeImageToSupabase(file, 'middle-section');
      setImageUrl(publicUrl);
      showToast('Image uploaded to Supabase storage successfully!');
    } catch (err: any) {
      console.error('Image upload failed:', err);
      showToast(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please provide a title.');
      return;
    }

    setSaving(true);
    const newFeatures = [feat1, feat2, feat3, feat4].map(s => s.trim()).filter(Boolean);

    const targetItem: HomeMiddleSection = {
      id: editingId || `homepage-middle-${Date.now()}`,
      tag: tag.toUpperCase().trim(),
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
      features: newFeatures,
      primaryButtonText: primaryText.trim(),
      primaryButtonLink: primaryLink.trim() || '/catalog',
      secondaryButtonText: secondaryText.trim(),
      secondaryButtonLink: secondaryLink.trim() || '/worlds',
      isActive: true,
    };

    try {
      const result = await upsertHomeMiddleSectionToSupabase(targetItem);
      if (result.success) {
        showToast(editingId ? 'Banner updated in Supabase successfully!' : 'Banner published to Supabase successfully!');
        setIsModalOpen(false);
        await loadData();
      } else {
        showToast(`Save failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err?.message || 'Failed to save'}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: HomeMiddleSection) => {
    const updated: HomeMiddleSection = { ...item, isActive: !item.isActive };
    setBanners(banners.map(b => b.id === item.id ? updated : b));
    try {
      await upsertHomeMiddleSectionToSupabase(updated);
      showToast(`Banner marked as ${updated.isActive ? 'Active' : 'Inactive'} in Supabase.`);
    } catch {
      showToast('Failed to update status in Supabase.');
    }
  };

  const deleteBanner = async (id: string) => {
    if (confirm('Are you sure you want to delete this standard banner from Supabase?')) {
      const prev = [...banners];
      setBanners(banners.filter(b => b.id !== id));
      try {
        const success = await deleteHomeMiddleSectionFromSupabase(id);
        if (success) {
          showToast('Banner deleted from Supabase.');
        } else {
          setBanners(prev);
          showToast('Failed to delete banner from Supabase.');
        }
      } catch {
        setBanners(prev);
        showToast('Error deleting banner from Supabase.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2C4A3E]">
            Loading Middle Section from Supabase...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 relative font-sans">
      {/* Toast Feedback Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#0B241C] text-white shadow-xl text-xs border border-[#C5A059]/40 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Live in Supabase</span>
            </span>
          </div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Brand Standards &amp; Feature Banners (Middle Section)
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Add, edit, and preview multi-world editorial craftsmanship blocks displayed on the live homepage.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Standard Block</span>
        </button>
      </div>

      {/* Render All Cards */}
      <div className="space-y-8">
        {banners.map((item) => (
          <div
            key={item.id}
            className={`rounded-3xl border transition-all bg-[#0B241C] text-white overflow-hidden shadow-2xl flex flex-col lg:flex-row relative ${
              item.isActive ? 'border-[#C5A059]/40' : 'border-gray-700 opacity-60'
            }`}
          >
            <div className="p-6 sm:p-12 flex-1 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                    {item.tag}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      item.isActive ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-[#C5A059] hover:text-[#0B241C] transition text-white cursor-pointer"
                      title="Edit Card"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteBanner(item.id)}
                      className="p-1.5 rounded-lg bg-red-900/30 hover:bg-red-600 text-red-300 hover:text-white transition cursor-pointer"
                      title="Delete Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h2 className="font-serif-title text-2xl sm:text-4xl font-normal text-white leading-tight">
                  {item.title}
                </h2>

                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl">
                  {item.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                  {item.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-gray-200">
                      <div className="w-4 h-4 rounded-full bg-[#C5A059]/20 flex items-center justify-center shrink-0 border border-[#C5A059]/40">
                        <CheckCircle2 className="w-3 h-3 text-[#C5A059]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  className="px-6 py-3 rounded-xl bg-[#C5A059] text-[#0B241C] font-bold text-xs tracking-wider uppercase shadow-md cursor-default"
                >
                  {item.primaryButtonText}
                </button>

                <button
                  type="button"
                  className="px-6 py-3 rounded-xl bg-transparent border border-white/20 text-white font-semibold text-xs tracking-wider uppercase flex items-center gap-2 cursor-default"
                >
                  <span>{item.secondaryButtonText}</span>
                  <ArrowUpRight className="w-4 h-4 text-[#C5A059]" />
                </button>

                <button
                  onClick={() => toggleStatus(item)}
                  className="ml-auto text-xs text-[#C5A059] hover:underline font-semibold cursor-pointer"
                >
                  {item.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>

            <div className="lg:w-2/5 min-h-[320px] lg:min-h-[420px] relative bg-[#071a13] border-t lg:border-t-0 lg:border-l border-white/10 overflow-hidden flex items-center justify-center">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover opacity-95"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Modal with File Upload Input */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 border border-[#E2DBD0] shadow-2xl text-xs my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#EFEBE3]">
              <h3 className="font-serif-title text-lg font-bold text-[#0B241C]">
                {editingId ? 'Edit Brand Standard Banner' : 'Create Brand Standard Banner'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#5A7469] hover:text-[#0B241C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Top Badge Tag</label>
                <input
                  type="text"
                  required
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g. THE PURNYA STANDARD"
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] uppercase font-bold text-[#0B241C]"
                />
              </div>

              {/* File Upload to Supabase */}
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Upload Banner Photo (Supabase Storage)</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-[#C5A059] bg-[#EBF3EF]/50 hover:bg-[#EBF3EF] cursor-pointer text-[#0B241C] font-semibold transition">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                    ) : (
                      <Upload className="w-4 h-4 text-[#C5A059]" />
                    )}
                    <span className="truncate">{uploading ? 'Uploading to Supabase...' : 'Choose Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Or Image URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2.5 rounded-xl border border-[#E2DBD0] text-[#0B241C] text-xs font-mono"
              />
            </div>

            {/* Live Image Preview Thumbnail inside Modal */}
            {imageUrl && (
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#EFEBE3]/40 border border-[#E2DBD0]">
                <img src={imageUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-[#E2DBD0]" />
                <div className="truncate flex-1">
                  <p className="font-semibold text-[#0B241C]">Image Attached ✓</p>
                  <p className="text-[10px] text-gray-500 truncate">{imageUrl}</p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Headline Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Artisanal Metallurgy & Anti-Tarnish Elegance"
                className="w-full p-3 rounded-xl border border-[#E2DBD0] font-bold text-[#0B241C]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Description Paragraph</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Every piece of Purnya Jewellery is cast from..."
                className="w-full p-3 rounded-xl border border-[#E2DBD0]"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-[#EFEBE3]">
              <label className="font-semibold text-[#2C4A3E]">4 Checkmark Feature Points</label>
              <input type="text" value={feat1} onChange={(e) => setFeat1(e.target.value)} placeholder="Feature 1" className="w-full p-2.5 rounded-xl border border-[#E2DBD0]" />
              <input type="text" value={feat2} onChange={(e) => setFeat2(e.target.value)} placeholder="Feature 2" className="w-full p-2.5 rounded-xl border border-[#E2DBD0]" />
              <input type="text" value={feat3} onChange={(e) => setFeat3(e.target.value)} placeholder="Feature 3" className="w-full p-2.5 rounded-xl border border-[#E2DBD0]" />
              <input type="text" value={feat4} onChange={(e) => setFeat4(e.target.value)} placeholder="Feature 4" className="w-full p-2.5 rounded-xl border border-[#E2DBD0]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#EFEBE3]">
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Primary Button Text</label>
                <input type="text" value={primaryText} onChange={(e) => setPrimaryText(e.target.value)} className="w-full p-2.5 rounded-xl border border-[#E2DBD0]" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Primary Button Link</label>
                <input type="text" value={primaryLink} onChange={(e) => setPrimaryLink(e.target.value)} className="w-full p-2.5 rounded-xl border border-[#E2DBD0]" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Secondary Button Text</label>
                <input type="text" value={secondaryText} onChange={(e) => setSecondaryText(e.target.value)} className="w-full p-2.5 rounded-xl border border-[#E2DBD0]" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Secondary Button Link</label>
                <input type="text" value={secondaryLink} onChange={(e) => setSecondaryLink(e.target.value)} className="w-full p-2.5 rounded-xl border border-[#E2DBD0]" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#EFEBE3]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E2DBD0] text-[#2C4A3E] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-6 py-2 rounded-xl bg-[#C5A059] text-[#0B241C] font-bold shadow-md uppercase tracking-wider cursor-pointer flex items-center gap-2 hover:bg-[#b5914a] transition-colors"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingId ? 'Update in Supabase' : 'Publish to Supabase'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}