'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,

  Tag,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function CartPage() {
  const {
    cart,
    updateCartQty,
    removeFromCart,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTotal,
    applyCoupon,
    removeCoupon,
    user,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError('');
      setCouponInput('');
    }
  };

  const freeShippingThreshold = 999;
  const amountNeededForFreeShip = Math.max(0, freeShippingThreshold - cartSubtotal);
  const freeShipProgress = Math.min(100, (cartSubtotal / freeShippingThreshold) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C]">
          Your Shopping Cart
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E] mt-1">
          {cart.length > 0
            ? `You have ${cart.reduce((s, i) => s + i.quantity, 0)} handcrafted items waiting in your bag`
            : 'Your cart is currently empty'}
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E2DBD0] p-12 sm:p-20 text-center max-w-xl mx-auto space-y-5 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-[#FAF8F5] text-[#C5A059] flex items-center justify-center mx-auto border border-[#E2DBD0]">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="font-serif-title text-2xl font-bold text-[#0B241C]">Your Bag is Empty</h2>
          <p className="text-xs sm:text-sm text-[#2C4A3E] leading-relaxed">
            Discover our curated collections across five lifestyle worlds and find something timeless to elevate your space.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
          >
            <span>Explore Collections</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Cart Items List */}
          <div className="lg:col-span-8 space-y-6">
            {/* Free Shipping Progress Indicator */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2DBD0] shadow-sm space-y-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="flex items-center gap-2 font-semibold text-[#0B241C]">
                  <Truck className="w-4 h-4 text-[#C5A059]" />
                  {amountNeededForFreeShip === 0 ? (
                    <span className="text-[#0C3B2E] flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> You've unlocked FREE Express Shipping!
                    </span>
                  ) : (
                    <span>
                      Add <strong className="text-[#0C3B2E]">₹{amountNeededForFreeShip.toLocaleString('en-IN')}</strong> more to unlock Free Shipping!
                    </span>
                  )}
                </span>
                <span className="font-bold text-[#5A7469] text-xs">{Math.round(freeShipProgress)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EBF3EF] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0C3B2E] to-[#C5A059] rounded-full transition-all duration-500"
                  style={{ width: `${freeShipProgress}%` }}
                />
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-3xl border border-[#E2DBD0] divide-y divide-[#EFEBE3] shadow-sm overflow-hidden">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Product Details */}
                  <div className="flex items-center gap-4 flex-1">
                    <Link
                      href={`/product/${item.product.id}`}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#EBF3EF] shrink-0 border border-[#E2DBD0]"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                        {item.product.category}
                      </p>
                      <Link
                        href={`/product/${item.product.id}`}
                        className="font-serif-title text-sm sm:text-base font-bold text-[#0B241C] hover:text-[#0C3B2E] transition-colors line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      {item.selectedVariant && (
                        <p className="text-xs text-[#5A7469]">
                          {Object.entries(item.selectedVariant)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </p>
                      )}
                      <p className="text-xs font-bold text-[#0B241C]">
                        ₹{item.product.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Quantity & Line Total */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EFEBE3]">
                    {/* Qty Button */}
                    <div className="flex items-center border border-[#E2DBD0] rounded-xl bg-[#FAF8F5]">
                      <button
                        onClick={() => updateCartQty(item.product.id, -1)}
                        className="p-2 text-[#2C4A3E] hover:text-[#0C3B2E]"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-[#0B241C]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.product.id, 1)}
                        className="p-2 text-[#2C4A3E] hover:text-[#0C3B2E]"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total */}
                    <div className="text-right min-w-[80px]">
                      <p className="text-sm sm:text-base font-bold text-[#0B241C]">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-[#5A7469] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Back to Shopping */}
            <div className="flex justify-between items-center pt-2">
              <Link
                href="/"
                className="text-xs font-semibold text-[#2C4A3E] hover:text-[#0C3B2E] flex items-center gap-1.5"
              >
                ← Continue Browsing Collections
              </Link>
            </div>
          </div>

          {/* Right: Order Summary & Coupon */}
          <div className="lg:col-span-4 space-y-6">
            {/* Coupon Box */}
            <div className="bg-white p-6 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0B241C]">
                <Tag className="w-4 h-4 text-[#C5A059]" />
                <span>Apply Promo Code</span>
              </div>

              {appliedCoupon ? (
                <div className="p-3.5 rounded-xl bg-[#FAF5EA] border border-[#C5A059]/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#08281F] tracking-wider uppercase">
                      {appliedCoupon.code}
                    </span>
                    <p className="text-[11px] text-[#2C4A3E]">{appliedCoupon.description}</p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. PURNYA10"
                      className="flex-1 py-2 px-3.5 rounded-xl border border-[#E2DBD0] text-xs uppercase tracking-wider font-semibold focus:outline-none focus:border-[#0C3B2E]"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#0C3B2E] hover:bg-[#164E3D] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-rose-600">{couponError}</p>}
                  <p className="text-[11px] text-[#5A7469]">
                    Try: <span className="font-bold text-[#0B241C]">PURNYA10</span> or{' '}
                    <span className="font-bold text-[#0B241C]">FESTIVE20</span>
                  </p>
                </form>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white p-6 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-4">
              <h3 className="font-serif-title text-lg font-bold text-[#0B241C] border-b border-[#EFEBE3] pb-3">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs sm:text-sm text-[#2C4A3E]">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-[#0B241C]">
                    ₹{cartSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {cartDiscount > 0 && (
                  <div className="flex justify-between text-[#0C3B2E] font-semibold">
                    <span>Promo Discount ({appliedCoupon?.code})</span>
                    <span>- ₹{cartDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping & Handling</span>
                  <span>
                    {cartShipping === 0 ? (
                      <span className="font-bold text-[#0C3B2E]">FREE</span>
                    ) : (
                      `₹${cartShipping.toLocaleString('en-IN')}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-[#5A7469]">
                  <span>Estimated Taxes</span>
                  <span>Included</span>
                </div>
              </div>

              <div className="border-t border-[#E2DBD0] pt-4 flex justify-between items-baseline">
                <div>
                  <p className="font-serif-title text-base font-bold text-[#0B241C]">Total Payable</p>
                  <p className="text-[10px] text-[#5A7469]">All duties & taxes included</p>
                </div>
                <span className="font-serif-title text-2xl font-bold text-[#0B241C]">
                  ₹{cartTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <Link
                href={user?.email ? "/checkout" : "/login"}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <span>{user?.email ? 'Proceed to Checkout' : 'Login to Purchase'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
