'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Edit3, Trash2, Loader2, CheckCircle2, ShieldCheck, Mail, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; // Updated to point correctly to supabaseClient.ts

interface SubAdmin {
  id: string;
  full_name: string;
  email: string;
  role: string;
  password?: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

type CategoryLite = { id: string; slug: string; title: string };

// Tabs that are NOT split by category. Products Catalog and Inventory &
// Stock are rendered separately below as expandable category groups.
const ALL_AVAILABLE_TABS = [
  { id: 'dashboard', label: 'Dashboard Overview' },
  { id: 'home', label: 'Home Management' },
  { id: 'categories', label: 'Categories & Subcats' },
  { id: 'attributes', label: 'Attributes & Badges' },
  { id: 'orders', label: 'Orders Management' },
  { id: 'payments', label: 'Payments Update' },
  { id: 'customers', label: 'Customers & Patrons' },
  { id: 'shipping', label: 'Shipping & Logistics' },
  { id: 'returns', label: 'Returns & Exchanges' },
  { id: 'coupons', label: 'Offers & Coupons' },
  { id: 'banners', label: 'Banners & Content' },
  { id: 'reports', label: 'Reports & Analytics' },
  { id: 'management', label: 'Admin Management' },
];

// The two catalog-style tabs that get a per-category breakdown.
// permission ids: 'products' / 'inventory' = full/"All" access,
// 'products:<categoryId>' / 'inventory:<categoryId>' = single-category access.
const CATALOG_GROUPS: { key: 'products' | 'inventory'; allId: string; label: string; allLabel: string }[] = [
  { key: 'products', allId: 'products', label: 'Products Catalog', allLabel: 'All Products' },
  { key: 'inventory', allId: 'inventory', label: 'Inventory & Stock', allLabel: 'All Inventory' },
];

export default function AdminManagementPage() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Staff Manager');
  const [password, setPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['dashboard', 'orders', 'products']);

