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
  CheckCircle2,
  X,
  RefreshCw,
  ShoppingBag,
  Star,
  ShieldAlert,
  ExternalLink,
  CloudUpload,
  Pipette,
  Pencil,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import {
  isSupabaseConfigured,
  getColorPalettesFromSupabase,
  getSizeVariantsFromSupabase,
  getLifestyleSaleTagsFromSupabase,
  getCategoriesFromSupabase,
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
  isActive: boolean;
}

export interface SizeVariantItem {
  id: string;
  name: string;
  // Was a hardcoded union of category names. Categories now come from
  // the public.categories table, so this just stores whatever title
  // that table returns (plain text, same as color_palettes.category).
  category: string;
  dimension: string;
  isActive: boolean;
}

export interface LifestyleSaleTagItem {
  id: string;
  name: string;
  isActive: boolean;
}

// A category row as fetched from public.categories, trimmed to what
// the dropdowns/filters actually need.
export interface CategoryOption {
  id: string;
  slug: string;
  title: string;
}

// Initial Preset Data
const defaultColors: ColorSwatchItem[] = [
  { id: 'c-1', name: '24K Yellow Gold', hex: '#D4AF37', category: 'Jewellery', isActive: true },
  { id: 'c-2', name: 'Rose Gold', hex: '#B76E79', category: 'Jewellery', isActive: true },
  { id: 'c-3', name: 'Sterling Silver 925', hex: '#C0C0C0', category: 'Jewellery', isActive: true },
  { id: 'c-4', name: 'Royal Emerald', hex: '#0B241C', category: 'General', isActive: true },
  { id: 'c-5', name: 'Artisan Pearl Ivory', hex: '#FDFBF7', category: 'Candles', isActive: true },
  { id: 'c-6', name: 'Sand Wax Caramel', hex: '#C5A059', category: 'Candles', isActive: true },
  { id: 'c-7', name: 'Midnight Onyx Noir', hex: '#1A1A1A', category: 'Jewellery', isActive: true },
  { id: 'c-8', name: 'Ruby Crimson', hex: '#8B1E2F', category: 'Decor & Gifts', isActive: true },
  { id: 'c-9', name: 'Terracotta Earth', hex: '#D27D2D', category: 'Decor & Gifts', isActive: true },
  { id: 'c-10', name: 'Antique Temple Brass', hex: '#B5A642', category: 'Decor & Gifts', isActive: true },
];

const defaultSizes: SizeVariantItem[] = [
  { id: 's-1', name: 'Size 5', category: 'Rings', dimension: '1.57 cm', isActive: true },
  { id: 's-2', name: 'Size 6', category: 'Rings', dimension: '1.65 cm', isActive: true },
  { id: 's-3', name: 'Size 7', category: 'Rings', dimension: '1.73 cm', isActive: true },
  { id: 's-4', name: 'Size 8', category: 'Rings', dimension: '1.81 cm', isActive: true },
  { id: 's-5', name: 'Size 9', category: 'Rings', dimension: '1.89 cm', isActive: true },
  { id: 's-6', name: 'Adjustable', category: 'Rings', dimension: '1.80 cm', isActive: true },
  { id: 's-7', name: '16" Choker', category: 'Necklaces', dimension: '16 inches', isActive: true },
  { id: 's-8', name: '18" Princess', category: 'Necklaces', dimension: '18 inches', isActive: true },
  { id: 's-9', name: '20" Matinee', category: 'Necklaces', dimension: '20 inches', isActive: true },
  { id: 's-10', name: '24" Opera', category: 'Necklaces', dimension: '24 inches', isActive: true },
  { id: 's-11', name: '6.0" Small', category: 'Bracelets', dimension: '6 inches', isActive: true },
  { id: 's-12', name: '6.5" Standard', category: 'Bracelets', dimension: '6.5 inches', isActive: true },
  { id: 's-13', name: '7.0" Large', category: 'Bracelets', dimension: '7 inches', isActive: true },
  { id: 's-14', name: '2.4 Bangle', category: 'Bracelets', dimension: '5.7 cm', isActive: true },
  { id: 's-15', name: '2.6 Bangle', category: 'Bracelets', dimension: '6.0 cm', isActive: true },
  { id: 's-16', name: 'Small Votive', category: 'Candles', dimension: '6.5 cm', isActive: true },
  { id: 's-17', name: 'Standard Tumbler', category: 'Candles', dimension: '9.0 cm', isActive: true },
  { id: 's-18', name: 'Grand 3-Wick Bowl', category: 'Candles', dimension: '15.0 cm', isActive: true },
];

const defaultSaleTags: LifestyleSaleTagItem[] = [
  { id: 'tag-1', name: 'Trending Lifestyle Pick', isActive: true },
  { id: 'tag-2', name: 'Diwali Festive Edit', isActive: true },
  { id: 'tag-3', name: 'Boutique Exclusive', isActive: true },
  { id: 'tag-4', name: 'Handcrafted Artisanal', isActive: true },
  { id: 'tag-5', name: 'Organic & Pure', isActive: true },
  { id: 'tag-6', name: 'Curated Milestone Gift', isActive: true },
];

