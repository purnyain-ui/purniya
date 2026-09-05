'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, Save, Edit3, Eye, Upload } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { HeroSlide } from '../../../types';

export default function AdminBannersPage() {
  const { banners, updateHeroSlide, announcement, updateAnnouncement } = useStore();

  const [announcementText, setAnnouncementText] = useState(announcement);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    updateAnnouncement(announcementText);
  };

  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;
    updateHeroSlide(editingSlide);
    setEditingSlide(null);
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div>
        <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
          Banners & Website Content
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E]">
          Manage homepage promotional hero sliders, marketing announcements, and seasonal visual banners (SOW Section 18).
        </p>
      </div>

      {/* Announcement Bar Manager */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-4">
        <h2 className="font-serif-title text-lg font-bold text-[#0B241C] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C5A059]" />
          <span>Storewide Announcement Bar</span>
        </h2>
        <p className="text-xs text-[#2C4A3E]">
          Displayed prominently across the very top of all customer pages.
        </p>

        <form onSubmit={handleSaveAnnouncement} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            className="flex-1 p-3 rounded-xl border border-[#E2DBD0] text-xs font-medium text-[#0B241C]"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Update Announcement
          </button>
        </form>
      </div>

      {/* Hero Carousel Slides Manager */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-title text-xl font-bold text-[#0B241C]">
            Homepage Hero Carousel Slides
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {banners.map((slide) => (
            <div
              key={slide.id}
              className="bg-white rounded-3xl border border-[#E2DBD0] overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/9] w-full bg-[#0B241C]">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover opacity-75"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    {slide.pretitle && (
                      <span className="text-[10px] uppercase font-bold text-[#D4AF37] block">
                        {slide.pretitle}
                      </span>
                    )}
                    <h3 className="font-serif-title text-base font-bold">{slide.title}</h3>
                  </div>
                </div>

                <div className="p-5 space-y-2 text-xs">
                  <p className="text-[#2C4A3E] line-clamp-2">{slide.subtitle}</p>
                  <p className="text-[#5A7469]">
                    Button: <strong className="text-[#0B241C]">{slide.ctaText}</strong> → {slide.ctaLink}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-[#EFEBE3] mt-3 flex items-center justify-between">
                <button
                  onClick={() =>
                    updateHeroSlide({ ...slide, active: !slide.active })
                  }
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    slide.active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {slide.active ? 'Slide Active' : 'Slide Hidden'}
                </button>

                <button
                  onClick={() => setEditingSlide(slide)}
                  className="text-xs font-bold text-[#C5A059] hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Slide</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Slide Modal */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveSlide}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 border border-[#E2DBD0] shadow-2xl text-xs"
          >
            <h3 className="font-serif-title text-lg font-bold text-[#0B241C]">
              Edit Hero Slide
            </h3>

            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Pretitle / Badge</label>
              <input
                type="text"
                value={editingSlide.pretitle || ''}
                onChange={(e) => setEditingSlide({ ...editingSlide, pretitle: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E2DBD0]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Main Title</label>
              <input
                type="text"
                required
                value={editingSlide.title}
                onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E2DBD0] font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Subtitle Text</label>
              <textarea
                rows={2}
                value={editingSlide.subtitle}
                onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E2DBD0]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">CTA Button Text</label>
                <input
                  type="text"
                  required
                  value={editingSlide.ctaText}
                  onChange={(e) => setEditingSlide({ ...editingSlide, ctaText: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#E2DBD0]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">CTA Button Link</label>
                <input
                  type="text"
                  required
                  value={editingSlide.ctaLink}
                  onChange={(e) => setEditingSlide({ ...editingSlide, ctaLink: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#E2DBD0]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-[#2C4A3E]">Slide Image (Local Upload or URL)</label>

              {editingSlide.image && (
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-[#E2DBD0]">
                  <img src={editingSlide.image} alt="Slide Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="p-3.5 rounded-2xl border-2 border-dashed border-[#E2DBD0] hover:border-[#C5A059] bg-[#FAF8F5] text-center relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (loadEvt) => {
                        const result = loadEvt.target?.result as string;
                        setEditingSlide({ ...editingSlide, image: result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="space-y-1">
                  <Upload className="w-5 h-5 text-[#C5A059] mx-auto" />
                  <p className="font-bold text-[#0B241C] text-xs">Upload Slide Image from Computer</p>
                  <p className="text-[10px] text-[#5A7469]">Supports high-res PNG, JPG, WEBP</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#5A7469] mb-1">Or paste Image URL:</label>
                <input
                  type="url"
                  required
                  value={editingSlide.image}
                  onChange={(e) => setEditingSlide({ ...editingSlide, image: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E2DBD0] text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EFEBE3]">
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                className="px-4 py-2 rounded-xl border border-[#E2DBD0] text-[#2C4A3E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-[#C5A059] text-[#0B241C] font-bold shadow-md"
              >
                Save Slide
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
