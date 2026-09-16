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
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    user,
    openAuthModal,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const code = couponInput.trim();

    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const result = applyCoupon(code);

    if (!result.success) {
      setCouponError(result.message);
      return;
    }

    setCouponError('');
    setCouponInput('');
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponError('');
    setCouponInput('');
  };

  const freeShippingThreshold = 999;
  const amountNeededForFreeShip = Math.max(
    0,
    freeShippingThreshold - cartSubtotal
  );
  const freeShipProgress = Math.min(
    100,
    (cartSubtotal / freeShippingThreshold) * 100
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C]">
          Your Shopping Cart
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E] mt-1">
          {cart.length > 0
            ? `You have ${cart.reduce(
                (sum, item) => sum + item.quantity,
                0
              )} handcrafted items waiting in your bag`
            : 'Your cart is currently empty'}
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E2DBD0] p-12 sm:p-20 text-center max-w-xl mx-auto space-y-5 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-[#FAF8F5] text-[#C5A059] flex items-center justify-center mx-auto border border-[#E2DBD0]">
            <ShoppingBag className="w-10 h-10" />
          </div>

          <h2 className="font-serif-title text-2xl font-bold text-[#0B241C]">
            Your Bag is Empty
          </h2>

          <p className="text-xs sm:text-sm text-[#2C4A3E] leading-relaxed">
            Discover our curated collections across five lifestyle worlds and
            find something timeless to elevate your space.
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
          {/* Cart items */}
          <div className="lg:col-span-8 space-y-6">
            {/* Free shipping progress */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2DBD0] shadow-sm space-y-2.5">
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <span className="flex items-center gap-2 font-semibold text-[#0B241C]">
                  <Truck className="w-4 h-4 text-[#C5A059] shrink-0" />

                  {amountNeededForFreeShip === 0 ? (
                    <span className="text-[#0C3B2E] flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      You&apos;ve unlocked FREE Express Shipping!
                    </span>
                  ) : (
                    <span>
                      Add{' '}
                      <strong className="text-[#0C3B2E]">
                        ₹{amountNeededForFreeShip.toLocaleString('en-IN')}
                      </strong>{' '}
                      more to unlock Free Shipping!
                    </span>
                  )}
                </span>

                <span className="font-bold text-[#5A7469] text-xs shrink-0">
                  {Math.round(freeShipProgress)}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-[#EBF3EF] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0C3B2E] to-[#C5A059] rounded-full transition-all duration-500"
                  style={{ width: `${freeShipProgress}%` }}
                />
              </div>
            </div>

            {/* Product list */}
            <div className="bg-white rounded-3xl border border-[#E2DBD0] divide-y divide-[#EFEBE3] shadow-sm overflow-hidden">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
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

                    <div className="space-y-1 min-w-0">
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
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(' · ')}
                        </p>
                      )}

                      <p className="text-xs font-bold text-[#0B241C]">
                        ₹{item.product.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Quantity, total and remove */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EFEBE3]">
                    <div className="flex items-center border border-[#E2DBD0] rounded-xl bg-[#FAF8F5]">
                      <button
                        type="button"
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
                        type="button"
                        onClick={() => updateCartQty(item.product.id, 1)}
                        className="p-2 text-[#2C4A3E] hover:text-[#0C3B2E]"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <p className="text-sm sm:text-base font-bold text-[#0B241C]">
                        ₹
                        {(item.product.price * item.quantity).toLocaleString(
                          'en-IN'
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-[#5A7469] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove item"
                      aria-label={`Remove ${item.product.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Link
                href="/"
                className="text-xs font-semibold text-[#2C4A3E] hover:text-[#0C3B2E] flex items-center gap-1.5"
              >
                ← Continue Browsing Collections
              </Link>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-4 min-w-0">
            <div className="bg-white p-6 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-4">
              <h3 className="font-serif-title text-lg font-bold text-[#0B241C] border-b border-[#EFEBE3] pb-3">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs sm:text-sm text-[#2C4A3E]">
                <div className="flex justify-between gap-3">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-[#0B241C]">
                    ₹{cartSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {cartDiscount > 0 && (
                  <div className="flex justify-between gap-3 text-[#0C3B2E] font-semibold">
                    <span>Promo Discount ({appliedCoupon?.code})</span>
                    <span className="shrink-0">
                      - ₹{cartDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-3">
                  <span>Shipping &amp; Handling</span>
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

              {/* Apply Coupon — below Estimated Taxes */}
              <div className="border-t border-[#EFEBE3] pt-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0B241C]">
                  <Tag className="w-4 h-4 text-[#C5A059]" />
                  <span>Apply Coupon</span>
                </div>

                {appliedCoupon ? (
                  <div className="p-3.5 rounded-xl bg-[#FAF5EA] border border-[#C5A059]/40 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#0C3B2E] shrink-0" />
                        <span className="text-xs font-bold text-[#08281F] tracking-wider uppercase break-all">
                          {appliedCoupon.code}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#2C4A3E] mt-1">
                        {appliedCoupon.description}
                      </p>

                      <p className="text-[11px] font-semibold text-[#0C3B2E] mt-1">
                        You save ₹{cartDiscount.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-semibold text-rose-600 hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <label htmlFor="cart-coupon" className="sr-only">
                      Coupon code
                    </label>

                    <div className="flex gap-2">
                      <input
                        id="cart-coupon"
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        placeholder="Enter coupon code"
                        autoComplete="off"
                        spellCheck={false}
                        aria-invalid={Boolean(couponError)}
                        aria-describedby={
                          couponError ? 'cart-coupon-error' : undefined
                        }
                        className="min-w-0 flex-1 py-3 px-3 rounded-xl border border-[#E2DBD0] text-xs uppercase tracking-wider font-semibold text-[#0B241C] placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-[#0C3B2E]"
                      />

                      <button
                        type="submit"
                        className="shrink-0 px-4 py-3 rounded-xl bg-[#0C3B2E] hover:bg-[#164E3D] text-white text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        Apply
                      </button>
                    </div>

                    {couponError && (
                      <p
                        id="cart-coupon-error"
                        role="alert"
                        className="text-[11px] text-rose-600"
                      >
                        {couponError}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-[#E2DBD0] pt-4 flex justify-between items-baseline gap-3">
                <div>
                  <p className="font-serif-title text-base font-bold text-[#0B241C]">
                    Total Payable
                  </p>
                  <p className="text-[10px] text-[#5A7469]">
                    All duties &amp; taxes included
                  </p>
                </div>

                <span className="font-serif-title text-2xl font-bold text-[#0B241C] shrink-0">
                  ₹{cartTotal.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Checkout */}
              {user?.email ? (
                <Link
                  href="/checkout"
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    openAuthModal({
                      actionType: 'order',
                      title: 'Sign In to Place Order 💎',
                      message:
                        'Please sign in to your Purnya Circle account to finalize delivery and place your order.',
                      redirectUrl: '/checkout',
                    })
                  }
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <span>Login to Place Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}