const wheelPalettePresets = [
  '#FF2A00', '#FF6600', '#FF9900', '#FFCC00', '#FFFF00', '#99E600',
  '#00CC44', '#00BFA5', '#0077FF', '#283593', '#7B1FA2', '#D81B60'
];

// Used only if public.categories hasn't been fetched yet (or Supabase
// isn't configured), so the dropdowns never render completely empty.
const fallbackCategories: CategoryOption[] = [
  { id: 'fallback-jewellery', slug: 'jewellery', title: 'Jewellery' },
  { id: 'fallback-candles', slug: 'candles', title: 'Candles' },
  { id: 'fallback-decor-gifts', slug: 'decor-gifts', title: 'Decor & Gifts' },
  { id: 'fallback-general', slug: 'general', title: 'General' },
];

// Helper: parse a stored dimension string like "1.57 cm" or "18 inches"
// back into a raw numeric value + unit, so the Edit Size modal can
// pre-fill the measurement input instead of leaving it blank.
const parseDimension = (dimension: string): { val: string; unit: 'cm' | 'inches' } => {
  const match = dimension.match(/^([\d.]+)\s*(cm|inches|inch|in)\b/i);
  if (match) {
    const val = match[1];
    const unitRaw = match[2].toLowerCase();
    const unit: 'cm' | 'inches' = unitRaw.startsWith('cm') ? 'cm' : 'inches';
    return { val, unit };
  }
  return { val: '', unit: 'inches' };
};