  // Which catalog groups are expanded in the modal (Products Catalog / Inventory & Stock)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    products: true,
    inventory: true,
  });

  // Fetch SubAdmins from Supabase table on load
  const fetchSubAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubAdmins(data || []);
    } catch (err: any) {
      console.error('Error fetching admin users:', err.message);
      showNotificationMsg('Failed to load subadmins from database.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories so we can list them under Products Catalog / Inventory & Stock,
  // same source + ordering as the sidebar dropdowns.
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, slug, title')
      .order('priority', { ascending: true })
      .order('title', { ascending: true });

    if (!error) setCategories(data || []);
  };

  useEffect(() => {
    fetchSubAdmins();
    fetchCategories();
  }, []);

  const showNotificationMsg = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setRole('Staff Manager');
    setPassword('');
    setSelectedPermissions(['dashboard', 'orders', 'products']);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (admin: SubAdmin) => {
    setEditingId(admin.id);
    setName(admin.full_name);
    setEmail(admin.email);
    setRole(admin.role || 'Staff Manager');
    setPassword(''); // Leave blank unless changing password
    setSelectedPermissions(Array.isArray(admin.permissions) ? admin.permissions : []);
    setIsModalOpen(true);
  };

  const togglePermission = (tabId: string) => {
    if (selectedPermissions.includes(tabId)) {
      setSelectedPermissions(selectedPermissions.filter((id) => id !== tabId));
    } else {
      setSelectedPermissions([...selectedPermissions, tabId]);
    }
  };

  // Toggling "All Products" / "All Inventory" also clears any single-category
  // picks for that group (they're redundant once the whole tab is granted),
  // and toggling a single category clears the "All" flag for that group.
  const toggleCatalogAll = (groupKey: 'products' | 'inventory') => {
    const catIds = categories.map((c) => `${groupKey}:${c.id}`);
    setSelectedPermissions((prev) => {
      const hasAll = prev.includes(groupKey);
      if (hasAll) {
        return prev.filter((id) => id !== groupKey);
      }
      return [...prev.filter((id) => !catIds.includes(id)), groupKey];
    });
  };

  const toggleCatalogCategory = (groupKey: 'products' | 'inventory', categoryId: string) => {
    const permId = `${groupKey}:${categoryId}`;
    setSelectedPermissions((prev) => {
      const withoutAll = prev.filter((id) => id !== groupKey);
      if (withoutAll.includes(permId)) {
        return withoutAll.filter((id) => id !== permId);
      }
      return [...withoutAll, permId];
    });
  };

  const handleSelectAllPermissions = () => {
    const catalogAllIds = categories.flatMap((c) => [`products:${c.id}`, `inventory:${c.id}`]);
    const fullSet = [...ALL_AVAILABLE_TABS.map((t) => t.id), 'products', 'inventory', ...catalogAllIds];
    // "select all" only needs to check against the base tabs + the two group flags,
    // since granting 'products' / 'inventory' already implies every category.
    const currentlyAll =
      ALL_AVAILABLE_TABS.every((t) => selectedPermissions.includes(t.id)) &&
      selectedPermissions.includes('products') &&
      selectedPermissions.includes('inventory');

    if (currentlyAll) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions([...ALL_AVAILABLE_TABS.map((t) => t.id), 'products', 'inventory']);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    if (!editingId && !password.trim()) {
      showNotificationMsg('Password is required for new subadmin accounts.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // UPDATE record in Supabase
        const updatePayload: any = {
          full_name: name,
          email,
          role,
          permissions: selectedPermissions,
        };
        if (password.trim()) {
          updatePayload.password = password;
        }

        const { data, error } = await supabase
          .from('admin_users')
          .update(updatePayload)
          .eq('id', editingId)
          .select();

        if (error) throw error;

        // .update() does not error when the id matches nothing — it just
        // affects zero rows. Catch that case explicitly so "Save" never
        // silently does nothing.
        if (!data || data.length === 0) {
          throw new Error('No matching subadmin record was found to update (id may be stale — refresh and try again).');
        }

        showNotificationMsg('Subadmin account successfully updated!');
      } else {
        // INSERT new record into Supabase
        const newPayload = {
          full_name: name,
          email,
          role,
          password,
          permissions: selectedPermissions,
          is_active: true,
        };

        const { error } = await supabase.from('admin_users').insert([newPayload]);

        if (error) throw error;
        showNotificationMsg('New subadmin account created successfully!');
      }

      setIsModalOpen(false);
      fetchSubAdmins();
    } catch (err: any) {
      console.error('Database save error:', err.message);

      // Postgres unique_violation code — give a readable message instead of
      // surfacing the raw constraint name.
      if (err.code === '23505' || (err.message || '').includes('admin_users_email_key')) {
        showNotificationMsg('That email is already used by another subadmin. Use a different email.');
      } else {
        showNotificationMsg(`Error: ${err.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteSubAdmin = async (id: string) => {
    if (confirm('Are you sure you want to revoke access and delete this subadmin from the database?')) {
      try {
        const { error } = await supabase.from('admin_users').delete().eq('id', id);
        if (error) throw error;

        showNotificationMsg('Subadmin removed successfully.');
        fetchSubAdmins();
      } catch (err: any) {
        console.error('Delete error:', err.message);
        showNotificationMsg(`Failed to delete: ${err.message}`);
      }
    }
  };

  // Resolve a stored permission id ('products', 'inventory:<id>', 'orders', ...)
  // to a human-readable label for the "Permitted Modules" badges.
  const labelForPermission = (permId: string): string => {
    const staticTab = ALL_AVAILABLE_TABS.find((t) => t.id === permId);
    if (staticTab) return staticTab.label;

    const group = CATALOG_GROUPS.find((g) => g.key === permId);
    if (group) return group.allLabel;

    const [groupKey, categoryId] = permId.split(':');
    const groupDef = CATALOG_GROUPS.find((g) => g.key === groupKey);
    if (groupDef && categoryId) {
      const cat = categories.find((c) => c.id === categoryId);
      return `${groupDef.label}: ${cat ? cat.title : categoryId}`;
    }

    return permId;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F5]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
      </div>
    );
  }

  const totalTabsForSelectAllLabel = (() => {
    const baseAll =
      ALL_AVAILABLE_TABS.every((t) => selectedPermissions.includes(t.id)) &&
      selectedPermissions.includes('products') &&
      selectedPermissions.includes('inventory');
    return baseAll ? 'Deselect All' : 'Select All Tabs';
  })();

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 bg-[#FAF9F5] min-h-screen relative font-sans text-[#0B241C]">
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
            Admin & Subadmin Management
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Provision staff credentials directly into Supabase, configure roles, and restrict access down to specific tabs.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] hover:text-[#0B241C] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subadmin</span>
        </button>
      </div>

      {/* Subadmin List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subAdmins.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-[#E2DBD0]">
            <p className="text-sm text-[#5A7469]">No subadmins found in database.</p>
          </div>
        ) : (
          subAdmins.map((admin) => {
            const adminPermissions = Array.isArray(admin.permissions) ? admin.permissions : [];
            return (
              <div key={admin.id} className="p-6 rounded-3xl border bg-white shadow-sm border-[#E2DBD0] flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-[#EFEBE3]">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[#EBF3EF] border border-[#E2DBD0] flex items-center justify-center font-bold text-xs text-[#C5A059]">
                        {admin.full_name ? admin.full_name.charAt(0) : 'A'}
                      </div>
                      <div>
                        <h3 className="font-serif text-base font-bold text-[#0B241C] leading-tight">{admin.full_name}</h3>
                        <span className="text-[10px] uppercase font-semibold text-[#C5A059] tracking-wider">{admin.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleOpenEdit(admin)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#C5A059] hover:text-white transition" title="Edit Permissions & Details">
                        <Edit3 className="w-4 h-4 text-[#0B241C]" />
                      </button>
                      <button onClick={() => deleteSubAdmin(admin.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white transition text-red-600" title="Revoke Access">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-[#2C4A3E]">
                      <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#2C4A3E]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>{adminPermissions.length} Tabs Accessible</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-[#5A7469] uppercase tracking-wider">Permitted Modules:</p>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {adminPermissions.map((pId) => (
                        <span key={pId} className="px-2 py-0.5 rounded-md text-[10px] bg-[#EBF3EF] text-[#0B241C] border border-[#E2DBD0] font-medium">
                          {labelForPermission(pId)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EFEBE3] flex items-center justify-between text-[10px] text-[#5A7469]">
                  <span>Added: {admin.created_at ? admin.created_at.split('T')[0] : 'N/A'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Active</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <form onSubmit={handleSave} className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-[#E2DBD0] shadow-2xl text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-[#EFEBE3]">
              <h3 className="font-serif text-lg font-bold text-[#0B241C]">
                {editingId ? 'Edit Subadmin Access & Credentials' : 'Create New Subadmin Account'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-[#5A7469] hover:text-[#0B241C]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" className="w-full p-3 rounded-xl border border-[#E2DBD0] font-bold text-[#0B241C] bg-white" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Email Address (Login ID)</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@purnya.com" className="w-full p-3 rounded-xl border border-[#E2DBD0] font-bold text-[#0B241C] bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Assigned Role Label</label>
                <input type="text" required value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g., Inventory Manager" className="w-full p-3 rounded-xl border border-[#E2DBD0] font-bold text-[#0B241C] bg-white" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">
                  {editingId ? 'New Password (Leave blank to keep current)' : 'Password'}
                </label>
                <input type="password" {...(!editingId ? { required: true } : {})} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 rounded-xl border border-[#E2DBD0] font-bold text-[#0B241C] bg-white" />
              </div>
            </div>

            {/* Tab Permission Access Checkboxes */}
            <div className="space-y-3 pt-4 border-t border-[#EFEBE3]">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#0B241C]">Granular Tab & Section Permissions</h4>
                <button type="button" onClick={handleSelectAllPermissions} className="text-[11px] text-[#C5A059] font-bold hover:underline">
                  {totalTabsForSelectAllLabel}
                </button>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto p-3 rounded-2xl bg-[#FAF9F5] border border-[#E2DBD0]">
                {/* Plain, non-catalog tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {ALL_AVAILABLE_TABS.map((tab) => {
                    const isChecked = selectedPermissions.includes(tab.id);
                    return (
                      <label key={tab.id} className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition ${isChecked ? 'bg-[#0B241C] text-white border-[#0B241C]' : 'bg-white text-[#2C4A3E] border-[#E2DBD0] hover:bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(tab.id)}
                          className="rounded text-[#C5A059] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-[11px] font-semibold truncate">{tab.label}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Products Catalog & Inventory & Stock — expandable, per-category permissions */}
                {CATALOG_GROUPS.map((group) => {
                  const isAllChecked = selectedPermissions.includes(group.allId);
                  const isExpanded = expandedGroups[group.key];
                  return (
                    <div key={group.key} className="rounded-xl border border-[#E2DBD0] bg-white overflow-hidden">
                      <div className="flex items-center">
                        <label
                          className={`flex-1 flex items-center gap-2.5 p-2.5 cursor-pointer transition ${isAllChecked ? 'bg-[#0B241C] text-white' : 'text-[#2C4A3E] hover:bg-gray-50'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isAllChecked}
                            onChange={() => toggleCatalogAll(group.key)}
                            className="rounded text-[#C5A059] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="text-[11px] font-semibold truncate">{group.label} — {group.allLabel}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setExpandedGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                          className="p-2.5 text-[#5A7469] hover:text-[#0B241C]"
                          title="Show categories"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 pt-0">
                          {categories.length === 0 && (
                            <p className="text-[10px] text-[#5A7469] px-1">No categories yet.</p>
                          )}
                          {categories.map((cat) => {
                            const permId = `${group.key}:${cat.id}`;
                            const isChecked = isAllChecked || selectedPermissions.includes(permId);
                            return (
                              <label
                                key={cat.id}
                                className={`flex items-center gap-2.5 p-2 rounded-lg border transition ${
                                  isAllChecked ? 'opacity-50 cursor-not-allowed bg-gray-50 border-[#E2DBD0] text-[#5A7469]' : isChecked ? 'bg-[#0B241C] text-white border-[#0B241C] cursor-pointer' : 'bg-white text-[#2C4A3E] border-[#E2DBD0] hover:bg-gray-50 cursor-pointer'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isAllChecked}
                                  onChange={() => toggleCatalogCategory(group.key, cat.id)}
                                  className="rounded text-[#C5A059] focus:ring-0 w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <span className="text-[11px] font-semibold truncate">{cat.title}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#EFEBE3]">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-[#E2DBD0] text-[#2C4A3E]">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-2 rounded-xl bg-[#C5A059] text-[#0B241C] font-bold shadow-md uppercase tracking-wider cursor-pointer flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingId ? 'Update in Database' : 'Save Subadmin'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}