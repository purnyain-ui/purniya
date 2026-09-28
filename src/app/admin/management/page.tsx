'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  X,
  Edit3,
  Trash2,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Package,
  Boxes,
  Sparkles,
  Check,
  Filter,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { isSuperAdmin } from '@/lib/adminPermissions';

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
// Stock are configured separately with dedicated category access controls.
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
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'dashboard',
    'orders',
    'products',
  ]);

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

  // Fetch categories so we can list them under Products Catalog / Inventory & Stock
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

  // -------------------------------------------------------------
  // Products Catalog Access State Helpers
  // -------------------------------------------------------------
  const hasFullProducts = selectedPermissions.includes('products');
  const selectedProductCatIds = selectedPermissions
    .filter((p) => p.startsWith('products:'))
    .map((p) => p.replace('products:', ''));

  const productsMode: 'all' | 'specific' | 'none' = hasFullProducts
    ? 'all'
    : selectedProductCatIds.length > 0
    ? 'specific'
    : 'none';

  const setProductsMode = (mode: 'all' | 'specific' | 'none') => {
    setSelectedPermissions((prev) => {
      const cleaned = prev.filter((p) => p !== 'products' && !p.startsWith('products:'));
      if (mode === 'all') {
        return [...cleaned, 'products'];
      }
      if (mode === 'specific') {
        const toAdd =
          selectedProductCatIds.length > 0
            ? selectedProductCatIds.map((id) => `products:${id}`)
            : categories.length > 0
            ? [`products:${categories[0].id}`]
            : [];
        return [...cleaned, ...toAdd];
      }
      return cleaned;
    });
  };

  const toggleProductCategory = (catId: string) => {
    const permId = `products:${catId}`;
    setSelectedPermissions((prev) => {
      const withoutAll = prev.filter((p) => p !== 'products');
      if (withoutAll.includes(permId)) {
        return withoutAll.filter((id) => id !== permId);
      }
      return [...withoutAll, permId];
    });
  };

  const selectAllProductCategories = () => {
    setSelectedPermissions((prev) => {
      const cleaned = prev.filter((p) => p !== 'products' && !p.startsWith('products:'));
      return [...cleaned, ...categories.map((c) => `products:${c.id}`)];
    });
  };

  const clearAllProductCategories = () => {
    setSelectedPermissions((prev) =>
      prev.filter((p) => p !== 'products' && !p.startsWith('products:'))
    );
  };

  // -------------------------------------------------------------
  // Inventory & Stock Access State Helpers
  // -------------------------------------------------------------
  const hasFullInventory = selectedPermissions.includes('inventory');
  const selectedInventoryCatIds = selectedPermissions
    .filter((p) => p.startsWith('inventory:'))
    .map((p) => p.replace('inventory:', ''));

  const inventoryMode: 'all' | 'specific' | 'none' = hasFullInventory
    ? 'all'
    : selectedInventoryCatIds.length > 0
    ? 'specific'
    : 'none';

  const setInventoryMode = (mode: 'all' | 'specific' | 'none') => {
    setSelectedPermissions((prev) => {
      const cleaned = prev.filter((p) => p !== 'inventory' && !p.startsWith('inventory:'));
      if (mode === 'all') {
        return [...cleaned, 'inventory'];
      }
      if (mode === 'specific') {
        const toAdd =
          selectedInventoryCatIds.length > 0
            ? selectedInventoryCatIds.map((id) => `inventory:${id}`)
            : categories.length > 0
            ? [`inventory:${categories[0].id}`]
            : [];
        return [...cleaned, ...toAdd];
      }
      return cleaned;
    });
  };

  const toggleInventoryCategory = (catId: string) => {
    const permId = `inventory:${catId}`;
    setSelectedPermissions((prev) => {
      const withoutAll = prev.filter((p) => p !== 'inventory');
      if (withoutAll.includes(permId)) {
        return withoutAll.filter((id) => id !== permId);
      }
      return [...withoutAll, permId];
    });
  };

  const selectAllInventoryCategories = () => {
    setSelectedPermissions((prev) => {
      const cleaned = prev.filter((p) => p !== 'inventory' && !p.startsWith('inventory:'));
      return [...cleaned, ...categories.map((c) => `inventory:${c.id}`)];
    });
  };

  const clearAllInventoryCategories = () => {
    setSelectedPermissions((prev) =>
      prev.filter((p) => p !== 'inventory' && !p.startsWith('inventory:'))
    );
  };

  // -------------------------------------------------------------
  // Select / Deselect All Tabs
  // -------------------------------------------------------------
  const handleSelectAllPermissions = () => {
    const currentlyAll =
      ALL_AVAILABLE_TABS.every((t) => selectedPermissions.includes(t.id)) &&
      selectedPermissions.includes('products') &&
      selectedPermissions.includes('inventory');

    if (currentlyAll) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions([
        ...ALL_AVAILABLE_TABS.map((t) => t.id),
        'products',
        'inventory',
      ]);
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

        if (!data || data.length === 0) {
          throw new Error(
            'No matching subadmin record was found to update (id may be stale — refresh and try again).'
          );
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

  const labelForPermission = (permId: string): string => {
    const staticTab = ALL_AVAILABLE_TABS.find((t) => t.id === permId);
    if (staticTab) return staticTab.label;

    if (permId === 'products') return 'All Products Catalog';
    if (permId === 'inventory') return 'All Inventory';

    const [groupKey, categoryId] = permId.split(':');
    if (groupKey === 'products' && categoryId) {
      const cat = categories.find((c) => c.id === categoryId);
      return `Products: ${cat ? cat.title.trim() : categoryId}`;
    }
    if (groupKey === 'inventory' && categoryId) {
      const cat = categories.find((c) => c.id === categoryId);
      return `Inventory: ${cat ? cat.title.trim() : categoryId}`;
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

  const isAllTabsSelected =
    ALL_AVAILABLE_TABS.every((t) => selectedPermissions.includes(t.id)) &&
    selectedPermissions.includes('products') &&
    selectedPermissions.includes('inventory');

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
            Provision staff credentials directly into Supabase, configure roles, and assign full or single-category permissions.
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
            const isSuper = isSuperAdmin(admin.role);

            const hasFullProd = isSuper || adminPermissions.includes('products');
            const assignedProdCats = adminPermissions
              .filter((p) => p.startsWith('products:'))
              .map((p) => p.replace('products:', ''));

            const hasFullInv = isSuper || adminPermissions.includes('inventory');
            const assignedInvCats = adminPermissions
              .filter((p) => p.startsWith('inventory:'))
              .map((p) => p.replace('inventory:', ''));

            const generalTabs = adminPermissions.filter(
              (p) => !p.startsWith('products') && !p.startsWith('inventory')
            );

            return (
              <div
                key={admin.id}
                className="p-6 rounded-3xl border bg-white shadow-sm border-[#E2DBD0] flex flex-col justify-between space-y-5 transition-all hover:border-[#C5A059]/60 hover:shadow-md"
              >
                <div className="space-y-4">
                  {/* Header: Name, Role, Actions */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EBF3EF] border border-[#C5A059]/40 flex items-center justify-center font-bold text-sm text-[#C5A059]">
                        {admin.full_name ? admin.full_name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <h3 className="font-serif text-base font-bold text-[#0B241C] leading-tight">
                          {admin.full_name}
                        </h3>
                        <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                          {admin.role}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(admin)}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-[#C5A059] hover:text-white transition cursor-pointer"
                        title="Edit Permissions & Details"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#0B241C]" />
                      </button>
                      <button
                        onClick={() => deleteSubAdmin(admin.id)}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white transition text-red-600 cursor-pointer"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Credentials / Metadata */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-[#2C4A3E]">
                      <Mail className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#2C4A3E]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                      <span className="font-semibold">
                        {isSuper ? 'Full System Administrator' : `${adminPermissions.length} Permissions Configured`}
                      </span>
                    </div>
                  </div>

                  {/* Products Catalog Access Badge Section */}
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#5A7469] uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Products Catalog Access</span>
                      </span>
                      {hasFullProd ? (
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Full Access
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {assignedProdCats.length} Assigned
                        </span>
                      )}
                    </div>

                    {hasFullProd ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B241C]">
                        <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>All Product Categories (Unrestricted)</span>
                      </div>
                    ) : assignedProdCats.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {assignedProdCats.map((catId) => {
                          const cat = categories.find((c) => c.id === catId);
                          return (
                            <span
                              key={catId}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-white text-[#0B241C] border border-[#C5A059] shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                              <span>{cat ? cat.title.trim() : catId}</span>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#8BAAA0] italic">No product categories assigned.</p>
                    )}
                  </div>

                  {/* Inventory Access Badge Section */}
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#5A7469] uppercase tracking-wider flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-blue-600" />
                        <span>Inventory & Stock</span>
                      </span>
                      {hasFullInv ? (
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                          Full Stock
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300">
                          {assignedInvCats.length} Assigned
                        </span>
                      )}
                    </div>

                    {hasFullInv ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B241C]">
                        <Boxes className="w-3.5 h-3.5 text-blue-600" />
                        <span>All Inventory Stock (Unrestricted)</span>
                      </div>
                    ) : assignedInvCats.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {assignedInvCats.map((catId) => {
                          const cat = categories.find((c) => c.id === catId);
                          return (
                            <span
                              key={catId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white text-blue-900 border border-blue-300 shadow-2xs"
                            >
                              <span>{cat ? cat.title.trim() : catId}</span>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#8BAAA0] italic">No inventory categories assigned.</p>
                    )}
                  </div>

                  {/* General Modules */}
                  {generalTabs.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[#5A7469] uppercase tracking-wider">
                        Other Accessible Modules:
                      </p>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {generalTabs.map((pId) => (
                          <span
                            key={pId}
                            className="px-2 py-0.5 rounded-md text-[10px] bg-[#EBF3EF] text-[#0B241C] border border-[#E2DBD0] font-medium"
                          >
                            {labelForPermission(pId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#EFEBE3] flex items-center justify-between text-[10px] text-[#5A7469]">
                  <span>Added: {admin.created_at ? admin.created_at.split('T')[0] : 'N/A'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-[#E2DBD0] shadow-2xl text-xs my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#EFEBE3]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#0B241C]">
                  {editingId ? 'Edit Subadmin Access & Permissions' : 'Create New Subadmin Account'}
                </h3>
                <p className="text-[11px] text-[#5A7469]">
                  Configure role, credentials, and category-level permissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#5A7469] hover:text-[#0B241C] hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Info Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Sarah Jenkins"
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] font-bold text-[#0B241C] bg-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Email Address (Login ID)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@purnya.com"
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] font-bold text-[#0B241C] bg-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Assigned Role Title</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Category Manager"
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] font-bold text-[#0B241C] bg-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">
                  {editingId ? 'New Password (Leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  {...(!editingId ? { required: true } : {})}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] font-bold text-[#0B241C] bg-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Products Catalog Access (WELL-DESIGNED CATEGORY ACCESS CONTROL) */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-3 pt-4 border-t border-[#EFEBE3]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#C5A059] flex items-center justify-center text-[#C5A059] shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0B241C]">Products Catalog Access</h4>
                  <p className="text-[11px] text-[#5A7469]">
                    Grant access to all categories or restrict this staff member to specific categories only.
                  </p>
                </div>
              </div>

              {/* Mode Selector Segmented Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setProductsMode('all')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    productsMode === 'all'
                      ? 'border-[#C5A059] bg-[#0B241C] text-white shadow-sm ring-1 ring-[#C5A059]'
                      : 'border-[#E2DBD0] bg-white text-[#2C4A3E] hover:border-[#C5A059]/60 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs">All Categories</span>
                    {productsMode === 'all' && <Check className="w-4 h-4 text-[#C5A059]" />}
                  </div>
                  <span className="text-[10px] opacity-80">Full access to entire product catalog</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProductsMode('specific')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    productsMode === 'specific'
                      ? 'border-[#C5A059] bg-[#0B241C] text-white shadow-sm ring-1 ring-[#C5A059]'
                      : 'border-[#E2DBD0] bg-white text-[#2C4A3E] hover:border-[#C5A059]/60 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs">Specific Categories</span>
                    {productsMode === 'specific' && <Check className="w-4 h-4 text-[#C5A059]" />}
                  </div>
                  <span className="text-[10px] opacity-80">
                    Restricted to {selectedProductCatIds.length} assigned category
                    {selectedProductCatIds.length === 1 ? '' : 'ies'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setProductsMode('none')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    productsMode === 'none'
                      ? 'border-gray-400 bg-gray-100 text-gray-800 ring-1 ring-gray-400'
                      : 'border-[#E2DBD0] bg-white text-[#5A7469] hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs">No Product Access</span>
                    {productsMode === 'none' && <Check className="w-4 h-4 text-gray-700" />}
                  </div>
                  <span className="text-[10px] opacity-80">Hide products tab for this staff</span>
                </button>
              </div>

              {/* Specific Categories Picker Grid */}
              {productsMode === 'specific' && (
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#C5A059]/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2DBD0]">
                    <span className="text-xs font-bold text-[#0B241C] flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>
                        Assigned Categories ({selectedProductCatIds.length} of {categories.length} selected):
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllProductCategories}
                        className="text-[11px] font-bold text-[#C5A059] hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-[#8BAAA0] text-xs">|</span>
                      <button
                        type="button"
                        onClick={clearAllProductCategories}
                        className="text-[11px] font-bold text-[#5A7469] hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {categories.map((cat) => {
                      const isChecked = selectedProductCatIds.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => toggleProductCategory(cat.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'border-[#C5A059] bg-white text-[#0B241C] font-bold shadow-2xs ring-1 ring-[#C5A059]'
                              : 'border-[#E2DBD0] bg-white/70 text-[#5A7469] hover:bg-white hover:text-[#0B241C]'
                          }`}
                        >
                          <span className="text-xs truncate">{cat.title.trim()}</span>
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center transition-all shrink-0 ml-2 ${
                              isChecked ? 'bg-[#0B241C] text-white' : 'border border-[#C9BDB0]'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 text-[#C5A059]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedProductCatIds.length === 0 && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      ⚠️ Please select at least one category above so this staff member can access their assigned products page.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Inventory & Stock Access Control */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-3 pt-4 border-t border-[#EFEBE3]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-300 flex items-center justify-center text-blue-600 shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0B241C]">Inventory & Stock Access</h4>
                  <p className="text-[11px] text-[#5A7469]">
                    Control which categories this subadmin can monitor stock and inventory for.
                  </p>
                </div>
              </div>

              {/* Mode Selector Segmented Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setInventoryMode('all')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    inventoryMode === 'all'
                      ? 'border-blue-500 bg-[#0B241C] text-white shadow-sm ring-1 ring-blue-400'
                      : 'border-[#E2DBD0] bg-white text-[#2C4A3E] hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs">All Inventory</span>
                    {inventoryMode === 'all' && <Check className="w-4 h-4 text-blue-400" />}
                  </div>
                  <span className="text-[10px] opacity-80">Full stock access across all categories</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInventoryMode('specific')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    inventoryMode === 'specific'
                      ? 'border-blue-500 bg-[#0B241C] text-white shadow-sm ring-1 ring-blue-400'
                      : 'border-[#E2DBD0] bg-white text-[#2C4A3E] hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs">Specific Categories</span>
                    {inventoryMode === 'specific' && <Check className="w-4 h-4 text-blue-400" />}
                  </div>
                  <span className="text-[10px] opacity-80">
                    Restricted to {selectedInventoryCatIds.length} assigned category
                    {selectedInventoryCatIds.length === 1 ? '' : 'ies'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setInventoryMode('none')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    inventoryMode === 'none'
                      ? 'border-gray-400 bg-gray-100 text-gray-800 ring-1 ring-gray-400'
                      : 'border-[#E2DBD0] bg-white text-[#5A7469] hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs">No Inventory Access</span>
                    {inventoryMode === 'none' && <Check className="w-4 h-4 text-gray-700" />}
                  </div>
                  <span className="text-[10px] opacity-80">Hide inventory tab for this staff</span>
                </button>
              </div>

              {/* Specific Inventory Categories Picker Grid */}
              {inventoryMode === 'specific' && (
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2DBD0]">
                    <span className="text-xs font-bold text-[#0B241C] flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        Assigned Stock Categories ({selectedInventoryCatIds.length} of {categories.length} selected):
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllInventoryCategories}
                        className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-[#8BAAA0] text-xs">|</span>
                      <button
                        type="button"
                        onClick={clearAllInventoryCategories}
                        className="text-[11px] font-bold text-[#5A7469] hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {categories.map((cat) => {
                      const isChecked = selectedInventoryCatIds.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => toggleInventoryCategory(cat.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'border-blue-500 bg-white text-[#0B241C] font-bold shadow-2xs ring-1 ring-blue-400'
                              : 'border-[#E2DBD0] bg-white/70 text-[#5A7469] hover:bg-white hover:text-[#0B241C]'
                          }`}
                        >
                          <span className="text-xs truncate">{cat.title.trim()}</span>
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center transition-all shrink-0 ml-2 ${
                              isChecked ? 'bg-blue-600 text-white' : 'border border-[#C9BDB0]'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* General Administrative Modules */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-3 pt-4 border-t border-[#EFEBE3]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#0B241C]">General Administrative Modules</h4>
                  <p className="text-[11px] text-[#5A7469]">
                    Select which store management modules this staff member can access.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAllPermissions}
                  className="text-[11px] text-[#C5A059] font-bold hover:underline cursor-pointer"
                >
                  {isAllTabsSelected ? 'Deselect All' : 'Select All Modules'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#FAF9F5] border border-[#E2DBD0] max-h-56 overflow-y-auto">
                {ALL_AVAILABLE_TABS.map((tab) => {
                  const isChecked = selectedPermissions.includes(tab.id);
                  return (
                    <label
                      key={tab.id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'bg-[#0B241C] text-white border-[#0B241C]'
                          : 'bg-white text-[#2C4A3E] border-[#E2DBD0] hover:bg-gray-50'
                      }`}
                    >
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
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#EFEBE3]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E2DBD0] text-[#2C4A3E] hover:bg-gray-50 cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-[#C5A059] text-[#0B241C] font-bold shadow-md uppercase tracking-wider cursor-pointer flex items-center gap-2 hover:bg-[#D4AF37] transition"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingId ? 'Update Subadmin' : 'Save Subadmin'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}