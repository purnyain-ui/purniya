'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Palette,
  Ruler,
  Tag,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  CheckCircle2,
  X,
  RefreshCw,
  ShoppingBag,
  Star,
  ShieldAlert,
  ExternalLink,
  CloudUpload,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import {
  isSupabaseConfigured,
  getColorPalettesFromSupabase,
  getSizeVariantsFromSupabase,
  getLifestyleSaleTagsFromSupabase,
  checkLifestyleTagsRLS,
  syncAttributesToSupabase,
  deleteColorFromSupabase,
  deleteSizeFromSupabase,
  deleteLifestyleSaleTagFromSupabase,
  upsertColorToSupabase,
  upsertSizeToSupabase,
  upsertLifestyleSaleTagToSupabase,
} from '../../../lib/supabase';

// Types
export interface ColorSwatchItem {
  id: string;
  name: string;
  hex: string;
  category: string;
  description?: string;
  isActive: boolean;
}

export interface SizeVariantItem {
  id: string;
  name: string;
  category: 'Rings' | 'Necklaces' | 'Bracelets' | 'Candles' | 'Decor & Gifts' | 'General';
  dimension: string;
  stockStatus: 'In Stock' | 'Low Stock' | 'Made-to-Order';
  isActive: boolean;
}

export interface LifestyleSaleTagItem {
  id: string;
  name: string;
  isActive: boolean;
}

// Initial Preset Data
const defaultColors: ColorSwatchItem[] = [
  { id: 'c-1', name: '24K Yellow Gold', hex: '#D4AF37', category: 'Jewellery', description: 'Classic radiant Indian gold finish', isActive: true },
  { id: 'c-2', name: 'Rose Gold', hex: '#B76E79', category: 'Jewellery', description: 'Romantic pink-hued 18K plating', isActive: true },
  { id: 'c-3', name: 'Sterling Silver 925', hex: '#C0C0C0', category: 'Jewellery', description: 'Bright rhodium tarnish-resistant silver', isActive: true },
  { id: 'c-4', name: 'Royal Emerald', hex: '#0B241C', category: 'General', description: 'Deep imperial forest green tone', isActive: true },
  { id: 'c-5', name: 'Artisan Pearl Ivory', hex: '#FDFBF7', category: 'Candles', description: 'Lustrous warm Baroque pearl ivory', isActive: true },
  { id: 'c-6', name: 'Sand Wax Caramel', hex: '#C5A059', category: 'Candles', description: 'Signature golden amber beeswax hue', isActive: true },
  { id: 'c-7', name: 'Midnight Onyx Noir', hex: '#1A1A1A', category: 'Jewellery', description: 'Matte black statement stone & finish', isActive: true },
  { id: 'c-8', name: 'Ruby Crimson', hex: '#8B1E2F', category: 'Decor & Gifts', description: 'Festive bridal vermillion crimson', isActive: true },
  { id: 'c-9', name: 'Terracotta Earth', hex: '#D27D2D', category: 'Decor & Gifts', description: 'Handcrafted natural clay and brass warmth', isActive: true },
  { id: 'c-10', name: 'Antique Temple Brass', hex: '#B5A642', category: 'Decor & Gifts', description: 'Vintage heritage pooja brass luster', isActive: true },
];

const defaultSizes: SizeVariantItem[] = [
  // Rings
  { id: 's-1', name: 'Size 5', category: 'Rings', dimension: '15.7 mm diameter (Petite fit)', stockStatus: 'In Stock', isActive: true },
  { id: 's-2', name: 'Size 6', category: 'Rings', dimension: '16.5 mm diameter (Standard)', stockStatus: 'In Stock', isActive: true },
  { id: 's-3', name: 'Size 7', category: 'Rings', dimension: '17.3 mm diameter (Most Popular)', stockStatus: 'In Stock', isActive: true },
  { id: 's-4', name: 'Size 8', category: 'Rings', dimension: '18.1 mm diameter (Comfort fit)', stockStatus: 'In Stock', isActive: true },
  { id: 's-5', name: 'Size 9', category: 'Rings', dimension: '18.9 mm diameter', stockStatus: 'Low Stock', isActive: true },
  { id: 's-6', name: 'Adjustable', category: 'Rings', dimension: 'Open cuff / fits sizes 5–9', stockStatus: 'In Stock', isActive: true },

  // Necklaces
  { id: 's-7', name: '16" Choker', category: 'Necklaces', dimension: '40 cm collar fit', stockStatus: 'In Stock', isActive: true },
  { id: 's-8', name: '18" Princess', category: 'Necklaces', dimension: '45 cm standard clavicle line', stockStatus: 'In Stock', isActive: true },
  { id: 's-9', name: '20" Matinee', category: 'Necklaces', dimension: '50 cm neckline plunge', stockStatus: 'In Stock', isActive: true },
  { id: 's-10', name: '24" Opera', category: 'Necklaces', dimension: '60 cm layered luxury length', stockStatus: 'Made-to-Order', isActive: true },

  // Bracelets & Bangles
  { id: 's-11', name: '6.0" Small', category: 'Bracelets', dimension: '15.2 cm wrist circumference', stockStatus: 'In Stock', isActive: true },
  { id: 's-12', name: '6.5" Standard', category: 'Bracelets', dimension: '16.5 cm wrist circumference', stockStatus: 'In Stock', isActive: true },
  { id: 's-13', name: '7.0" Large', category: 'Bracelets', dimension: '17.8 cm wrist circumference', stockStatus: 'In Stock', isActive: true },
  { id: 's-14', name: '2.4 Bangle', category: 'Bracelets', dimension: '57.2 mm inner diameter', stockStatus: 'In Stock', isActive: true },
  { id: 's-15', name: '2.6 Bangle', category: 'Bracelets', dimension: '60.3 mm inner diameter', stockStatus: 'In Stock', isActive: true },

  // Candles & Fragrances
  { id: 's-16', name: '100g Votive', category: 'Candles', dimension: '~20 hrs clean burn time', stockStatus: 'In Stock', isActive: true },
  { id: 's-17', name: '250g Artisanal Glass', category: 'Candles', dimension: '~50 hrs clean burn time', stockStatus: 'In Stock', isActive: true },
  { id: 's-18', name: '500g Grande Jar', category: 'Candles', dimension: '~90 hrs triple-wick burn', stockStatus: 'In Stock', isActive: true },
  { id: 's-19', name: '1kg Luxury Refill', category: 'Candles', dimension: 'Sand wax refill pouch', stockStatus: 'In Stock', isActive: true },
];

