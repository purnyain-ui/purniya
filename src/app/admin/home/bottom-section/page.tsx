'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Edit3, Trash2, Upload, Loader2, CheckCircle2 } from 'lucide-react';

interface IntegrityCard {
  title: string;
  subtitle?: string;
  description: string;
  iconText: string;
  image: string;
}

interface IntegritySection {
  id: string | number;
  tag: string;
  heading: string;
  subheading: string;
  cards: IntegrityCard[];
  is_active: boolean;
}

export default function AdminIntegrityStandardsPage() {
  // Initial dataset simulating your SQL Database Table rows
  const [sections, setSections] = useState<IntegritySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  // Form States
  const [tag, setTag] = useState('THE PURNYA STANDARD');
  const [heading, setHeading] = useState('');
  const [subheading, setSubheading] = useState('');
  const [cards, setCards] = useState<IntegrityCard[]>([
    { iconText: '18K', title: '', description: '', image: '' },
    { iconText: '100%', title: '', description: '', image: '' },
    { iconText: 'Origin', title: '', description: '', image: '' }
  ]);

  // Simulate Fetching from Database on Page Load
  useEffect(() => {
    const timer = setTimeout(() => {
      const initialDbData: IntegritySection[] = [
        {
          id: 1,
          tag: 'THE PURNYA STANDARD',
          heading: 'Artisanal Integrity in Every Creation',
          subheading: 'From conscious sourcing to anti-tarnish protective sealing, our commitment to mindful luxury is uncompromising.',
          cards: [
            {
              iconText: '18K',
              title: 'Gold Vermeil & Anti-Tarnish Sealing',
              description: 'Handcrafted jewellery plated with genuine 18-karat gold over hypoallergenic brass and finished with proprietary nano-ceramic sealing.',
              image: ''
            },
            {
              iconText: '100%',
              title: 'Clean Natural Sand Wax Formulations',
              description: 'Granulated plant-based sand and pearl wax that burns soot-free with pure cotton wicks and distilled aromatic botanicals.',
              image: ''
            },
            {
              iconText: 'Origin',
              title: 'Direct Single-Origin Ethical Sourcing',
              description: 'Herbal wellness infusions and handcrafted stoneware produced in ethical artisan cooperatives with traceable, conscious materials.',
              image: ''
            }
          ],
          is_active: true
        }
      ];
      setSections(initialDbData);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const showNotificationMsg = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTag('THE PURNYA STANDARD');
    setHeading('');
    setSubheading('');
    setCards([
      { iconText: '18K', title: 'Gold Vermeil & Anti-Tarnish Sealing', description: 'Handcrafted jewellery plated with genuine 18-karat gold over hypoallergenic brass and finished with proprietary nano-ceramic sealing.', image: '' },
      { iconText: '100%', title: 'Clean Natural Sand Wax Formulations', description: 'Granulated plant-based sand and pearl wax that burns soot-free with pure cotton wicks and distilled aromatic botanicals.', image: '' },
      { iconText: 'Origin', title: 'Direct Single-Origin Ethical Sourcing', description: 'Herbal wellness infusions and handcrafted stoneware produced in ethical artisan cooperatives with traceable, conscious materials.', image: '' }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: IntegritySection) => {
    setEditingId(item.id);
    setTag(item.tag);
    setHeading(item.heading);
    setSubheading(item.subheading);
    setCards(JSON.parse(JSON.stringify(item.cards)));
    setIsModalOpen(true);
  };

  const handleCardChange = (index: number, field: keyof IntegrityCard, value: string) => {
    const updated = [...cards];
    updated[index][field] = value;
    setCards(updated);
  };

  const handleCardImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      handleCardChange(index, 'image', localUrl);
    }
  };

  // Simulate Saving/Updating to Database State
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heading.trim()) return;

    setSaving(true);
    setTimeout(() => {
      if (editingId) {
        // UPDATE query logic simulation
        setSections(sections.map(sec => sec.id === editingId ? {
          ...sec,
          tag: tag.toUpperCase(),
          heading,
          subheading,
          cards
        } : sec));
        showNotificationMsg('Successfully updated in database!');
      } else {
        // INSERT query logic simulation
        const newEntry: IntegritySection = {
          id: Date.now(),
          tag: tag.toUpperCase(),
          heading,
          subheading,
          cards,
          is_active: true
        };
        setSections([newEntry, ...sections]);
        showNotificationMsg('Successfully saved new entry to database!');
      }

      setSaving(false);
      setIsModalOpen(false);
    }, 400);
  };

  const deleteSection = (id: string | number) => {
    if (confirm('Are you sure you want to delete this section from the database?')) {
      setSections(sections.filter(s => s.id !== id));
      showNotificationMsg('Section deleted from database.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F5]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 bg-[#FAF9F5] min-h-screen relative font-sans">
      {/* Toast Feedback Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#0B241C] text-white shadow-xl text-xs">
          <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Artisanal Integrity Standards (Database Page)
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Manage your 3-column features matching your live design layout.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Integrity Section</span>
        </button>
      </div>

      {/* Main Sections List */}
      <div className="space-y-12">
        {sections.map((sec) => (
          <div key={sec.id} className="p-6 sm:p-12 rounded-3xl border bg-white shadow-sm border-[#E2DBD0]">
            <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#EFEBE3]">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#EBF3EF] text-[#C5A059] border border-[#E2DBD0]">
                {sec.tag}
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => handleOpenEdit(sec)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#C5A059] hover:text-white transition" title="Edit Section">
                  <Edit3 className="w-4 h-4 text-[#0B241C]" />
                </button>
                <button onClick={() => deleteSection(sec.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white transition text-red-600" title="Delete Section">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[#C5A059]">{sec.tag}</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#0B241C]">{sec.heading}</h2>
              <p className="text-xs sm:text-sm text-[#2C4A3E]">{sec.subheading}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sec.cards.map((card, cIdx) => (
                <div key={cIdx} className="p-8 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#EBF3EF] border border-[#E2DBD0] flex items-center justify-center font-serif text-xs font-bold text-[#0B241C]">
                      {card.iconText}
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#0B241C]">{card.title}</h3>
                    <p className="text-xs text-[#2C4A3E] leading-relaxed">{card.description}</p>
                  </div>
                  {card.image && (
                    <div className="w-full h-32 rounded-xl overflow-hidden border border-[#E2DBD0]">
                      <img src={card.image} alt="Card visual" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <form onSubmit={handleSave} className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 border border-[#E2DBD0] shadow-2xl text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-[#EFEBE3]">
              <h3 className="font-serif text-lg font-bold text-[#0B241C]">
                {editingId ? 'Edit Integrity Section' : 'Create Integrity Section'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-[#5A7469] hover:text-[#0B241C]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Top Sub-Tag</label>
                <input type="text" required value={tag} onChange={(e) => setTag(e.target.value)} className="w-full p-3 rounded-xl border border-[#E2DBD0] uppercase font-bold text-[#0B241C]" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Main Header Title</label>
                <input type="text" required value={heading} onChange={(e) => setHeading(e.target.value)} className="w-full p-3 rounded-xl border border-[#E2DBD0] font-bold text-[#0B241C]" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Subheading Paragraph</label>
              <textarea rows={2} required value={subheading} onChange={(e) => setSubheading(e.target.value)} className="w-full p-3 rounded-xl border border-[#E2DBD0]" />
            </div>

            {/* 3 Cards Configuration Loop */}
            <div className="space-y-4 pt-4 border-t border-[#EFEBE3]">
              <h4 className="font-bold text-sm text-[#0B241C]">Configure the 3 Feature Cards</h4>
              {cards.map((card, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E2DBD0] space-y-3">
                  <p className="font-bold text-[#C5A059]">Card #{idx + 1}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-[#2C4A3E]">Badge Text</label>
                      <input type="text" value={card.iconText} onChange={(e) => handleCardChange(idx, 'iconText', e.target.value)} className="w-full p-2.5 rounded-xl border border-[#E2DBD0] bg-white font-bold" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-semibold text-[#2C4A3E]">Card Title</label>
                      <input type="text" value={card.title} onChange={(e) => handleCardChange(idx, 'title', e.target.value)} className="w-full p-2.5 rounded-xl border border-[#E2DBD0] bg-white font-bold" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#2C4A3E]">Card Description</label>
                    <textarea rows={2} value={card.description} onChange={(e) => handleCardChange(idx, 'description', e.target.value)} className="w-full p-2.5 rounded-xl border border-[#E2DBD0] bg-white" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-[#C5A059] bg-white hover:bg-[#EBF3EF] cursor-pointer text-[#0B241C] font-semibold transition text-[11px]">
                      <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>{card.image ? 'Change Card Photo' : 'Upload Card Photo (Optional)'}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleCardImageUpload(idx, e)} className="hidden" />
                    </label>
                    {card.image && <span className="text-[10px] text-emerald-700 font-semibold">Attached ✓</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#EFEBE3]">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-[#E2DBD0] text-[#2C4A3E]">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-2 rounded-xl bg-[#C5A059] text-[#0B241C] font-bold shadow-md uppercase tracking-wider cursor-pointer flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingId ? 'Update in Database' : 'Save to Database'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}