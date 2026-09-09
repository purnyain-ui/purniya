'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Package,
  MapPin,
  Heart,
  LogOut,
  ChevronRight,
  Edit3,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  RotateCcw,
  Truck,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Address } from '../../types';

export default function AccountPage() {
  const { user, updateUser, orders, addresses, addAddress, deleteAddress, showToast, logoutUser } = useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'returns'>('orders');

  // Edit Profile modal state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profilePhone, setProfilePhone] = useState(user.phone);

  // Add Address modal state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newLabel, setNewLabel] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [newName, setNewName] = useState(user.name);
  const [newPhone, setNewPhone] = useState(user.phone);
  const [newLine, setNewLine] = useState('');
  const [newCity, setNewCity] = useState('Bengaluru');
  const [newState, setNewState] = useState('Karnataka');
  const [newPincode, setNewPincode] = useState('');

  // Return Request modal state
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('Size / fit did not meet expectations');

  // Keep state in sync with user profile
  useEffect(() => {
    setProfileName(user.name || '');
    setProfileEmail(user.email || '');
    setProfilePhone(user.phone || '');
    setNewName(user.name || '');
    setNewPhone(user.phone || '');
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('Validation Error', 'Please provide your full name.');
      return;
    }
    if (!profileEmail.trim() || !profileEmail.includes('@')) {
      showToast('Validation Error', 'Please enter a valid email address.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateUser({
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
      });
      setIsEditingProfile(false);
    } catch (err) {
      console.warn('Profile save exception:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLine || !newPincode) return;
    addAddress({
      label: newLabel,
      fullName: newName,
      phone: newPhone,
      addressLine: newLine,
      city: newCity,
      state: newState,
      pincode: newPincode,
      isDefault: addresses.length === 0,
    });
    setIsAddingAddress(false);
    setNewLine('');
    setNewPincode('');
  };

  const handleInitiateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Return Request Initiated', `Our logistics partner will schedule inspection for order ${selectedOrderForReturn}.`);
    setSelectedOrderForReturn(null);
  };

  const statusColors: Record<string, string> = {
    New: 'bg-amber-100 text-amber-800 border-amber-300',
    Processing: 'bg-blue-100 text-blue-800 border-blue-300',
    Shipped: 'bg-purple-100 text-purple-800 border-purple-300',
    'Out for Delivery': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Cancelled: 'bg-rose-100 text-rose-800 border-rose-300',
    Returned: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  if (!user.email && !user.name) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-[#E8E1D5] shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#08281F] text-[#D4AF37] mx-auto flex items-center justify-center border border-[#C5A059]">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="font-serif-title text-3xl font-bold text-[#0B241C]">
              Access Your Purnya Circle Account
            </h1>
            <p className="text-xs sm:text-sm text-[#5A7469] leading-relaxed">
              Sign in to track orders, manage bespoke delivery addresses, and enjoy privileged member benefits.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#08281F] hover:bg-[#0C3B2E] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In to Account</span>
              <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
            </Link>
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-[#08281F] text-[#08281F] hover:bg-[#FAF8F5] font-bold text-xs sm:text-sm transition-all"
            >
              Join Purnya Circle
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Title */}
      <div>
        <h1 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C]">
          My Account
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E] mt-1">
          Welcome back, {user.name || 'Patron'} · Purnya Circle Member
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 bg-white p-6 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-6 border-b border-[#EFEBE3]">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-center text-[#C5A059] font-serif-title font-bold text-lg shadow-xs">
              {user.name ? user.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="min-w-0">
              <p className="font-serif-title text-base font-bold text-[#0B241C] truncate">{user.name || 'Purnya Patron'}</p>
              <p className="text-[11px] text-[#5A7469] truncate">{user.email || 'care@purnya.in'}</p>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            {[
              { id: 'orders', label: 'Order History & Tracking', icon: <Package className="w-4 h-4" /> },
              { id: 'profile', label: 'Personal Information', icon: <User className="w-4 h-4" /> },
              { id: 'addresses', label: 'Saved Addresses', icon: <MapPin className="w-4 h-4" /> },
              { id: 'returns', label: 'Returns & Replacements', icon: <RotateCcw className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#0C3B2E] text-white font-bold shadow-sm'
                    : 'text-[#2C4A3E] hover:bg-[#EBF3EF] hover:text-[#0C3B2E]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}

            <Link
              href="/wishlist"
              className="w-full flex items-center justify-between p-3 rounded-xl text-[#2C4A3E] hover:bg-[#EBF3EF] hover:text-[#0C3B2E] transition-all"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4" />
                <span>My Wishlist</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/admin"
              className="w-full flex items-center justify-between p-3 rounded-xl text-[#0C3B2E] bg-[#FAF8F5] hover:bg-[#EBF3EF] transition-all mt-4 border border-[#E2DBD0]"
            >
              <div className="flex items-center gap-3">
                <Edit3 className="w-4 h-4 text-[#C5A059]" />
                <span>Merchant Admin</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <button
              type="button"
              onClick={logoutUser}
              className="w-full flex items-center justify-between p-3 rounded-xl text-rose-700 hover:bg-rose-50 transition-all border border-rose-200 mt-2 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Sign Out</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </nav>
        </aside>

        {/* Main Content Pane */}
        <main className="lg:col-span-9 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm min-h-[500px]">
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-[#EFEBE3]">
                <div>
                  <h2 className="font-serif-title text-xl font-bold text-[#0B241C]">Order History</h2>
                  <p className="text-xs text-[#5A7469]">Review past purchases, download invoices, and track live delivery progress.</p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Package className="w-8 h-8 text-[#C5A059] mx-auto" />
                  <p className="text-sm font-semibold text-[#0B241C]">No orders placed yet</p>
                  <Link href="/" className="inline-block px-6 py-2 rounded-full bg-[#0C3B2E] text-white text-xs font-semibold">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-5 rounded-2xl border border-[#E2DBD0] hover:border-[#0C3B2E]/60 transition-all space-y-4 bg-[#FAF8F5]/40"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EFEBE3]">
                        <div className="space-y-0.5">
                          <span className="font-serif-title font-bold text-sm text-[#0B241C]">{ord.id}</span>
                          <p className="text-[11px] text-[#5A7469]">Placed on {ord.date} · {ord.items.length} items</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${statusColors[ord.status] || 'bg-gray-100 text-gray-800'}`}>
                            {ord.status}
                          </span>
                          <Link
                            href={`/order-tracking?id=${ord.id}`}
                            className="px-4 py-1.5 rounded-full bg-[#0C3B2E] hover:bg-[#164E3D] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>Track Order</span>
                          </Link>
                        </div>
                      </div>

                      {/* Items preview */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ord.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 rounded-xl object-cover bg-[#EBF3EF] border border-[#E2DBD0]"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#0B241C] truncate">{item.name}</p>
                              <p className="text-[11px] text-[#5A7469]">Qty: {item.quantity} · ₹{item.price.toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2 text-xs border-t border-[#EFEBE3]">
                        <span className="text-[#5A7469]">Courier: {ord.courierPartner || 'BlueDart Express'} (Ref: {ord.trackingNumber})</span>
                        <span className="font-bold text-[#0B241C]">Total: ₹{ord.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-[#EFEBE3]">
                <div>
                  <h2 className="font-serif-title text-xl font-bold text-[#0B241C]">Personal Information</h2>
                  <p className="text-xs text-[#5A7469]">Manage your account details and contact preferences.</p>
                </div>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E2DBD0] hover:border-[#0C3B2E] text-xs font-semibold text-[#2C4A3E]"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>{isEditingProfile ? 'Cancel' : 'Edit Details'}</span>
                </button>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#2C4A3E]">Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:outline-none focus:border-[#0C3B2E]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#2C4A3E]">Email Address</label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:outline-none focus:border-[#0C3B2E]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#2C4A3E]">Phone Number</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:outline-none focus:border-[#0C3B2E]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-[#08281F] font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-60 transition-opacity flex items-center gap-2 cursor-pointer"
                  >
                    {isSavingProfile ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-[#08281F] border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl text-xs">
                  <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0]">
                    <span className="text-[#5A7469] block mb-1 uppercase tracking-wider">Full Name</span>
                    <p className="text-sm font-bold text-[#0B241C]">{user.name}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0]">
                    <span className="text-[#5A7469] block mb-1 uppercase tracking-wider">Email Address</span>
                    <p className="text-sm font-bold text-[#0B241C]">{user.email}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0]">
                    <span className="text-[#5A7469] block mb-1 uppercase tracking-wider">Phone Number</span>
                    <p className="text-sm font-bold text-[#0B241C]">{user.phone}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0]">
                    <span className="text-[#5A7469] block mb-1 uppercase tracking-wider">Account Tier</span>
                    <p className="text-sm font-bold text-[#C5A059]">Purnya Concierge Circle</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-[#EFEBE3]">
                <div>
                  <h2 className="font-serif-title text-xl font-bold text-[#0B241C]">Saved Addresses</h2>
                  <p className="text-xs text-[#5A7469]">Manage your residential and work shipping destinations.</p>
                </div>
                <button
                  onClick={() => setIsAddingAddress(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0C3B2E] text-white hover:bg-[#164E3D] text-xs font-semibold transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Add New Address</span>
                </button>
              </div>

              {/* Add Address Form Modal */}
              {isAddingAddress && (
                <form onSubmit={handleSaveAddress} className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] space-y-4 text-xs">
                  <div className="flex justify-between items-center font-bold text-[#0B241C]">
                    <span>New Delivery Address</span>
                    <button type="button" onClick={() => setIsAddingAddress(false)} className="text-rose-600">Cancel</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Recipient Full Name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      className="p-3 rounded-xl border border-[#E2DBD0] bg-white focus:outline-none focus:border-[#0C3B2E]"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      required
                      className="p-3 rounded-xl border border-[#E2DBD0] bg-white focus:outline-none focus:border-[#0C3B2E]"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Street Address, Building, Apartment"
                    value={newLine}
                    onChange={(e) => setNewLine(e.target.value)}
                    required
                    className="w-full p-3 rounded-xl border border-[#E2DBD0] bg-white focus:outline-none focus:border-[#0C3B2E]"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      required
                      className="p-3 rounded-xl border border-[#E2DBD0] bg-white focus:outline-none focus:border-[#0C3B2E]"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      required
                      className="p-3 rounded-xl border border-[#E2DBD0] bg-white focus:outline-none focus:border-[#0C3B2E]"
                    />
                    <input
                      type="text"
                      placeholder="PIN Code"
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      required
                      className="p-3 rounded-xl border border-[#E2DBD0] bg-white focus:outline-none focus:border-[#0C3B2E]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-[#08281F] font-bold text-xs uppercase shadow-md"
                  >
                    Save Address
                  </button>
                </form>
              )}

              {addresses.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-[#FAF8F5]/40 rounded-2xl border border-dashed border-[#E2DBD0]">
                  <MapPin className="w-8 h-8 text-[#C5A059] mx-auto opacity-70" />
                  <p className="text-sm font-semibold text-[#0B241C]">No addresses saved yet</p>
                  <p className="text-xs text-[#5A7469]">Add your preferred shipping address for faster doorstep delivery.</p>
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="inline-block px-6 py-2 rounded-full bg-[#0C3B2E] text-white text-xs font-semibold cursor-pointer shadow-xs hover:bg-[#164E3D] transition-all"
                  >
                    Add Delivery Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-5 rounded-2xl border border-[#E2DBD0] bg-[#FAF8F5]/60 relative flex flex-col justify-between space-y-3"
                    >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#0C3B2E] text-white">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold text-[#0C3B2E] bg-[#EBF3EF] px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-[#0B241C] pt-1">{addr.fullName}</p>
                      <p className="text-xs text-[#2C4A3E] leading-relaxed">
                        {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-xs text-[#5A7469]">Phone: {addr.phone}</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-[#EFEBE3]">
                      <button
                        onClick={() => deleteAddress(addr.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RETURNS */}
          {activeTab === 'returns' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#EFEBE3]">
                <h2 className="font-serif-title text-xl font-bold text-[#0B241C]">Returns & Exchanges</h2>
                <p className="text-xs text-[#5A7469]">Submit and track return or replacement requests for eligible orders within 7 days of delivery.</p>
              </div>

              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E2DBD0] text-xs text-[#2C4A3E] space-y-2">
                <p className="font-bold text-[#0B241C]">Purnya 7-Day Hassle-Free Policy</p>
                <p>
                  Items must be in unworn, unburned, and unblemished condition with all original presentation tags and packaging intact.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Eligible Recent Orders:</p>
                {orders.filter((o) => o.status === 'Delivered').map((ord) => (
                  <div key={ord.id} className="p-4 rounded-xl border border-[#E2DBD0] flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs text-[#0B241C]">{ord.id}</p>
                      <p className="text-[11px] text-[#5A7469]">Delivered · {ord.items.length} items</p>
                    </div>
                    <button
                      onClick={() => setSelectedOrderForReturn(ord.id)}
                      className="px-4 py-2 rounded-xl bg-[#0C3B2E] hover:bg-[#164E3D] text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      Request Return
                    </button>
                  </div>
                ))}
              </div>

              {selectedOrderForReturn && (
                <form onSubmit={handleInitiateReturn} className="p-5 rounded-2xl bg-white border border-[#C5A059] shadow-md space-y-4 text-xs">
                  <p className="font-bold text-sm text-[#0B241C]">Request Return for {selectedOrderForReturn}</p>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#2C4A3E]">Reason for Return / Exchange</label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#E2DBD0] bg-white focus:outline-none focus:border-[#0C3B2E]"
                    >
                      <option>Size / fit did not meet expectations</option>
                      <option>Fragrance preference / exchange for another scent</option>
                      <option>Received damaged in transit</option>
                      <option>Other / Not satisfied with finish</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-[#08281F] font-bold">
                      Submit Return Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForReturn(null)}
                      className="px-4 py-2.5 rounded-xl border border-[#E2DBD0] text-[#2C4A3E]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