const defaultSaleTags: LifestyleSaleTagItem[] = [
  { id: 'tag-1', name: 'Trending Lifestyle Pick', isActive: true },
  { id: 'tag-2', name: 'Diwali Festive Edit', isActive: true },
  { id: 'tag-3', name: 'Boutique Exclusive', isActive: true },
  { id: 'tag-4', name: 'Handcrafted Artisanal', isActive: true },
  { id: 'tag-5', name: 'Organic & Pure', isActive: true },
  { id: 'tag-6', name: 'Curated Milestone Gift', isActive: true },
];

export default function AdminAttributesPage() {
  const { showToast } = useStore();

  // State - purely dynamic from database
  const [colors, setColors] = useState<ColorSwatchItem[]>([]);
  const [sizes, setSizes] = useState<SizeVariantItem[]>([]);
  const [saleTags, setSaleTags] = useState<LifestyleSaleTagItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Selected Previews
  const [activeSizeCategory, setActiveSizeCategory] = useState<string>('All');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Live Simulator State (Color & Size only, tags are not visible on card)
  const [simulatorColor, setSimulatorColor] = useState<ColorSwatchItem | null>(null);
  const [simulatorSize, setSimulatorSize] = useState<SizeVariantItem | null>(null);

  // Safe active previews for the live simulator
  const activeSimColor = simulatorColor || colors[0] || {
    id: 'sim-gold',
    name: '24K Yellow Gold',
    hex: '#D4AF37',
    category: 'Jewellery',
    isActive: true,
  };
  const activeSimSize = simulatorSize || sizes[0] || {
    id: 'sim-size',
    name: 'Standard Fit',
    dimension: 'Regular Fit',
    category: 'General' as const,
    stockStatus: 'In Stock' as const,
    isActive: true,
  };

  // Modals / Form Dialogs
  const [isAddColorOpen, setIsAddColorOpen] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#D4AF37');
  const [newColorCategory, setNewColorCategory] = useState('Jewellery');
  const [newColorDesc, setNewColorDesc] = useState('');

  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeCategory, setNewSizeCategory] = useState<SizeVariantItem['category']>('Rings');
  const [newSizeDim, setNewSizeDim] = useState('');
  const [newSizeStock, setNewSizeStock] = useState<SizeVariantItem['stockStatus']>('In Stock');

  // Simplified Tag Modal (Plain Typed Tag, no colors/icons)
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);

  // RLS Notice & SQL Banner State
  const [rlsNoticeVisible, setRlsNoticeVisible] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isVerifyingRls, setIsVerifyingRls] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  const sqlScriptContent = `-- Purnya.in: Fix RLS and remove unnecessary columns on lifestyle_sale_tags
ALTER TABLE public.lifestyle_sale_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.color_palettes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_variants DISABLE ROW LEVEL SECURITY;

-- Drop all unnecessary legacy color/icon/badge columns:
ALTER TABLE public.lifestyle_sale_tags DROP COLUMN IF EXISTS bg_color;
ALTER TABLE public.lifestyle_sale_tags DROP COLUMN IF EXISTS text_color;
ALTER TABLE public.lifestyle_sale_tags DROP COLUMN IF EXISTS border_color;
ALTER TABLE public.lifestyle_sale_tags DROP COLUMN IF EXISTS icon_name;
ALTER TABLE public.lifestyle_sale_tags DROP COLUMN IF EXISTS badge_type;
ALTER TABLE public.lifestyle_sale_tags DROP COLUMN IF EXISTS subtext;
ALTER TABLE public.lifestyle_sale_tags DROP COLUMN IF EXISTS discount_text;
ALTER TABLE public.lifestyle_sale_tags DROP COLUMN IF EXISTS title;
DELETE FROM public.lifestyle_sale_tags WHERE id LIKE '%probe%' OR name ILIKE '%probe%';

-- Permissive policies for anon and authenticated users
ALTER TABLE public.lifestyle_sale_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on lifestyle_sale_tags" ON public.lifestyle_sale_tags;
CREATE POLICY "Allow all on lifestyle_sale_tags" ON public.lifestyle_sale_tags FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.color_palettes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on color_palettes" ON public.color_palettes;
CREATE POLICY "Allow all on color_palettes" ON public.color_palettes FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.size_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on size_variants" ON public.size_variants;
CREATE POLICY "Allow all on size_variants" ON public.size_variants FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScriptContent);
    setCopiedSql(true);
    showToast('SQL Copied to Clipboard', 'Paste this into Supabase SQL Editor and click RUN.', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleVerifyRls = async () => {
    setIsVerifyingRls(true);
    showToast('Checking Supabase...', 'Testing write access to lifestyle tags table.', 'info');
    const res = await checkLifestyleTagsRLS();
    if (res.writable) {
      setRlsNoticeVisible(false);
      showToast('RLS Check Passed! 🎉', 'Write permissions confirmed. Syncing all attributes to Supabase...', 'success');
      const syncRes = await syncAttributesToSupabase(colors, sizes, saleTags);
      if (syncRes.success) {
        showToast('Cloud Sync Complete', syncRes.message, 'success');
      }
    } else {
      setRlsNoticeVisible(true);
      showToast('RLS Policy Blocking Writes', 'Run the SQL script in Supabase SQL Editor to allow anon updates.', 'error');
    }
    setIsVerifyingRls(false);
  };

  // Helpers to persist
  const saveColors = useCallback((newItems: ColorSwatchItem[]) => {
    setColors(newItems);
    localStorage.setItem('purnya_color_palette', JSON.stringify(newItems));
  }, []);

  const saveSizes = useCallback((newItems: SizeVariantItem[]) => {
    setSizes(newItems);
    localStorage.setItem('purnya_sizes', JSON.stringify(newItems));
  }, []);

  const saveTags = useCallback((newItems: LifestyleSaleTagItem[]) => {
    setSaleTags(newItems);
    localStorage.setItem('purnya_lifestyle_sale_tags', JSON.stringify(newItems));
  }, []);

  // Load from localStorage & Supabase on mount (guarded against empty-array wipeout)
  useEffect(() => {
    let isMounted = true;
    if (isSupabaseConfigured) {
      Promise.all([
        getColorPalettesFromSupabase(),
        getSizeVariantsFromSupabase(),
        getLifestyleSaleTagsFromSupabase(),
      ])
        .then(([colorData, sizeData, tagData]) => {
          if (!isMounted) return;

          // Colors
          if (colorData !== null && colorData.length > 0) {
            saveColors(colorData);
            setSimulatorColor(colorData[0]);
          } else {
            const savedColors = localStorage.getItem('purnya_color_palette');
            if (savedColors) {
              try { setColors(JSON.parse(savedColors)); } catch { saveColors(defaultColors); }
            } else {
              saveColors(defaultColors);
            }
          }

          // Sizes
          if (sizeData !== null && sizeData.length > 0) {
            saveSizes(sizeData);
            setSimulatorSize(sizeData[0]);
          } else {
            const savedSizes = localStorage.getItem('purnya_sizes');
            if (savedSizes) {
              try { setSizes(JSON.parse(savedSizes)); } catch { saveSizes(defaultSizes); }
            } else {
              saveSizes(defaultSizes);
            }
          }

          // Lifestyle Tags (plain typed tags, sanitizing any legacy probe items)
          const cleanSupabaseTags = (tagData || [])
            .filter((t: any) => t && !t.id?.includes('probe') && !t.name?.toLowerCase().includes('probe'))
            .map((t: any) => ({
              id: t.id,
              name: t.name || t.title || 'Untitled Tag',
              isActive: Boolean(t.isActive ?? t.is_active ?? true),
            }));

          if (cleanSupabaseTags.length > 0) {
            saveTags(cleanSupabaseTags);
          } else {
            const savedTags = localStorage.getItem('purnya_lifestyle_sale_tags');
            let restored = false;
            if (savedTags) {
              try {
                const parsed = JSON.parse(savedTags);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const cleanLocal = parsed
                    .filter((t: any) => t && !t.id?.includes('probe') && !t.name?.toLowerCase().includes('probe'))
                    .map((t: any) => ({
                      id: t.id,
                      name: t.name || t.title || 'Untitled Tag',
                      isActive: Boolean(t.isActive ?? t.is_active ?? true),
                    }));
                  if (cleanLocal.length > 0) {
                    saveTags(cleanLocal);
                    restored = true;
                  }
                }
              } catch {}
            }
            if (!restored) {
              saveTags(defaultSaleTags);
            }
          }
        })
        .catch((err) => {
          console.warn('Failed to load attributes from Supabase', err);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      queueMicrotask(() => {
        if (!isMounted) return;
        try {
          const savedColors = localStorage.getItem('purnya_color_palette');
          if (savedColors) setColors(JSON.parse(savedColors));

          const savedSizes = localStorage.getItem('purnya_sizes');
          if (savedSizes) setSizes(JSON.parse(savedSizes));

          const savedTags = localStorage.getItem('purnya_lifestyle_sale_tags');
          if (savedTags) {
            const parsed = JSON.parse(savedTags);
            if (Array.isArray(parsed)) {
              const cleanLocal = parsed
                .filter((t: any) => t && !t.id?.includes('probe') && !t.name?.toLowerCase().includes('probe'))
                .map((t: any) => ({
                  id: t.id,
                  name: t.name || t.title || 'Untitled Tag',
                  isActive: Boolean(t.isActive ?? t.is_active ?? true),
                }));
              setSaleTags(cleanLocal.length > 0 ? cleanLocal : defaultSaleTags);
            }
          } else {
            setSaleTags(defaultSaleTags);
          }
        } catch (e) {
          console.warn('Failed to load attributes from local storage', e);
        }
        setIsLoading(false);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [saveColors, saveSizes, saveTags]);

  const handleSyncToCloud = async () => {
    if (!isSupabaseConfigured) {
      showToast(
        'Supabase Not Configured',
        'Configure NEXT_PUBLIC_SUPABASE_URL and ANON_KEY in .env.local first.',
        'info'
      );
      return;
    }
    setIsSyncing(true);
    const res = await syncAttributesToSupabase(colors, sizes, saleTags);
    setIsSyncing(false);
    if (res.success) {
      showToast('Cloud Sync Success', res.message, 'success');
      setRlsNoticeVisible(false);
    } else {
      const isRLS = res.message.toLowerCase().includes('violates row-level security');
      if (isRLS) {
        setRlsNoticeVisible(true);
      }
      showToast(
        isRLS ? 'RLS Policy Restricted' : 'Cloud Sync Failed',
        isRLS
          ? 'Supabase Row Level Security policy blocked write. Use the SQL button below to copy the fix script.'
          : res.message,
        'error'
      );
    }
  };

  // Clipboard copy
  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    showToast('HEX Copied', `${hex} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Add Color Handler
  const handleCreateColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorName.trim()) return;

    const newEntry: ColorSwatchItem = {
      id: `c-${Date.now()}`,
      name: newColorName.trim(),
      hex: newColorHex.trim().toUpperCase(),
      category: newColorCategory,
      description: newColorDesc.trim() || 'Custom color swatch',
      isActive: true,
    };

    const updated = [newEntry, ...colors];
    saveColors(updated);
    setSimulatorColor(newEntry);
    setIsAddColorOpen(false);
    setNewColorName('');
    setNewColorDesc('');

    if (isSupabaseConfigured) {
      const res = await upsertColorToSupabase(newEntry);
      if (!res.success) {
        const isRLS = res.error?.includes('row-level security');
        if (isRLS) setRlsNoticeVisible(true);
        showToast(
          isRLS ? 'Saved Locally (RLS Restricted)' : 'Sync Notice',
          isRLS
            ? 'Saved to browser. Supabase rejected cloud insert (RLS policy). Run SQL to disable RLS.'
            : (res.error || 'Saved locally.'),
          'info'
        );
      } else {
        showToast('Color Added & Synced', `${newEntry.name} (${newEntry.hex}) saved to Supabase.`, 'success');
      }
    } else {
      showToast('Color Added', `${newEntry.name} (${newEntry.hex}) is now in your palette.`, 'success');
    }
  };

  const handleDeleteColor = async (id: string, name: string) => {
    if (confirm(`Remove "${name}" from color palette?`)) {
      const updated = colors.filter((c) => c.id !== id);
      saveColors(updated);
      if (isSupabaseConfigured) {
        await deleteColorFromSupabase(id);
      }
      showToast('Color Removed', `${name} deleted.`, 'info');
    }
  };

  const handleToggleColorActive = async (id: string) => {
    const target = colors.find((c) => c.id === id);
    if (!target) return;
    const toggled = { ...target, isActive: !target.isActive };
    const updated = colors.map((c) => (c.id === id ? toggled : c));
    saveColors(updated);
    if (isSupabaseConfigured) {
      await upsertColorToSupabase(toggled);
    }
  };

  // Add Size Handler
  const handleCreateSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSizeName.trim()) return;

    const newEntry: SizeVariantItem = {
      id: `s-${Date.now()}`,
      name: newSizeName.trim(),
      category: newSizeCategory,
      dimension: newSizeDim.trim() || 'Custom sizing dimension',
      stockStatus: newSizeStock,
      isActive: true,
    };

    const updated = [newEntry, ...sizes];
    saveSizes(updated);
    setSimulatorSize(newEntry);
    setIsAddSizeOpen(false);
    setNewSizeName('');
    setNewSizeDim('');

    if (isSupabaseConfigured) {
      const res = await upsertSizeToSupabase(newEntry);
      if (!res.success) {
        const isRLS = res.error?.includes('row-level security');
        if (isRLS) setRlsNoticeVisible(true);
        showToast(
          isRLS ? 'Saved Locally (RLS Restricted)' : 'Sync Notice',
          isRLS
            ? 'Saved to browser. Supabase rejected cloud insert (RLS policy). Run SQL to disable RLS.'
            : (res.error || 'Saved locally.'),
          'info'
        );
      } else {
        showToast('Size Added & Synced', `${newEntry.name} (${newEntry.category}) saved to Supabase.`, 'success');
      }
    } else {
      showToast('Size Added', `${newEntry.name} variant added successfully.`, 'success');
    }
  };

  const handleDeleteSize = async (id: string, name: string) => {
    if (confirm(`Delete size "${name}"?`)) {
      const updated = sizes.filter((s) => s.id !== id);
      saveSizes(updated);
      if (isSupabaseConfigured) {
        await deleteSizeFromSupabase(id);
      }
      showToast('Size Deleted', `${name} removed.`, 'info');
    }
  };

  const handleToggleSizeActive = async (id: string) => {
    const target = sizes.find((s) => s.id === id);
    if (!target) return;
    const toggled = { ...target, isActive: !target.isActive };
    const updated = sizes.map((s) => (s.id === id ? toggled : s));
    saveSizes(updated);
    if (isSupabaseConfigured) {
      await upsertSizeToSupabase(toggled);
    }
  };

  // Add Tag Handler (Plain typed tag, no colors/icons)
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    const newEntry: LifestyleSaleTagItem = {
      id: `tag-${Date.now()}`,
      name: newTagName.trim(),
      isActive: true,
    };

    const updated = [newEntry, ...saleTags];
    saveTags(updated);
    setIsAddTagOpen(false);
    setNewTagName('');

    if (isSupabaseConfigured) {
      const res = await upsertLifestyleSaleTagToSupabase(newEntry);
      if (!res.success) {
        const isRLS = res.error?.toLowerCase().includes('row-level security') || res.error?.includes('42501');
        if (isRLS) {
          setRlsNoticeVisible(true);
        }
        showToast(
          isRLS ? 'Saved Locally (RLS Active)' : 'Sync Notice',
          isRLS
            ? `Tag "${newEntry.name}" saved in browser. Run SQL script to sync with Supabase cloud.`
            : (res.error || 'Saved locally.'),
          'info'
        );
      } else {
        showToast('Lifestyle Tag Saved', `"${newEntry.name}" synced to Supabase.`, 'success');
      }
    } else {
      showToast('Lifestyle Tag Created', `"${newEntry.name}" is now active.`, 'success');
    }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (confirm(`Delete lifestyle tag "${name}"?`)) {
      const updated = saleTags.filter((t) => t.id !== id);
      saveTags(updated);
      if (isSupabaseConfigured) {
        deleteLifestyleSaleTagFromSupabase(id).catch((err) =>
          console.warn('Supabase delete tag error:', err)
        );
      }
      showToast('Tag Deleted', `"${name}" removed.`, 'info');
    }
  };

  const handleToggleTagActive = async (id: string) => {
    const target = saleTags.find((t) => t.id === id);
    if (!target) return;
    const toggled = { ...target, isActive: !target.isActive };
    const updated = saleTags.map((t) => (t.id === id ? toggled : t));
    saveTags(updated);
    if (isSupabaseConfigured) {
      const res = await upsertLifestyleSaleTagToSupabase(toggled);
      if (!res.success && res.error?.toLowerCase().includes('row-level security')) {
        setRlsNoticeVisible(true);
      }
    }
  };

  // Filter sizes
  const filteredSizes = activeSizeCategory === 'All'
    ? sizes
    : sizes.filter((s) => s.category === activeSizeCategory);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#C5A059]/20 text-[#8A6614] border border-[#C5A059]/40">
              Product Attribute Engine
            </span>
            <span className="text-[11px] text-[#5A7469] font-medium">Boutique Specification Manager</span>
          </div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Color Palettes, Sizes & Lifestyle Tags
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E] max-w-3xl">
            Centrally manage fine jewellery color swatches, multi-category size charts, and custom product lifestyle tags that merchants can assign to products.
          </p>
        </div>

        {/* Quick Simulator & Cloud Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncToCloud}
            disabled={isSyncing}
            className="px-3 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            title="Upload current attributes to Supabase cloud"
          >
            <CloudUpload className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{isSyncing ? 'Syncing...' : 'Sync to Cloud'}</span>
          </button>

          <button
            onClick={async () => {
              if (isSupabaseConfigured) {
                setIsLoading(true);
                try {
                  const [c, s, t] = await Promise.all([
                    getColorPalettesFromSupabase(),
                    getSizeVariantsFromSupabase(),
                    getLifestyleSaleTagsFromSupabase(),
                  ]);
                  if (c !== null && c.length > 0) saveColors(c);
                  if (s !== null && s.length > 0) saveSizes(s);
                  if (t !== null && t.length > 0) {
                    saveTags(t.map((item: any) => ({
                      id: item.id,
                      name: item.name || item.title || 'Untitled Tag',
                      isActive: Boolean(item.isActive ?? item.is_active ?? true),
                    })));
                  }
                  showToast('Cloud Data Refreshed', `Retrieved ${c?.length || 0} colors, ${s?.length || 0} sizes, ${t?.length || 0} tags.`, 'info');
                } finally {
                  setIsLoading(false);
                }
              } else {
                showToast('Supabase Not Configured', 'Check .env.local for database keys.', 'info');
              }
            }}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#0B241C] border border-[#E2DBD0] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Fetch fresh data directly from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C5A059] ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'Fetching...' : 'Re-fetch Cloud'}</span>
          </button>

          <button
            onClick={async () => {
              if (confirm('Restore default boutique attributes? This will load preset colors, sizes, and lifestyle tags.')) {
                saveColors(defaultColors);
                saveSizes(defaultSizes);
                saveTags(defaultSaleTags);
                if (isSupabaseConfigured) {
                  showToast('Syncing Presets...', 'Uploading default boutique presets to Supabase Cloud...', 'info');
                  const res = await syncAttributesToSupabase(defaultColors, defaultSizes, defaultSaleTags);
                  if (res.success) {
                    showToast('Presets Synced', res.message, 'success');
                    setRlsNoticeVisible(false);
                  } else {
                    const isRLS = res.message.toLowerCase().includes('violates row-level security');
                    if (isRLS) setRlsNoticeVisible(true);
                    showToast(
                      isRLS ? 'Presets Restored Locally (RLS Restricted)' : 'Presets Restored Locally',
                      isRLS ? 'Restored in browser. Cloud insert blocked by Supabase RLS policy. Use the SQL fix button.' : res.message,
                      'info'
                    );
                  }
                } else {
                  showToast('Reset Complete', 'Default boutique attributes restored locally.', 'info');
                }
              }
            }}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#5A7469] border border-[#E2DBD0] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Restore official Purnya presets"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Presets</span>
          </button>
        </div>
      </div>

      {/* Supabase RLS Quick-Resolution Alert */}
      {rlsNoticeVisible && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-[#0B241C] space-y-3 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>Supabase Row-Level Security (RLS) Configuration Required</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-mono">
                    PostgreSQL RLS Active
                  </span>
                </h4>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  Supabase has Row-Level Security enabled on <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[11px] text-amber-950 font-semibold">lifestyle_sale_tags</code>, blocking direct browser inserts from the public key. Your tags and attribute changes are <strong>safely saved in local storage</strong>. Run the quick SQL script below in your Supabase SQL Editor to enable 2-way cloud synchronization.
                </p>
              </div>
            </div>
            <button
              onClick={() => setRlsNoticeVisible(false)}
              className="text-amber-600 hover:text-amber-800 p-1 rounded-lg hover:bg-amber-100"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
            <button
              onClick={handleCopySql}
              className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'SQL Script Copied!' : 'Copy 1-Click SQL Fix'}</span>
            </button>

            <a
              href="https://supabase.com/dashboard/project/bhzjtyyxgtoasvpbvfsn/sql"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
              <span>Open Supabase SQL Editor</span>
            </a>

            <button
              onClick={handleVerifyRls}
              disabled={isVerifyingRls}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isVerifyingRls ? 'animate-spin' : ''}`} />
              <span>{isVerifyingRls ? 'Testing Write...' : 'Test & Sync Cloud'}</span>
            </button>

            <button
              onClick={() => setShowSqlModal(!showSqlModal)}
              className="px-3 py-1.5 text-xs text-amber-900 font-semibold hover:underline ml-auto"
            >
              {showSqlModal ? 'Hide SQL Preview ▲' : 'View SQL Code ▼'}
            </button>
          </div>

          {showSqlModal && (
            <div className="mt-2 p-3.5 bg-slate-900 text-emerald-300 rounded-xl border border-amber-300 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed shadow-inner">
              <pre>{sqlScriptContent}</pre>
            </div>
          )}
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E2DBD0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FAF0D7] text-[#C5A059] flex items-center justify-center shrink-0 border border-[#E2DBD0]">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#5A7469] uppercase tracking-wider">Color Palette Swatches</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0B241C]">{colors.length}</span>
              <span className="text-xs text-emerald-700 font-semibold">
                ({colors.filter((c) => c.isActive).length} active)
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2DBD0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EBF3EF] text-[#0B241C] flex items-center justify-center shrink-0 border border-[#CCD8D2]">
            <Ruler className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#5A7469] uppercase tracking-wider">Sizes & Dimensions</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0B241C]">{sizes.length}</span>
              <span className="text-xs text-emerald-700 font-semibold">Across 5 Categories</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2DBD0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#5A7469] uppercase tracking-wider">Lifestyle Product Tags</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0B241C]">{saleTags.length}</span>
              <span className="text-xs text-emerald-700 font-semibold">
                ({saleTags.filter((t) => t.isActive).length} active for products)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. COLOR PALETTE CARD */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl border border-[#E2DBD0] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFEBE3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B241C] text-[#C5A059] flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-xl font-bold text-[#0B241C]">
                Color Palette Card
              </h2>
              <p className="text-xs text-[#5A7469]">
                Define fine jewellery plating colors, gemstone hues, candle tones, and brand accents.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddColorOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Swatch</span>
          </button>
        </div>

        {/* Color Swatch Grid */}
        {isLoading ? (
          <div className="py-12 text-center border-2 border-dashed border-[#E2DBD0] rounded-2xl bg-[#FAF8F5]">
            <RefreshCw className="w-7 h-7 text-[#C5A059] mx-auto mb-2 animate-spin" />
            <p className="text-xs font-bold text-[#0B241C]">Loading color swatches from Supabase...</p>
            <p className="text-[11px] text-[#5A7469] mt-1">Connecting to cloud database</p>
          </div>
        ) : colors.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-[#E2DBD0] rounded-2xl bg-[#FAF8F5]">
            <Palette className="w-8 h-8 text-[#C5A059] mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold text-[#0B241C]">No color swatches in database</p>
            <p className="text-[11px] text-[#5A7469] mt-1 mb-3">All rows were deleted or not yet created in Supabase.</p>
            <button
              onClick={() => setIsAddColorOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#0B241C] text-white text-xs font-semibold hover:bg-[#C5A059] transition-colors shadow-sm"
            >
              + Add First Swatch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {colors.map((color) => {
              const isSelected = simulatorColor?.id === color.id;
              return (
                <div
                  key={color.id}
                  className={`p-4 rounded-2xl border transition-all relative group flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#C5A059] ring-2 ring-[#C5A059]/20 bg-[#FAF8F5]'
                      : 'border-[#E2DBD0] hover:border-[#C5A059]/60 bg-white'
                  } ${!color.isActive ? 'opacity-50' : ''}`}
                >
                  {/* Top Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A7469] bg-[#EFEBE3] px-2 py-0.5 rounded-full">
                      {color.category}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggleColorActive(color.id)}
                        title={color.isActive ? 'Deactivate Swatch' : 'Activate Swatch'}
                        className={`w-2.5 h-2.5 rounded-full ${
                          color.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                      />
                      <button
                        onClick={() => handleDeleteColor(color.id, color.name)}
                        className="text-gray-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete swatch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Swatch Pill & Preview */}
                  <div className="flex items-center gap-3 my-2">
                    <div
                      className="w-10 h-10 rounded-full border-2 border-white shadow-md shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-[#0B241C] truncate">{color.name}</h3>
                      <p className="text-[11px] text-[#5A7469] truncate font-mono">{color.hex}</p>
                    </div>
                  </div>

                  {color.description && (
                    <p className="text-[10px] text-[#5A7469] line-clamp-2 my-2">{color.description}</p>
                  )}

                  {/* Bottom interactive buttons */}
                  <div className="pt-2 border-t border-[#EFEBE3] flex items-center justify-between gap-2 mt-auto">
                    <button
                      onClick={() => handleCopyHex(color.hex)}
                      className="text-[10px] font-semibold text-[#5A7469] hover:text-[#0B241C] flex items-center gap-1 transition-colors"
                    >
                      {copiedHex === color.hex ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy HEX</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setSimulatorColor(color);
                        showToast('Simulating Color', `Viewing ${color.name} on the live product card.`, 'info');
                      }}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-[#C5A059] text-white'
                          : 'bg-[#FAF8F5] text-[#0B241C] hover:bg-[#EFEBE3]'
                      }`}
                    >
                      {isSelected ? 'Simulating' : 'Simulate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 2. SIZES CARD */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl border border-[#E2DBD0] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFEBE3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B241C] text-[#C5A059] flex items-center justify-center">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-xl font-bold text-[#0B241C]">
                Sizes & Dimensions Card
              </h2>
              <p className="text-xs text-[#5A7469]">
                Configure standard sizing parameters for finger rings, necklace chain lengths, bangles, and candle volume.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddSizeOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Size Dimension</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 pb-2">
          {['All', 'Rings', 'Necklaces', 'Bracelets', 'Candles', 'Decor & Gifts'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveSizeCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeSizeCategory === cat
                  ? 'bg-[#0B241C] text-white shadow-sm'
                  : 'bg-[#FAF8F5] text-[#2C4A3E] hover:bg-[#EFEBE3] border border-[#E2DBD0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sizes Grid */}
        {isLoading ? (
          <div className="py-12 text-center border-2 border-dashed border-[#E2DBD0] rounded-2xl bg-[#FAF8F5]">
            <RefreshCw className="w-7 h-7 text-[#0B241C] mx-auto mb-2 animate-spin" />
            <p className="text-xs font-bold text-[#0B241C]">Loading size variants from Supabase...</p>
            <p className="text-[11px] text-[#5A7469] mt-1">Connecting to cloud database</p>
          </div>
        ) : filteredSizes.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-[#E2DBD0] rounded-2xl bg-[#FAF8F5]">
            <Ruler className="w-8 h-8 text-[#0B241C] mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold text-[#0B241C]">No sizes found</p>
            <p className="text-[11px] text-[#5A7469] mt-1 mb-3">
              {activeSizeCategory !== 'All'
                ? `No sizes configured in "${activeSizeCategory}".`
                : 'All rows were deleted or not yet created in Supabase.'}
            </p>
            <button
              onClick={() => setIsAddSizeOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#0B241C] text-white text-xs font-semibold hover:bg-[#C5A059] transition-colors shadow-sm"
            >
              + Add Size Dimension
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSizes.map((size) => {
              const isSelected = simulatorSize?.id === size.id;
              return (
                <div
                  key={size.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#C5A059] ring-2 ring-[#C5A059]/20 bg-[#FAF8F5]'
                      : 'border-[#E2DBD0] hover:border-[#C5A059]/50 bg-white'
                  } ${!size.isActive ? 'opacity-50' : ''}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] bg-[#FAF0D7] px-2 py-0.5 rounded-md border border-[#E2DBD0]">
                        {size.category}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          size.stockStatus === 'In Stock'
                            ? 'bg-emerald-100 text-emerald-800'
                            : size.stockStatus === 'Low Stock'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {size.stockStatus}
                      </span>
                    </div>

                    <h3 className="font-serif-title text-base font-bold text-[#0B241C]">{size.name}</h3>
                    <p className="text-xs text-[#5A7469] mt-0.5">{size.dimension}</p>
                  </div>

                  <div className="pt-3 border-t border-[#EFEBE3] mt-4 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleSizeActive(size.id)}
                      className="text-[10px] font-semibold text-[#5A7469] hover:underline"
                    >
                      {size.isActive ? 'Active' : 'Disabled'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSimulatorSize(size);
                          showToast('Simulating Size', `Selected ${size.name} (${size.category}).`, 'info');
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-[#0B241C] text-[#FAF8F5]'
                            : 'bg-[#FAF8F5] text-[#0B241C] hover:bg-[#EFEBE3]'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                      <button
                        onClick={() => handleDeleteSize(size.id, size.name)}
                        className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                        title="Delete size"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. LIFESTYLE TAGS CARD */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl border border-[#E2DBD0] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFEBE3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B241C] text-[#C5A059] flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-xl font-bold text-[#0B241C]">
                Lifestyle Tags
              </h2>
              <p className="text-xs text-[#5A7469]">
                Create and manage custom lifestyle tags. Merchants can assign these tags when creating or editing products in the Catalog.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddTagOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lifestyle Tag</span>
          </button>
        </div>

        {/* Lifestyle Tags Grid */}
        {isLoading ? (
          <div className="py-12 text-center border-2 border-dashed border-[#E2DBD0] rounded-2xl bg-[#FAF8F5]">
            <RefreshCw className="w-7 h-7 text-rose-600 mx-auto mb-2 animate-spin" />
            <p className="text-xs font-bold text-[#0B241C]">Loading tags from Supabase...</p>
            <p className="text-[11px] text-[#5A7469] mt-1">Connecting to cloud database</p>
          </div>
        ) : saleTags.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-[#E2DBD0] rounded-2xl bg-[#FAF8F5]">
            <Tag className="w-8 h-8 text-rose-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold text-[#0B241C]">No lifestyle tags configured</p>
            <p className="text-[11px] text-[#5A7469] mt-1 mb-3">Add custom tags to categorize products across your lifestyle collections.</p>
            <button
              onClick={() => setIsAddTagOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#0B241C] text-white text-xs font-semibold hover:bg-[#C5A059] transition-colors shadow-sm"
            >
              + Add Lifestyle Tag
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {saleTags.map((tag) => (
              <div
                key={tag.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between bg-white border-[#E2DBD0] hover:border-[#C5A059]/50 shadow-xs ${
                  !tag.isActive ? 'opacity-60 bg-gray-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-center text-[#C5A059] font-bold text-xs">
                    #
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B241C]">{tag.name}</h3>
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        tag.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {tag.isActive ? 'Active for Products' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleTagActive(tag.id)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#E2DBD0] hover:bg-[#FAF8F5] text-[#0B241C] transition-colors"
                  >
                    {tag.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag.id, tag.name)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete tag"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. LIVE INTERACTIVE STOREFRONT CARD SIMULATOR */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-br from-[#08281F] to-[#0B241C] text-[#FAF8F5] rounded-3xl p-6 sm:p-10 shadow-xl border border-[#144234] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#144234] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#C5A059]/20 text-[#D4AF37] border border-[#C5A059]/40 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Customer Preview</span>
            </div>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-white">
              Boutique Card Simulator
            </h2>
            <p className="text-xs sm:text-sm text-[#A3B8B0] max-w-2xl">
              See how your Color Palette Swatch and Size Variant render together on a customer-facing product card in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#D4AF37] bg-black/30 px-3 py-2 rounded-xl border border-white/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Auto-synced with localStorage</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls column */}
          <div className="lg:col-span-6 space-y-5">
            {/* 1. Pick Color */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] block">
                1. Select Palette Swatch
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {colors.filter((c) => c.isActive).slice(0, 7).map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setSimulatorColor(col)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      activeSimColor.id === col.id
                        ? 'bg-[#C5A059] text-[#08281F] font-bold border-white'
                        : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/30"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Pick Size */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] block">
                2. Select Size Variant
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {sizes.filter((s) => s.isActive).slice(0, 6).map((sz) => (
                  <button
                    key={sz.id}
                    onClick={() => setSimulatorSize(sz)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                      activeSimSize.id === sz.id
                        ? 'bg-white text-[#08281F] border-white font-bold'
                        : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                    }`}
                  >
                    {sz.name}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#A3B8B0]">
                Current dimension: <strong className="text-white">{activeSimSize.dimension}</strong> ({activeSimSize.stockStatus})
              </p>
            </div>
          </div>

          {/* Interactive Mock Product Card Preview */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#E2DBD0] text-[#0B241C] transition-all hover:shadow-3xl">
              {/* Product Image Area */}
              <div className="relative h-64 bg-[#FAF8F5] overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&fit=crop&auto=format"
                  alt="Product Preview"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Color Swatch Badge (Card 1) */}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-semibold flex items-center gap-1.5 border border-white/20">
                  <span
                    className="w-3 h-3 rounded-full border border-white"
                    style={{ backgroundColor: activeSimColor.hex }}
                  />
                  <span>{activeSimColor.name}</span>
                </div>
              </div>

              {/* Product Info Area */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[#5A7469]">
                  <span>Purnya Signature Edit</span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>4.9 (128 reviews)</span>
                  </div>
                </div>

                <h3 className="font-serif-title text-lg font-bold text-[#0B241C] leading-snug">
                  Baroque Pearl & Handcrafted {activeSimColor.name} Statement Choker
                </h3>

                {/* Pricing with tag discount effect */}
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xl font-serif-title font-bold text-[#0B241C]">
                    ₹3,499
                  </span>
                  <span className="text-xs text-gray-400 line-through">₹4,499</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Save ₹1,000
                  </span>
                </div>

                {/* Size Selection Pill (Card 2) */}
                <div className="pt-2 border-t border-[#EFEBE3] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0B241C]">Selected Size:</span>
                    <span className="text-xs font-semibold text-[#C5A059] bg-[#FAF0D7] px-2 py-0.5 rounded">
                      {activeSimSize.name} · {activeSimSize.dimension}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {sizes
                      .filter((s) => s.category === activeSimSize.category)
                      .slice(0, 4)
                      .map((sz) => (
                        <button
                          key={sz.id}
                          onClick={() => setSimulatorSize(sz)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
                            activeSimSize.id === sz.id
                              ? 'bg-[#0B241C] text-white border-[#0B241C]'
                              : 'bg-[#FAF8F5] text-[#2C4A3E] border-[#E2DBD0] hover:border-[#C5A059]'
                          }`}
                        >
                          {sz.name}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Interactive Simulated CTA */}
                <button
                  type="button"
                  className="w-full mt-3 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add To Bag · {activeSimSize.name} ({activeSimColor.name})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW COLOR */}
      {/* ========================================================================= */}
      {isAddColorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-[#E2DBD0] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3]">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-serif-title text-xl font-bold text-[#0B241C]">Add Color Swatch</h3>
              </div>
              <button
                onClick={() => setIsAddColorOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateColor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B241C] mb-1">Color Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 18K Champagne Gold"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DBD0] text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0B241C] mb-1">HEX Code *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border border-[#E2DBD0] p-0.5"
                    />
                    <input
                      type="text"
                      required
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-[#E2DBD0] text-xs font-mono focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B241C] mb-1">Category</label>
                  <select
                    value={newColorCategory}
                    onChange={(e) => setNewColorCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DBD0] text-xs focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="Jewellery">Jewellery</option>
                    <option value="Candles">Candles</option>
                    <option value="Decor & Gifts">Decor & Gifts</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B241C] mb-1">Description / Finish</label>
                <input
                  type="text"
                  placeholder="e.g. Polished mirror gold with anti-tarnish coat"
                  value={newColorDesc}
                  onChange={(e) => setNewColorDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DBD0] text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* Preview chip */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E2DBD0] flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border border-black/20 shadow-sm"
                  style={{ backgroundColor: newColorHex }}
                />
                <div>
                  <p className="text-xs font-bold text-[#0B241C]">{newColorName || 'Color Preview'}</p>
                  <p className="text-[11px] text-[#5A7469] font-mono">{newColorHex}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddColorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A7469] hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Save Swatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD NEW SIZE */}
      {/* ========================================================================= */}
      {isAddSizeOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-[#E2DBD0] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3]">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-serif-title text-xl font-bold text-[#0B241C]">Add Size Dimension</h3>
              </div>
              <button
                onClick={() => setIsAddSizeOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSize} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B241C] mb-1">Size Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Size 10 or 22 Inch Chain"
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DBD0] text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0B241C] mb-1">Category *</label>
                  <select
                    value={newSizeCategory}
                    onChange={(e) => setNewSizeCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DBD0] text-xs focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="Rings">Rings</option>
                    <option value="Necklaces">Necklaces</option>
                    <option value="Bracelets">Bracelets</option>
                    <option value="Candles">Candles</option>
                    <option value="Decor & Gifts">Decor & Gifts</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B241C] mb-1">Stock Status</label>
                  <select
                    value={newSizeStock}
                    onChange={(e) => setNewSizeStock(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DBD0] text-xs focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Made-to-Order">Made-to-Order</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B241C] mb-1">
                  Dimension / Measurements *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 19.8 mm inner diameter or 55 cm length"
                  value={newSizeDim}
                  onChange={(e) => setNewSizeDim(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DBD0] text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddSizeOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A7469] hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Save Size
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD NEW LIFESTYLE TAG */}
      {/* ========================================================================= */}
      {isAddTagOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-[#E2DBD0] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3]">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-serif-title text-xl font-bold text-[#0B241C]">Add Lifestyle Tag</h3>
              </div>
              <button
                onClick={() => setIsAddTagOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B241C] mb-1">Tag Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Diwali Festive Edit, Handcrafted, Trending, Eco-Friendly"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DBD0] text-sm focus:outline-none focus:border-[#C5A059] bg-[#FAF8F5] font-medium"
                />
                <p className="text-[11px] text-[#5A7469] mt-1.5 leading-relaxed">
                  This tag will appear in the dropdown menu when merchants add or edit products in the catalog.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFEBE3]">
                <button
                  type="button"
                  onClick={() => setIsAddTagOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A7469] hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Save Lifestyle Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
