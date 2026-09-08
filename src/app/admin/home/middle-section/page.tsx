'use client';

import React, { useState } from 'react';
import { Plus, CheckCircle2, X, Edit3, Trash2, ArrowUpRight, Upload } from 'lucide-react';

interface StandardBanner {
  id: string;
  tag: string;
  title: string;
  description: string;
  imageUrl: string;
  features: string[];
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  isActive: boolean;
}

export default function AdminStandardsPage() {
  const [banners, setBanners] = useState<StandardBanner[]>([
    {
      id: '1',
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
    }
  ]);

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

  const handleOpenEdit = (item: StandardBanner) => {
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

  // Handler to convert uploaded file into a local preview URL
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newFeatures = [feat1, feat2, feat3, feat4].filter(Boolean);

    if (editingId) {
      setBanners(banners.map(b => b.id === editingId ? {
        ...b,
        tag: tag.toUpperCase(),
        title,
        description,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
        features: newFeatures,
        primaryButtonText: primaryText,
        primaryButtonLink: primaryLink,
        secondaryButtonText: secondaryText,
        secondaryButtonLink: secondaryLink,
      } : b));
    } else {
      const newBanner: StandardBanner = {
        id: Date.now().toString(),
        tag: tag.toUpperCase(),
        title,
        description,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
        features: newFeatures,
        primaryButtonText: primaryText,
        primaryButtonLink: primaryLink,
        secondaryButtonText: secondaryText,
        secondaryButtonLink: secondaryLink,
        isActive: true,
      };
      setBanners([newBanner, ...banners]);
    }

    setIsModalOpen(false);
  };

  const toggleStatus = (id: string) => {
    setBanners(banners.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b));
  };

  const deleteBanner = (id: string) => {
    if (confirm('Are you sure you want to delete this standard banner?')) {
      setBanners(banners.filter(b => b.id !== id));
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Brand Standards & Feature Banners
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Add, edit, and preview multi-world editorial craftsmanship blocks.
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
            className={`rounded-3xl border transition-all bg-[#0B241C] text-white overflow-hidden shadow-2xl flex flex-col lg:flex-row relative ${item.isActive ? 'border-[#C5A059]/40' : 'border-gray-700 opacity-60'
              }`}
          >
            <div className="p-6 sm:p-12 flex-1 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                    {item.tag}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.isActive ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'bg-gray-800 text-gray-400'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-[#C5A059] hover:text-[#0B241C] transition text-white"
                      title="Edit Card"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteBanner(item.id)}
                      className="p-1.5 rounded-lg bg-red-900/30 hover:bg-red-600 text-red-300 hover:text-white transition"
                      title="Delete Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h2 className="font-serif text-2xl sm:text-4xl font-normal text-white leading-tight">
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
                  onClick={() => alert(`Navigating to: ${item.primaryButtonLink}`)}
                  className="px-6 py-3 rounded-xl bg-[#C5A059] text-[#0B241C] font-bold text-xs tracking-wider uppercase hover:bg-white transition shadow-md cursor-pointer"
                >
                  {item.primaryButtonText}
                </button>

                <button
                  onClick={() => alert(`Navigating to: ${item.secondaryButtonLink}`)}
                  className="px-6 py-3 rounded-xl bg-transparent border border-white/20 text-white font-semibold text-xs tracking-wider uppercase hover:bg-white/10 transition flex items-center gap-2 cursor-pointer"
                >
                  <span>{item.secondaryButtonText}</span>
                  <ArrowUpRight className="w-4 h-4 text-[#C5A059]" />
                </button>

                <button
                  onClick={() => toggleStatus(item.id)}
                  className="ml-auto text-xs text-[#C5A059] hover:underline font-semibold"
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
              <h3 className="font-serif text-lg font-bold text-[#0B241C]">
                {editingId ? 'Edit Brand Standard Banner' : 'Create Brand Standard Banner'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#5A7469] hover:text-[#0B241C]"
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

              {/* File Upload Component Field */}
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Upload Banner Photo</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-[#C5A059] bg-[#EBF3EF]/50 hover:bg-[#EBF3EF] cursor-pointer text-[#0B241C] font-semibold transition">
                    <Upload className="w-4 h-4 text-[#C5A059]" />
                    <span className="truncate">Choose Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Live Image Preview Thumbnail inside Modal */}
            {imageUrl && (
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#EFEBE3]/40 border border-[#E2DBD0]">
                <img src={imageUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-[#E2DBD0]" />
                <div className="truncate flex-1">
                  <p className="font-semibold text-[#0B241C]">Image Loaded Successfully</p>
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
                className="px-4 py-2 rounded-xl border border-[#E2DBD0] text-[#2C4A3E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-[#C5A059] text-[#0B241C] font-bold shadow-md uppercase tracking-wider cursor-pointer"
              >
                {editingId ? 'Update Banner' : 'Publish Banner'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}