export default function AdminAttributesPage() {
  const { showToast } = useStore();

  const [colors, setColors] = useState<ColorSwatchItem[]>([]);
  const [sizes, setSizes] = useState<SizeVariantItem[]>([]);
  const [saleTags, setSaleTags] = useState<LifestyleSaleTagItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Real categories from public.categories — powers every category
  // dropdown/filter on this page. We only ever save the category's
  // `title` (plain text) onto color_palettes.category /
  // size_variants.category, so those tables don't need to change.
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [activeSizeCategory, setActiveSizeCategory] = useState<string>('All');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const [simulatorColor, setSimulatorColor] = useState<ColorSwatchItem | null>(null);
  const [simulatorSize, setSimulatorSize] = useState<SizeVariantItem | null>(null);
  const [simulatorTag, setSimulatorTag] = useState<LifestyleSaleTagItem | null>(null);

  const activeSimColor = simulatorColor || colors[0] || {
    id: 'sim-gold',
    name: '24K Yellow Gold',
    hex: '#D4AF37',
    category: 'Jewellery',
    isActive: true,
  };
  const activeSimSize = simulatorSize || sizes[0] || {
    id: 'sim-size',
    name: '18" Princess',
    dimension: '18 inches',
    category: 'Necklaces',
    isActive: true,
  };
  const activeSimTag = simulatorTag || saleTags.find((t) => t.isActive) || null;

  // Modals (each doubles as an Add/Edit modal — editingXId === null means "Add")
  const [isAddColorOpen, setIsAddColorOpen] = useState(false);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#D4AF37');
  const [newColorCategory, setNewColorCategory] = useState('');

  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);
  const [editingSizeId, setEditingSizeId] = useState<string | null>(null);
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeCategory, setNewSizeCategory] = useState('');
  const [newSizeVal, setNewSizeVal] = useState('');
  const [newSizeUnit, setNewSizeUnit] = useState<'cm' | 'inches'>('inches');

  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);

  // RLS Notice
  const [rlsNoticeVisible, setRlsNoticeVisible] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isVerifyingRls, setIsVerifyingRls] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  const sqlScriptContent = `-- Fix RLS and table structures
ALTER TABLE public.lifestyle_sale_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.color_palettes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_variants DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.color_palettes DROP COLUMN IF EXISTS description;
ALTER TABLE public.size_variants DROP COLUMN IF EXISTS stock_status;
ALTER TABLE public.size_variants DROP COLUMN IF EXISTS stockStatus;

ALTER TABLE public.color_palettes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on color_palettes" ON public.color_palettes;
CREATE POLICY "Allow all on color_palettes" ON public.color_palettes FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.size_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on size_variants" ON public.size_variants;
CREATE POLICY "Allow all on size_variants" ON public.size_variants FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.lifestyle_sale_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on lifestyle_sale_tags" ON public.lifestyle_sale_tags;
CREATE POLICY "Allow all on lifestyle_sale_tags" ON public.lifestyle_sale_tags FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScriptContent);
    setCopiedSql(true);
    showToast('SQL Copied to Clipboard', 'Paste this into Supabase SQL Editor and click RUN.', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleVerifyRls = async () => {
    setIsVerifyingRls(true);
    showToast('Checking Supabase...', 'Testing write access to attributes tables.', 'info');
    const res = await checkLifestyleTagsRLS();
    if (res.writable) {
      setRlsNoticeVisible(false);
      showToast('RLS Check Passed! 🎉', 'Syncing all attributes to Supabase cloud...', 'success');
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

          if (colorData !== null && colorData.length > 0) {
            const sanitizedColors = colorData.map((c: any) => ({
              id: c.id,
              name: c.name,
              hex: c.hex,
              category: c.category || 'Jewellery',
              isActive: Boolean(c.isActive ?? c.is_active ?? true),
            }));
            saveColors(sanitizedColors);
            setSimulatorColor(sanitizedColors[0]);
          } else {
            const savedColors = localStorage.getItem('purnya_color_palette');
            if (savedColors) {
              try { setColors(JSON.parse(savedColors)); } catch { saveColors(defaultColors); }
            } else {
              saveColors(defaultColors);
            }
          }

          if (sizeData !== null && sizeData.length > 0) {
            const sanitizedSizes = sizeData.map((s: any) => ({
              id: s.id,
              name: s.name,
              category: s.category || 'General',
              dimension: s.dimension || '',
              isActive: Boolean(s.isActive ?? s.is_active ?? true),
            }));
            saveSizes(sanitizedSizes);
            setSimulatorSize(sanitizedSizes[0]);
          } else {
            const savedSizes = localStorage.getItem('purnya_sizes');
            if (savedSizes) {
              try { setSizes(JSON.parse(savedSizes)); } catch { saveSizes(defaultSizes); }
            } else {
              saveSizes(defaultSizes);
            }
          }

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
              } catch { }
            }
            if (!restored) {
              saveTags(defaultSaleTags);
            }
          }
        })
        .catch((err) => console.warn('Failed to load attributes from Supabase', err))
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
            if (Array.isArray(parsed)) setSaleTags(parsed.length > 0 ? parsed : defaultSaleTags);
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

  // Fetch boutique categories from Supabase (public.categories) so every
  // color swatch / size variant is tagged against a real category row
  // instead of a hardcoded list. We still store the category as plain
  // text on color_palettes.category / size_variants.category — we're
  // only sourcing the dropdown's options from the categories table.
  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      if (!isSupabaseConfigured) {
        if (isMounted) setCategories(fallbackCategories);
        return;
      }
      try {
        const data = await getCategoriesFromSupabase();
        if (!isMounted) return;
        if (data && data.length > 0) {
          setCategories(
            data.map((c: any) => ({
              id: c.id,
              slug: c.slug,
              title: c.title,
            }))
          );
        } else {
          setCategories(fallbackCategories);
        }
      } catch (err) {
        console.warn('Failed to load categories from Supabase', err);
        if (isMounted) setCategories(fallbackCategories);
      }
    };

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Once categories arrive, default the two "Add" forms to the first
  // real category instead of leaving them on an empty selection.
  useEffect(() => {
    if (categories.length === 0) return;
    setNewColorCategory((prev) => prev || categories[0].title);
    setNewSizeCategory((prev) => prev || categories[0].title);
  }, [categories]);

  const handleSyncToCloud = async () => {
    if (!isSupabaseConfigured) {
      showToast('Supabase Not Configured', 'Configure NEXT_PUBLIC_SUPABASE_URL and ANON_KEY in .env.local first.', 'info');
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
      if (isRLS) setRlsNoticeVisible(true);
      showToast(isRLS ? 'RLS Policy Restricted' : 'Cloud Sync Failed', res.message, 'error');
    }
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    showToast('HEX Copied', `${hex} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // ---------------------------------------------------------------------
  // COLOR: open helpers (Add vs Edit) + unified save handler
  // ---------------------------------------------------------------------
  const openAddColor = () => {
    setEditingColorId(null);
    setNewColorName('');
    setNewColorHex('#D4AF37');
    setNewColorCategory(categories[0]?.title || '');
    setIsAddColorOpen(true);
  };

  const openEditColor = (color: ColorSwatchItem) => {
    setEditingColorId(color.id);
    setNewColorName(color.name);
    setNewColorHex(color.hex);
    setNewColorCategory(color.category);
    setIsAddColorOpen(true);
  };

  const closeColorModal = () => {
    setIsAddColorOpen(false);
    setEditingColorId(null);
  };

  const handleSaveColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorName.trim()) return;

    if (editingColorId) {
      const existing = colors.find((c) => c.id === editingColorId);
      const updatedEntry: ColorSwatchItem = {
        id: editingColorId,
        name: newColorName.trim(),
        hex: newColorHex.trim().toUpperCase(),
        category: newColorCategory,
        isActive: existing?.isActive ?? true,
      };

      const updated = colors.map((c) => (c.id === editingColorId ? updatedEntry : c));
      saveColors(updated);
      if (simulatorColor?.id === editingColorId) setSimulatorColor(updatedEntry);
      closeColorModal();
      setNewColorName('');

      if (isSupabaseConfigured) {
        const res = await upsertColorToSupabase(updatedEntry);
        if (!res.success) {
          const isRLS = res.error?.includes('row-level security');
          if (isRLS) setRlsNoticeVisible(true);
          showToast(isRLS ? 'Saved Locally (RLS Restricted)' : 'Sync Notice', res.error || 'Saved locally.', 'info');
        } else {
          showToast('Color Updated & Synced', `${updatedEntry.name} (${updatedEntry.hex}) updated in Supabase.`, 'success');
        }
      } else {
        showToast('Color Updated', `${updatedEntry.name} has been updated.`, 'success');
      }
      return;
    }

    const newEntry: ColorSwatchItem = {
      id: `c-${Date.now()}`,
      name: newColorName.trim(),
      hex: newColorHex.trim().toUpperCase(),
      category: newColorCategory,
      isActive: true,
    };

    const updated = [newEntry, ...colors];
    saveColors(updated);
    setSimulatorColor(newEntry);
    closeColorModal();
    setNewColorName('');

    if (isSupabaseConfigured) {
      const res = await upsertColorToSupabase(newEntry);
      if (!res.success) {
        const isRLS = res.error?.includes('row-level security');
        if (isRLS) setRlsNoticeVisible(true);
        showToast(isRLS ? 'Saved Locally (RLS Restricted)' : 'Sync Notice', res.error || 'Saved locally.', 'info');
      } else {
        showToast('Color Added & Synced', `${newEntry.name} (${newEntry.hex}) saved to Supabase.`, 'success');
      }
    } else {
      showToast('Color Added', `${newEntry.name} is now in your palette.`, 'success');
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

  // ---------------------------------------------------------------------
  // SIZE: open helpers (Add vs Edit) + unified save handler
  // ---------------------------------------------------------------------
  const openAddSize = () => {
    setEditingSizeId(null);
    setNewSizeName('');
    setNewSizeCategory(categories[0]?.title || '');
    setNewSizeVal('');
    setNewSizeUnit('inches');
    setIsAddSizeOpen(true);
  };

  const openEditSize = (size: SizeVariantItem) => {
    setEditingSizeId(size.id);
    setNewSizeName(size.name);
    setNewSizeCategory(size.category);
    const { val, unit } = parseDimension(size.dimension);
    setNewSizeVal(val);
    setNewSizeUnit(unit);
    setIsAddSizeOpen(true);
  };

  const closeSizeModal = () => {
    setIsAddSizeOpen(false);
    setEditingSizeId(null);
  };

  const handleSaveSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSizeName.trim()) return;

    const formattedDimension = newSizeVal.trim()
      ? `${newSizeVal.trim()} ${newSizeUnit}`
      : `Standard ${newSizeCategory} fit`;

    if (editingSizeId) {
      const existing = sizes.find((s) => s.id === editingSizeId);
      const updatedEntry: SizeVariantItem = {
        id: editingSizeId,
        name: newSizeName.trim(),
        category: newSizeCategory,
        dimension: formattedDimension,
        isActive: existing?.isActive ?? true,
      };

      const updated = sizes.map((s) => (s.id === editingSizeId ? updatedEntry : s));
      saveSizes(updated);
      if (simulatorSize?.id === editingSizeId) setSimulatorSize(updatedEntry);
      closeSizeModal();
      setNewSizeName('');
      setNewSizeVal('');

      if (isSupabaseConfigured) {
        const res = await upsertSizeToSupabase(updatedEntry);
        if (!res.success) {
          const isRLS = res.error?.includes('row-level security');
          if (isRLS) setRlsNoticeVisible(true);
          showToast(isRLS ? 'Saved Locally (RLS Restricted)' : 'Sync Notice', res.error || 'Saved locally.', 'info');
        } else {
          showToast('Size Updated & Synced', `${updatedEntry.name} (${updatedEntry.dimension}) updated in Supabase.`, 'success');
        }
      } else {
        showToast('Size Updated', `${updatedEntry.name} has been updated.`, 'success');
      }
      return;
    }

    const newEntry: SizeVariantItem = {
      id: `s-${Date.now()}`,
      name: newSizeName.trim(),
      category: newSizeCategory,
      dimension: formattedDimension,
      isActive: true,
    };

    const updated = [newEntry, ...sizes];
    saveSizes(updated);
    setSimulatorSize(newEntry);
    closeSizeModal();
    setNewSizeName('');
    setNewSizeVal('');

    if (isSupabaseConfigured) {
      const res = await upsertSizeToSupabase(newEntry);
      if (!res.success) {
        const isRLS = res.error?.includes('row-level security');
        if (isRLS) setRlsNoticeVisible(true);
        showToast(isRLS ? 'Saved Locally (RLS Restricted)' : 'Sync Notice', res.error || 'Saved locally.', 'info');
      } else {
        showToast('Size Added & Synced', `${newEntry.name} (${newEntry.dimension}) saved to Supabase.`, 'success');
      }
    } else {
      showToast('Size Added', `${newEntry.name} variant added.`, 'success');
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

  // ---------------------------------------------------------------------
  // LIFESTYLE TAG: open helpers (Add vs Edit) + unified save handler
  // ---------------------------------------------------------------------
  const openAddTag = () => {
    setEditingTagId(null);
    setNewTagName('');
    setIsAddTagOpen(true);
  };

  const openEditTag = (tag: LifestyleSaleTagItem) => {
    setEditingTagId(tag.id);
    setNewTagName(tag.name);
    setIsAddTagOpen(true);
  };

  const closeTagModal = () => {
    setIsAddTagOpen(false);
    setEditingTagId(null);
  };

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    if (editingTagId) {
      const existing = saleTags.find((t) => t.id === editingTagId);
      const updatedEntry: LifestyleSaleTagItem = {
        id: editingTagId,
        name: newTagName.trim(),
        isActive: existing?.isActive ?? true,
      };

      const updated = saleTags.map((t) => (t.id === editingTagId ? updatedEntry : t));
      saveTags(updated);
      if (simulatorTag?.id === editingTagId) setSimulatorTag(updatedEntry);
      closeTagModal();
      setNewTagName('');

      if (isSupabaseConfigured) {
        const res = await upsertLifestyleSaleTagToSupabase(updatedEntry);
        if (!res.success) {
          const isRLS = res.error?.toLowerCase().includes('row-level security') || res.error?.includes('42501');
          if (isRLS) setRlsNoticeVisible(true);
          showToast(isRLS ? 'Saved Locally (RLS Active)' : 'Sync Notice', res.error || 'Saved locally.', 'info');
        } else {
          showToast('Lifestyle Tag Updated', `"${updatedEntry.name}" updated in Supabase.`, 'success');
        }
      } else {
        showToast('Lifestyle Tag Updated', `"${updatedEntry.name}" has been updated.`, 'success');
      }
      return;
    }

    const newEntry: LifestyleSaleTagItem = {
      id: `tag-${Date.now()}`,
      name: newTagName.trim(),
      isActive: true,
    };

    const updated = [newEntry, ...saleTags];
    saveTags(updated);
    closeTagModal();
    setNewTagName('');

    if (isSupabaseConfigured) {
      const res = await upsertLifestyleSaleTagToSupabase(newEntry);
      if (!res.success) {
        const isRLS = res.error?.toLowerCase().includes('row-level security') || res.error?.includes('42501');
        if (isRLS) setRlsNoticeVisible(true);
        showToast(isRLS ? 'Saved Locally (RLS Active)' : 'Sync Notice', res.error || 'Saved locally.', 'info');
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

  const filteredSizes = activeSizeCategory === 'All'
    ? sizes
    : sizes.filter((s) => s.category === activeSizeCategory);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
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
            Centrally manage fine jewellery color swatches, precise sizes in cm / inches, and lifestyle product tags.
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
                  if (c !== null && c.length > 0) {
                    saveColors(c.map((item: any) => ({
                      id: item.id,
                      name: item.name,
                      hex: item.hex,
                      category: item.category || 'Jewellery',
                      isActive: Boolean(item.isActive ?? item.is_active ?? true),
                    })));
                  }
                  if (s !== null && s.length > 0) {
                    saveSizes(s.map((item: any) => ({
                      id: item.id,
                      name: item.name,
                      category: item.category || 'General',
                      dimension: item.dimension || '',
                      isActive: Boolean(item.isActive ?? item.is_active ?? true),
                    })));
                  }
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
              if (confirm('Restore default boutique attributes?')) {
                saveColors(defaultColors);
                saveSizes(defaultSizes);
                saveTags(defaultSaleTags);
                if (isSupabaseConfigured) {
                  showToast('Syncing Presets...', 'Uploading default presets to Supabase Cloud...', 'info');
                  const res = await syncAttributesToSupabase(defaultColors, defaultSizes, defaultSaleTags);
                  if (res.success) {
                    showToast('Presets Synced', res.message, 'success');
                    setRlsNoticeVisible(false);
                  }
                } else {
                  showToast('Reset Complete', 'Default boutique attributes restored locally.', 'info');
                }
              }
            }}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#5A7469] border border-[#E2DBD0] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Restore presets"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Presets</span>
          </button>
        </div>
      </div>

      {/* RLS Notification */}
      {rlsNoticeVisible && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-[#0B241C] space-y-3 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>Supabase Row-Level Security (RLS) Notice</span>
                </h4>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  Supabase has RLS active. Changes are <strong>saved locally</strong>. Run the SQL script below in your Supabase SQL Editor to allow public synchronization.
                </p>
              </div>
            </div>
            <button
              onClick={() => setRlsNoticeVisible(false)}
              className="text-amber-600 hover:text-amber-800 p-1 rounded-lg hover:bg-amber-100"
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

      {/* KPI Cards */}
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
            <p className="text-[11px] font-bold text-[#5A7469] uppercase tracking-wider">Sizes (cm / inches)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0B241C]">{sizes.length}</span>
              <span className="text-xs text-emerald-700 font-semibold">Across {activeSizeCategory === 'All' ? 'All Categories' : activeSizeCategory}</span>
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
                ({saleTags.filter((t) => t.isActive).length} active)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. COLOR PALETTE CARD                                                     */}
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
                Accurate color swatches with crystal-clear HEX tone indicators and category grouping.
              </p>
            </div>
          </div>

          <button
            onClick={openAddColor}
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
              onClick={openAddColor}
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
                  className={`p-3.5 rounded-2xl border transition-all relative group flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${isSelected
                      ? 'border-[#C5A059] ring-2 ring-[#C5A059]/30 bg-[#FAF8F5]'
                      : 'border-[#E2DBD0] hover:border-[#C5A059]/60 bg-white'
                    } ${!color.isActive ? 'opacity-55' : ''}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A7469] bg-[#FAF0D7]/70 px-2 py-0.5 rounded-md border border-[#E2DBD0]">
                        {color.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleColorActive(color.id)}
                          title={color.isActive ? 'Deactivate Swatch' : 'Activate Swatch'}
                          className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 ${color.isActive ? 'bg-emerald-500 shadow-xs' : 'bg-gray-300'
                            }`}
                        />
                        <button
                          onClick={() => openEditColor(color)}
                          className="text-gray-400 hover:text-[#0B241C] p-1 rounded transition-colors"
                          title="Edit swatch"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteColor(color.id, color.name)}
                          className="text-gray-400 hover:text-rose-600 p-1 rounded transition-colors"
                          title="Delete swatch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div
                      className="w-full h-24 rounded-xl border border-black/10 shadow-inner relative flex items-end p-2 overflow-hidden transition-all group-hover:scale-[1.01]"
                      style={{ backgroundColor: color.hex }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/25 pointer-events-none" />
                      <div className="relative z-10 bg-black/75 backdrop-blur-md px-2 py-1 rounded-md text-[11px] font-mono font-bold text-white flex items-center justify-between w-full shadow-sm border border-white/20">
                        <span>{color.hex}</span>
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white/80 shadow-xs"
                          style={{ backgroundColor: color.hex }}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-sm font-bold text-[#0B241C] truncate" title={color.name}>
                        {color.name}
                      </h3>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#EFEBE3] flex items-center justify-between gap-2">
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
                        showToast('Simulating Color', `Viewing ${color.name} on the live preview card.`, 'info');
                      }}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${isSelected
                          ? 'bg-[#C5A059] text-white shadow-xs'
                          : 'bg-[#FAF8F5] text-[#0B241C] hover:bg-[#EFEBE3] border border-[#E2DBD0]'
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
      {/* 2. SIZES CARD (in cm / inches)                                             */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl border border-[#E2DBD0] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFEBE3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B241C] text-[#C5A059] flex items-center justify-center">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-xl font-bold text-[#0B241C]">
                Sizes in cm/inches
              </h2>
              <p className="text-xs text-[#5A7469]">
                Configure unified sizing in centimeters (cm) or inches without complex clutter.
              </p>
            </div>
          </div>

          <button
            onClick={openAddSize}
            className="px-4 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Size in cm/inches</span>
          </button>
        </div>

        {/* Category Filters — sourced from public.categories, not hardcoded */}
        <div className="flex flex-wrap items-center gap-2 pb-2">
          {['All', ...categories.map((cat) => cat.title)].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveSizeCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeSizeCategory === cat
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
                ? `No sizes configured in category "${activeSizeCategory}".`
                : 'All rows were deleted or not yet created in Supabase.'}
            </p>
            <button
              onClick={openAddSize}
              className="px-3.5 py-1.5 rounded-xl bg-[#0B241C] text-white text-xs font-semibold hover:bg-[#C5A059] transition-colors shadow-sm"
            >
              + Add Size (cm / inches)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSizes.map((size) => {
              const isSelected = simulatorSize?.id === size.id;
              return (
                <div
                  key={size.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${isSelected
                      ? 'border-[#C5A059] ring-2 ring-[#C5A059]/20 bg-[#FAF8F5]'
                      : 'border-[#E2DBD0] hover:border-[#C5A059]/50 bg-white'
                    } ${!size.isActive ? 'opacity-50' : ''}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] bg-[#FAF0D7] px-2 py-0.5 rounded-md border border-[#E2DBD0]">
                        {size.category}
                      </span>
                      <span className="text-[10px] font-mono text-[#5A7469] bg-gray-100 px-2 py-0.5 rounded">
                        cm/in
                      </span>
                    </div>

                    <h3 className="font-serif-title text-base font-bold text-[#0B241C]">{size.name}</h3>

                    <div className="mt-2.5 p-2 rounded-xl bg-[#FAF8F5] border border-[#E2DBD0]/70 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0B241C]">
                        {size.dimension}
                      </span>
                      <span className="text-[10px] text-[#5A7469] font-medium">Dimension</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EFEBE3] mt-4 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleSizeActive(size.id)}
                      className="text-[10px] font-semibold text-[#5A7469] hover:underline"
                    >
                      {size.isActive ? 'Active' : 'Disabled'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSimulatorSize(size);
                          showToast('Simulating Size', `Selected ${size.name} (${size.category}).`, 'info');
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${isSelected
                            ? 'bg-[#0B241C] text-[#FAF8F5]'
                            : 'bg-[#FAF8F5] text-[#0B241C] hover:bg-[#EFEBE3] border border-[#E2DBD0]'
                          }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                      <button
                        onClick={() => openEditSize(size)}
                        className="p-1 text-gray-400 hover:text-[#0B241C] transition-colors"
                        title="Edit size"
                      >
                        <Pencil className="w-3.5 h-3.5" />
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
      {/* 3. LIFESTYLE TAGS CARD                                                    */}
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
                Create custom lifestyle tags for catalog tagging and festive merchandising collections.
              </p>
            </div>
          </div>

          <button
            onClick={openAddTag}
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
              onClick={openAddTag}
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
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between bg-white border-[#E2DBD0] hover:border-[#C5A059]/50 shadow-xs ${!tag.isActive ? 'opacity-60 bg-gray-50' : ''
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-center text-[#C5A059] font-bold text-xs">
                    #
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B241C]">{tag.name}</h3>
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${tag.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
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
                    onClick={() => openEditTag(tag)}
                    className="p-1.5 text-gray-400 hover:text-[#0B241C] rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit tag"
                  >
                    <Pencil className="w-3.5 h-3.5" />
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
      {/* 4. LIVE PRODUCT SIMULATOR                                                 */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-br from-[#08281F] to-[#0B241C] text-[#FAF8F5] rounded-3xl p-6 sm:p-10 shadow-xl border border-[#144234] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#144234] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#C5A059]/20 text-[#D4AF37] border border-[#C5A059]/40 mb-2">
              <span>Real-Time Customer Preview</span>
            </div>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-white">
              Boutique Card Simulator
            </h2>
            <p className="text-xs sm:text-sm text-[#A3B8B0] max-w-2xl">
              Preview how your Color Swatch, Size Variant, and Lifestyle Tag appear on a customer-facing product card in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#D4AF37] bg-black/30 px-3 py-2 rounded-xl border border-white/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Synced with active catalog attributes</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] block">
                1. Select Palette Swatch
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {colors.filter((c) => c.isActive).slice(0, 8).map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setSimulatorColor(col)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${activeSimColor.id === col.id
                        ? 'bg-[#C5A059] text-[#08281F] font-bold border-white shadow-md'
                        : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                      }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-xs"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] block">
                2. Select Size in cm/inches
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {sizes.filter((s) => s.isActive).slice(0, 6).map((sz) => (
                  <button
                    key={sz.id}
                    onClick={() => setSimulatorSize(sz)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${activeSimSize.id === sz.id
                        ? 'bg-white text-[#08281F] border-white font-bold'
                        : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                      }`}
                  >
                    {sz.name}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#A3B8B0] pt-1">
                Active measurement: <strong className="text-white">{activeSimSize.dimension}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] block">
                3. Select Lifestyle Tag
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {saleTags.filter((t) => t.isActive).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSimulatorTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeSimTag?.id === tag.id
                        ? 'bg-rose-600 text-white border-white shadow-md'
                        : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                      }`}
                  >
                    #{tag.name}
                  </button>
                ))}
                {saleTags.filter((t) => t.isActive).length === 0 && (
                  <span className="text-[11px] text-[#A3B8B0]">No active lifestyle tags yet — add one above.</span>
                )}
              </div>
              {activeSimTag && (
                <p className="text-[11px] text-[#A3B8B0] pt-1">
                  Active tag: <strong className="text-white">#{activeSimTag.name}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Interactive Mock Product Card Preview */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#E2DBD0] text-[#0B241C] transition-all hover:shadow-3xl">
              <div className="relative h-64 bg-[#FAF8F5] overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&fit=crop&auto=format"
                  alt="Product Preview"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {activeSimTag && (
                  <div className="absolute top-3 left-3 bg-rose-600/90 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wide shadow-md border border-white/20">
                    {activeSimTag.name}
                  </div>
                )}

                <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-semibold flex items-center gap-2 border border-white/20 shadow-md">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white"
                    style={{ backgroundColor: activeSimColor.hex }}
                  />
                  <span>{activeSimColor.name}</span>
                  <span className="font-mono text-[10px] text-gray-300">({activeSimColor.hex})</span>
                </div>
              </div>

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

                <div className="flex items-baseline gap-2.5">
                  <span className="text-xl font-serif-title font-bold text-[#0B241C]">
                    ₹3,499
                  </span>
                  <span className="text-xs text-gray-400 line-through">₹4,499</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Save ₹1,000
                  </span>
                </div>

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
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${activeSimSize.id === sz.id
                              ? 'bg-[#0B241C] text-white border-[#0B241C]'
                              : 'bg-[#FAF8F5] text-[#2C4A3E] border-[#E2DBD0] hover:border-[#C5A059]'
                            }`}
                        >
                          {sz.name}
                        </button>
                      ))}
                  </div>
                </div>

                {activeSimTag && (
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full uppercase tracking-wide inline-block">
                      #{activeSimTag.name}
                    </span>
                  </div>
                )}

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
      {/* MODAL 1: ADD / EDIT COLOR (Cute Color Wheel Picker, No Grid Clashing)      */}
      {/* ========================================================================= */}
      {isAddColorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-[#E2DBD0] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3]">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-serif-title text-xl font-bold text-[#0B241C]">
                  {editingColorId ? 'Edit Color Swatch' : 'Add Color Swatch'}
                </h3>
              </div>
              <button
                onClick={closeColorModal}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveColor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B241C] mb-1">Color Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 18K Champagne Gold or Sapphire Blue"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DBD0] text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* Responsive 2-column with min-w-0 to prevent element collision */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Cute Color Picker & Wheel */}
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-[#0B241C] mb-1.5">HEX Code *</label>
                  <div className="flex items-center gap-2">
                    <div className="relative shrink-0 group">
                      <input
                        id="native-color-picker"
                        type="color"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        title="Open Color Wheel"
                      />
                      <div
                        className="w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-transform group-hover:scale-105 cursor-pointer relative overflow-hidden shrink-0"
                        style={{
                          background: 'conic-gradient(#FF0000, #FF7F00, #FFFF00, #00FF00, #00FFFF, #0000FF, #8B00FF, #FF007F, #FF0000)',
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: newColorHex }}
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      required
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-full min-w-0 px-3 py-2.5 rounded-xl border border-[#E2DBD0] text-xs font-mono font-bold focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-bold text-[#0B241C] mb-1.5">Category</label>
                  <select
                    value={newColorCategory}
                    onChange={(e) => setNewColorCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E2DBD0] text-xs bg-white focus:outline-none focus:border-[#C5A059]"
                  >
                    {categories.length === 0 && <option value="">Loading categories…</option>}
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.title}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cute Color Wheel Quick Presets */}
              <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E2DBD0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A7469]">
                    Color Wheel Swatch Presets
                  </span>
                  <span className="text-[10px] text-[#C5A059] font-medium flex items-center gap-1">
                    <Pipette className="w-3 h-3" /> Click circle to fine-tune
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  {wheelPalettePresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewColorHex(preset)}
                      className={`w-6 h-6 rounded-full border transition-all hover:scale-125 shadow-xs ${newColorHex.toUpperCase() === preset.toUpperCase()
                          ? 'ring-2 ring-[#0B241C] scale-110 border-white'
                          : 'border-white/90'
                        }`}
                      style={{ backgroundColor: preset }}
                      title={preset}
                    />
                  ))}
                </div>
              </div>

              {/* Rich Visual Appearance Banner */}
              <div>
                <label className="block text-[11px] font-bold text-[#5A7469] uppercase tracking-wider mb-1.5">
                  Visual Appearance Preview
                </label>
                <div
                  className="h-16 w-full rounded-2xl border border-black/15 shadow-inner flex items-center justify-between px-4 text-white relative overflow-hidden"
                  style={{ backgroundColor: newColorHex }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-white/20 pointer-events-none" />
                  <div className="relative z-10">
                    <p className="text-sm font-bold drop-shadow-sm">{newColorName || 'New Color Preview'}</p>
                    <p className="text-xs font-mono font-semibold opacity-90">{newColorHex}</p>
                  </div>
                  <div
                    className="relative z-10 w-8 h-8 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: newColorHex }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFEBE3]">
                <button
                  type="button"
                  onClick={closeColorModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A7469] hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  {editingColorId ? 'Update Swatch' : 'Save Swatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT SIZE (Single Input + cm/inches Dropdown, Cleaned)      */}
      {/* ========================================================================= */}
      {isAddSizeOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-[#E2DBD0] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3]">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-serif-title text-xl font-bold text-[#0B241C]">
                  {editingSizeId ? 'Edit Size (cm / inches)' : 'Add Size (cm / inches)'}
                </h3>
              </div>
              <button
                onClick={closeSizeModal}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSize} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B241C] mb-1">Size Name / Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 18 Inch Princess or Size 7"
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DBD0] text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B241C] mb-1">Category *</label>
                <select
                  value={newSizeCategory}
                  onChange={(e) => setNewSizeCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2DBD0] text-xs focus:outline-none focus:border-[#C5A059]"
                >
                  {categories.length === 0 && <option value="">Loading categories…</option>}
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.title}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B241C] mb-1">
                  Measurement & Unit *
                </label>
                <div className="flex items-center rounded-xl border border-[#E2DBD0] overflow-hidden focus-within:border-[#C5A059] bg-white">
                  <input
                    type="text"
                    required
                    placeholder={newSizeUnit === 'inches' ? 'e.g. 18 or 6.5' : 'e.g. 45 or 16.5'}
                    value={newSizeVal}
                    onChange={(e) => setNewSizeVal(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-xs focus:outline-none bg-transparent"
                  />
                  <div className="h-6 w-px bg-[#E2DBD0]" />
                  <select
                    value={newSizeUnit}
                    onChange={(e) => setNewSizeUnit(e.target.value as 'cm' | 'inches')}
                    className="px-3.5 py-2.5 text-xs font-semibold text-[#0B241C] bg-[#FAF8F5] focus:outline-none cursor-pointer border-none"
                  >
                    <option value="inches">inches</option>
                    <option value="cm">cm</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E2DBD0] text-xs text-[#2C4A3E] flex items-center justify-between">
                <span className="font-bold text-[#0B241C]">Card Output:</span>
                <span className="font-semibold text-[#C5A059] bg-white px-2.5 py-1 rounded-md border border-[#E2DBD0]">
                  {newSizeVal.trim() ? `${newSizeVal.trim()} ${newSizeUnit}` : 'Enter measurement above'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFEBE3]">
                <button
                  type="button"
                  onClick={closeSizeModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A7469] hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  {editingSizeId ? 'Update Size' : 'Save Size'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT LIFESTYLE TAG                                         */}
      {/* ========================================================================= */}
      {isAddTagOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-[#E2DBD0] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3]">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-serif-title text-xl font-bold text-[#0B241C]">
                  {editingTagId ? 'Edit Lifestyle Tag' : 'Add Lifestyle Tag'}
                </h3>
              </div>
              <button
                onClick={closeTagModal}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTag} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B241C] mb-1">Tag Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Festive Edit, Handcrafted, Wedding Pick"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DBD0] text-sm focus:outline-none focus:border-[#C5A059] bg-[#FAF8F5] font-medium"
                />
                <p className="text-[11px] text-[#5A7469] mt-1.5 leading-relaxed">
                  This tag will appear when merchants assign lifestyle attributes to catalog items.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFEBE3]">
                <button
                  type="button"
                  onClick={closeTagModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A7469] hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  {editingTagId ? 'Update Lifestyle Tag' : 'Save Lifestyle Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}