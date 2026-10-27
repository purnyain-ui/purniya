// lib/pricing.ts
// Cart pricing rules shared by the storefront (StoreContext) and the server
// (create-order route), so the amount charged always matches the bag.

import type { Coupon } from '../types';

export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_FEE = 99;

/** Returns why a coupon can't be used right now, or null if it can. */
export function getCouponProblem(coupon: Coupon, subtotal: number, now = new Date()): string | null {
  if (!coupon.isActive) {
    return 'Invalid or inactive coupon code.';
  }
  if (subtotal < coupon.minOrderValue) {
    return `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`;
  }
  if (coupon.validFrom && new Date(coupon.validFrom) > now) {
    return `This coupon will be active starting ${new Date(coupon.validFrom).toLocaleDateString('en-IN')}.`;
  }
  if (coupon.validUntil && new Date(coupon.validUntil) < now) {
    return 'This promo code has expired.';
  }
  if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
    return 'This coupon has reached its maximum redemption limit.';
  }
  return null;
}

export function getCouponDiscount(coupon: Coupon | null, subtotal: number): number {
  if (!coupon) return 0;
  if (subtotal < coupon.minOrderValue) return 0;
  if (coupon.discountType === 'percentage') {
    const calculated = Math.round((subtotal * coupon.discountValue) / 100);
    return coupon.maxDiscount ? Math.min(calculated, coupon.maxDiscount) : calculated;
  }
  return Math.min(coupon.discountValue, subtotal);
}

export function getShippingFee(subtotal: number, itemCount: number): number {
  if (itemCount === 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export function getOrderTotal(subtotal: number, discount: number, shipping: number): number {
  return Math.max(0, subtotal - discount + shipping);
}

/** Amounts in rupees can carry float noise; compare them in paise. */
export function sameAmount(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100);
}
