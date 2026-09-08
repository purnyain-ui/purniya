'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Save, Edit3, Trash2, Plus, Upload, CheckCircle, Sparkles, Database } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { HeroSlide } from '../../../types';
import { initialHeroSlides } from '../../../data/mockData';

const defaultNewSlide: HeroSlide = {
  id: '',
  title: '',
  subtitle: '',
  pretitle: '',
  ctaText: 'Explore Collection',
  ctaLink: '/category/apparel',
  image: '',
  active: true,
};

const SUGGESTED_LINKS = [
  { label: 'Jewellery', path: '/category/apparel' },
  { label: 'Home Décor', path: '/category/Lifestyle' },
  { label: 'Gifts', path: '/category/Gift' },
  { label: 'Wellness', path: '/category/Wellness' },
  { label: 'Fragrance', path: '/category/Fragrance' },
];

export default function AdminBannersPage() {
  const {
    banners,
    addHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
    announcement,
    updateAnnouncement,
  } = useStore();

  const [announcementText, setAnnouncementText] = useState(announcement);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    if (announcement) {
      setAnnouncementText(announcement);
    }
  }, [announcement]);

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    updateAnnouncement(announcementText);
  };

  const handleOpenAddModal = () => {
    setEditingSlide({
      ...defaultNewSlide,
      id: 'banner-' + Date.now(),
    });
    setIsAddingNew(true);
  };

  const handleOpenEditModal = (slide: HeroSlide) => {
    setEditingSlide({ ...slide });
    setIsAddingNew(false);
  };

  const handleCloseModal = () => {
    setEditingSlide(null);
    setIsAddingNew(false);
  };

  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;
    if (!editingSlide.title.trim() || !editingSlide.image.trim()) {
      alert('Please provide both a Title and an Image.');
      return;
    }

    if (isAddingNew) {
      addHeroSlide(editingSlide);
    } else {
      updateHeroSlide(editingSlide);
    }
    handleCloseModal();
  };

  const handleRestoreDefaults = () => {
    if (confirm('Load recommended luxury jewellery hero slides?')) {
      initialHeroSlides.forEach((slide) => {
        addHeroSlide(slide);
      });
    }
  };

  const activeCount = banners.filter((b) => b.active).length;

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Banners & Website Content
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Manage homepage promotional hero sliders, top marketing announcements, and seasonal visual banners.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#0B241C] hover:bg-[#C5A059] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Announcement Bar Manager */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C] flex items-center gap-2">
              <span>Storewide Top Announcement Bar</span>
            </h2>
            <p className="text-xs text-[#2C4A3E]">
              Displayed prominently across the very top bar of all storefront pages.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Live in Database</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveAnnouncement} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="e.g. Free Express Shipping on Orders Above ₹999 | Cash on Delivery Available"
            className="flex-1 p-3.5 rounded-xl border border-[#E2DBD0] text-xs font-medium text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
          />
          <button
            type="submit"
            className="px-6 py-3.5 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Update Announcement</span>
          </button>
        </form>
      </div>

      {/* Hero Carousel Slides Manager */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EFEBE3]">
          <div>
            <h2 className="font-serif-title text-xl font-bold text-[#0B241C] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#C5A059]" />
              <span>Homepage Hero Carousel Slides</span>
            </h2>
            <p className="text-xs text-[#5A7469]">
              {banners.length} total slides ({activeCount} active on landing page)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {banners.length === 0 && (
              <button
                onClick={handleRestoreDefaults}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C5A059] text-[#0B241C] hover:bg-[#FAF8F5] text-xs font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Load Luxury Presets</span>
              </button>
            )}

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#B38F48] text-[#0B241C] font-bold text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Slide</span>
            </button>
          </div>
        </div>

        {/* Empty state if no banners */}
        {banners.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-[#E2DBD0] p-12 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#C5A059]">
              <ImageIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif-title text-lg font-bold text-[#0B241C]">
                No Hero Carousel Slides
              </h3>
              <p className="text-xs text-[#5A7469] max-w-md mx-auto mt-1">
                Your homepage hero carousel is currently empty. Add your own promotional slides or load our curated luxury presets.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleRestoreDefaults}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#1E4334] text-white font-bold text-xs"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>Load Curated Luxury Presets</span>
              </button>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#B38F48] text-[#0B241C] font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Banner</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((slide) => (
              <div
                key={slide.id}
                className={`bg-white rounded-3xl border transition-all overflow-hidden shadow-sm flex flex-col justify-between ${slide.active ? 'border-[#E2DBD0]' : 'border-gray-200 opacity-75'
                  }`}
              >
                <div>
                  <div className="relative aspect-[16/9] w-full bg-[#0B241C] overflow-hidden group">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Active/Hidden pill top right */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${slide.active
                            ? 'bg-emerald-500/90 text-white shadow-sm'
                            : 'bg-black/60 text-gray-300'
                          }`}
                      >
                        {slide.active ? 'Active' : 'Hidden'}
                      </span>
                    </div>

                    {/* Pretitle & Title overlay */}
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      {slide.pretitle && (
                        <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider block mb-1">
                          {slide.pretitle}
                        </span>
                      )}
                      <h3 className="font-serif-title text-base font-bold line-clamp-1">
                        {slide.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-3 text-xs">
                    <p className="text-[#2C4A3E] line-clamp-2 leading-relaxed">
                      {slide.subtitle || 'No descriptive subtitle provided.'}
                    </p>
                    <div className="pt-2 border-t border-[#F2EFE9] flex items-center justify-between text-[#5A7469]">
                      <span className="font-medium">
                        CTA: <strong className="text-[#0B241C]">{slide.ctaText || 'Shop Now'}</strong>
                      </span>
                      <span className="text-[11px] font-mono text-[#C5A059] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E2DBD0]">
                        {slide.ctaLink}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-[#EFEBE3] mt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => updateHeroSlide({ ...slide, active: !slide.active })}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors ${slide.active
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                  >
                    {slide.active ? 'Disable' : 'Enable'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(slide)}
                      className="px-3 py-1.5 rounded-xl border border-[#E2DBD0] hover:border-[#C5A059] text-xs font-semibold text-[#0B241C] hover:bg-[#FAF8F5] flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete banner "${slide.title}"?`)) {
                          deleteHeroSlide(slide.id);
                        }
                      }}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Slide Modal */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <form
            onSubmit={handleSaveSlide}
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-4 border border-[#E2DBD0] shadow-2xl text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3]">
              <h3 className="font-serif-title text-lg sm:text-xl font-bold text-[#0B241C]">
                {isAddingNew ? 'Create New Hero Banner' : 'Edit Hero Banner'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Pretitle / Tag */}
            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Pretitle / Collection Tag</label>
              <input
                type="text"
                value={editingSlide.pretitle || ''}
                onChange={(e) => setEditingSlide({ ...editingSlide, pretitle: e.target.value })}
                placeholder="e.g. Royal Heritage Collection, Festive Edit 2025"
                className="w-full p-3 rounded-xl border border-[#E2DBD0] text-xs focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            {/* Main Title */}
            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Main Title *</label>
              <input
                type="text"
                required
                value={editingSlide.title}
                onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                placeholder="e.g. Handcrafted Kundan & Polki Heirlooms"
                className="w-full p-3 rounded-xl border border-[#E2DBD0] font-bold text-xs text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            {/* Subtitle / Description */}
            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Description / Subtitle</label>
              <textarea
                rows={3}
                value={editingSlide.subtitle}
                onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                placeholder="Brief evocative description of the collection or offer displayed on the hero slide..."
                className="w-full p-3 rounded-xl border border-[#E2DBD0] text-xs focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            {/* CTA Button Text & Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">CTA Button Text *</label>
                <input
                  type="text"
                  required
                  value={editingSlide.ctaText}
                  onChange={(e) => setEditingSlide({ ...editingSlide, ctaText: e.target.value })}
                  placeholder="e.g. Explore Jewellery"
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">CTA Destination Link *</label>
                <input
                  type="text"
                  required
                  value={editingSlide.ctaLink}
                  onChange={(e) => setEditingSlide({ ...editingSlide, ctaLink: e.target.value })}
                  placeholder="e.g. /category/apparel"
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] text-xs"
                />
              </div>
            </div>

            {/* Quick suggested links */}
            <div>
              <p className="text-[11px] text-[#5A7469] mb-1.5">Quick fill link:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_LINKS.map((link) => (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => setEditingSlide({ ...editingSlide, ctaLink: link.path })}
                    className="px-2 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#EFEBE3] border border-[#E2DBD0] text-[10px] text-[#0B241C] font-medium transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slide Image Preview & Inputs */}
            <div className="space-y-2 pt-2 border-t border-[#EFEBE3]">
              <label className="font-semibold text-[#2C4A3E] block">
                Slide Hero Image * (High-resolution 16:9 recommended)
              </label>

              {editingSlide.image && (
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-[#E2DBD0] bg-[#0B241C]">
                  <img
                    src={editingSlide.image}
                    alt="Slide Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-2 left-3 text-white text-[11px] font-medium drop-shadow">
                    Preview: {editingSlide.title || 'Slide Title'}
                  </div>
                </div>
              )}

              {/* Upload file from computer */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-[#E2DBD0] hover:border-[#C5A059] bg-[#FAF8F5] text-center relative cursor-pointer transition-colors">
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
                  <p className="font-bold text-[#0B241C] text-xs">
                    Upload Banner Image from Computer
                  </p>
                  <p className="text-[10px] text-[#5A7469]">Supports JPG, PNG, WEBP (1920×1080 recommended)</p>
                </div>
              </div>

              {/* Or paste URL */}
              <div>
                <label className="block text-[11px] text-[#5A7469] mb-1">
                  Or paste direct Image URL:
                </label>
                <input
                  type="url"
                  value={editingSlide.image}
                  onChange={(e) => setEditingSlide({ ...editingSlide, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-[#E2DBD0] text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            {/* Active Status Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingSlide.active}
                  onChange={(e) => setEditingSlide({ ...editingSlide, active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B241C]"></div>
              </label>
              <span className="text-xs font-semibold text-[#0B241C]">
                Make this banner active immediately on the homepage carousel
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-[#EFEBE3]">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2.5 rounded-xl border border-[#E2DBD0] text-[#2C4A3E] font-medium hover:bg-[#FAF8F5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#B38F48] text-[#0B241C] font-bold shadow-md transition-colors"
              >
                {isAddingNew ? 'Create Banner' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
