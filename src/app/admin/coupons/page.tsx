'use client';

import React, { useState } from 'react';
import { Ticket, Plus, Tag, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { Coupon } from '../../../types';

export default function AdminCouponsPage() {
  const { coupons, addCoupon, toggleCoupon } = useStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
  const [newValue, setNewValue] = useState(15);
  const [newMinOrder, setNewMinOrder] = useState(1499);
  const [newDesc, setNewDesc] = useState('');

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    addCoupon({
      code: newCode.trim().toUpperCase(),
      discountType: newType,
      discountValue: Number(newValue),
      minOrderValue: Number(newMinOrder),
      isActive: true,
      description: newDesc || `${newValue}${newType === 'percentage' ? '%' : '₹'} off orders above ₹${newMinOrder}`,
      usageCount: 0,
    });

    setIsCreateModalOpen(false);
    setNewCode('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Offers & Discount Coupons
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Create promotional campaigns, configure percentage or flat discounts, and manage coupon codes (SOW Section 16).
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <div
            key={coupon.code}
            className={`p-6 rounded-3xl border transition-all bg-white shadow-sm flex flex-col justify-between space-y-4 ${
              coupon.isActive ? 'border-[#E2DBD0]' : 'border-gray-200 opacity-60'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#EBF3EF] text-[#C5A059] border border-[#E2DBD0]">
                  {coupon.code}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    coupon.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h3 className="font-serif-title text-xl font-bold text-[#0B241C]">
                {coupon.discountType === 'percentage'
                  ? `${coupon.discountValue}% OFF`
                  : `Flat ₹${coupon.discountValue} OFF`}
              </h3>
              <p className="text-xs text-[#2C4A3E]">{coupon.description}</p>
            </div>

            <div className="border-t border-[#EFEBE3] pt-4 flex items-center justify-between text-xs">
              <span className="text-[#5A7469]">
                Min Order: <strong>₹{coupon.minOrderValue.toLocaleString('en-IN')}</strong>
              </span>

              <button
                onClick={() => toggleCoupon(coupon.code)}
                className="text-xs font-bold text-[#C5A059] hover:underline"
              >
                {coupon.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Coupon Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreateCoupon}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 border border-[#E2DBD0] shadow-2xl text-xs"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#EFEBE3]">
              <h3 className="font-serif-title text-lg font-bold text-[#0B241C]">
                Create Discount Coupon
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[#5A7469] hover:text-[#0B241C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Promo Code</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. LUXURY15, DIWALI500"
                className="w-full p-3 rounded-xl border border-[#E2DBD0] uppercase font-bold text-[#0B241C]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Discount Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] bg-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#2C4A3E]">Discount Value</label>
                <input
                  type="number"
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-[#E2DBD0]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Minimum Order Value (₹)</label>
              <input
                type="number"
                required
                value={newMinOrder}
                onChange={(e) => setNewMinOrder(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-[#E2DBD0]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Customer Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="e.g. 15% off your entire cart"
                className="w-full p-3 rounded-xl border border-[#E2DBD0]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#EFEBE3]">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E2DBD0] text-[#2C4A3E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-[#C5A059] text-[#0B241C] font-bold shadow-md uppercase tracking-wider"
              >
                Create Coupon
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
