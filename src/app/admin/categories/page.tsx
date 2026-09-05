'use client';

import React, { useState } from 'react';
import { Layers, Plus, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { MainCategorySlug } from '../../../types';

export default function AdminCategoriesPage() {
  const { categories, products, addCategorySubcategory } = useStore();

  const [selectedCatSlug, setSelectedCatSlug] = useState<string>('');
  const [newSubcatName, setNewSubcatName] = useState('');
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  const openSubModal = (slug: string) => {
    setSelectedCatSlug(slug);
    setNewSubcatName('');
    setIsSubModalOpen(true);
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcatName.trim() || !selectedCatSlug) return;
    addCategorySubcategory(selectedCatSlug, newSubcatName.trim());
    setIsSubModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
          Categories & Subcategories Management
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E]">
          Manage the 5 core Purnya lifestyle categories and configure subcategory taxonomy (SOW Section 7).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const catProducts = products.filter((p) => p.categorySlug === cat.slug);

          return (
            <div
              key={cat.slug}
              className="bg-white rounded-3xl border border-[#E2DBD0] overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/9] w-full bg-[#0B241C]">
                  <img
                    src={cat.bannerImage || cat.heroImage}
                    alt={cat.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">
                      Main Category
                    </span>
                    <h3 className="font-serif-title text-lg font-bold">{cat.title}</h3>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <p className="text-[#2C4A3E] line-clamp-2">{cat.subtitle}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[#5A7469] font-bold uppercase tracking-wider text-[11px]">
                      <span>Subcategories ({cat.subcategories.filter((s) => s !== 'All').length})</span>
                      <span>{catProducts.length} live products</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {cat.subcategories
                        .filter((s) => s !== 'All')
                        .map((sub) => (
                          <span
                            key={sub}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E2DBD0] text-[#0B241C] font-medium"
                          >
                            {sub}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-[#EFEBE3] mt-4 flex items-center justify-between">
                <button
                  onClick={() => openSubModal(cat.slug)}
                  className="px-4 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#0B241C] text-[#0B241C] hover:text-white border border-[#E2DBD0] font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subcategory</span>
                </button>

                <a
                  href={`/category/${cat.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#C5A059] hover:underline flex items-center gap-1"
                >
                  <span>View Landing</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Subcategory Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleAddSub}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E2DBD0] shadow-2xl text-xs"
          >
            <h3 className="font-serif-title text-lg font-bold text-[#0B241C]">
              Add Subcategory to {categories.find((c) => c.slug === selectedCatSlug)?.title}
            </h3>
            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Subcategory Name</label>
              <input
                type="text"
                required
                value={newSubcatName}
                onChange={(e) => setNewSubcatName(e.target.value)}
                placeholder="e.g. Choker Sets, Scented Sachets"
                className="w-full p-3 rounded-xl border border-[#E2DBD0]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsSubModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E2DBD0] text-[#2C4A3E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#C5A059] text-[#0B241C] font-bold"
              >
                Add Subcategory
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
