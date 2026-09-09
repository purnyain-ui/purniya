'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Address, Order } from '../../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTotal,
    appliedCoupon,
    user,
    isAuthLoading,
    addresses,
    placeOrder,
    showToast,
  } = useStore();

  const [customerName, setCustomerName] = useState(user.name || '');
  const [customerEmail, setCustomerEmail] = useState(user.email || '');
  const [customerPhone, setCustomerPhone] = useState(user.phone || '');

  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
  const [addressLine, setAddressLine] = useState(defaultAddr?.addressLine || '');
  const [city, setCity] = useState(defaultAddr?.city || '');
  const [state, setState] = useState(defaultAddr?.state || '');
  const [pincode, setPincode] = useState(defaultAddr?.pincode || '');

  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [razorpayReady, setRazorpayReady] = useState(false);

  // Sync user details when auth finishes hydrating
  useEffect(() => {
    if (user?.name) setCustomerName((prev) => prev || user.name);
    if (user?.email) setCustomerEmail((prev) => prev || user.email);
    if (user?.phone) setCustomerPhone((prev) => prev || user.phone);
  }, [user]);

  useEffect(() => {
    if (defaultAddr) {
      setAddressLine((prev) => prev || defaultAddr.addressLine || '');
      setCity((prev) => prev || defaultAddr.city || '');
      setState((prev) => prev || defaultAddr.state || '');
      setPincode((prev) => prev || defaultAddr.pincode || '');
    }
  }, [defaultAddr]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user?.email) {
      showToast('Sign In to Place Order 💎', 'Please sign in to finalize delivery and place your order.', 'info');
      router.push('/login?redirect=/checkout');
    }
  }, [user?.email, isAuthLoading, router, showToast]);

  if (isAuthLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="bg-white rounded-3xl p-12 border border-[#E8E1D5] shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
          <p className="font-serif-title text-base font-bold text-[#0B241C]">Preparing your checkout...</p>
        </div>
      </div>
    );
  }

  const finalizeOrder = (paymentMeta: {
    paymentMethod: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }) => {
    const shippingAddress: Address = {
      id: 'addr-checkout',
      label: 'Home',
      fullName: customerName,
      phone: customerPhone,
      addressLine,
      city,
      state,
      pincode,
    };

    const newOrder = placeOrder({
      customer: { name: customerName, email: customerEmail, phone: customerPhone },
      shippingAddress,
      paymentMethod: paymentMeta.paymentMethod,
      razorpayPaymentId: paymentMeta.razorpayPaymentId,
      razorpayOrderId: paymentMeta.razorpayOrderId,
      razorpaySignature: paymentMeta.razorpaySignature,
    } as any);

    setConfirmedOrder(newOrder);
    setIsProcessing(false);
  };

  const handleRazorpayPayment = async () => {
    setPaymentError('');

    if (!razorpayReady || typeof window === 'undefined' || !window.Razorpay) {
      setPaymentError('Payment gateway is still loading — please try again in a moment.');
      setIsProcessing(false);
      return;
    }

    try {
      // Amount is created and verified server-side — never trust a client-supplied total.
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartTotal,
          receipt: `purnya_${Date.now()}`,
        }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        setPaymentError(orderData.error || 'Could not initiate payment. Please try again.');
        setIsProcessing(false);
        return;
      }

      const { order } = orderData;

      const options: any = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TJeWi2eGUrJwHC',
        amount: order.amount,
        currency: order.currency,
        name: 'Purnya',
        description: `Order payment · ${cart.length} item${cart.length > 1 ? 's' : ''}`,
        image: '/purnya-logo.png',
        order_id: order.id,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        notes: {
          address: `${addressLine}, ${city}, ${state} ${pincode}`,
        },
        theme: {
          color: '#0C3B2E',
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              setPaymentError(
                'Payment could not be verified. If money was deducted, please contact support with your payment ID: ' +
                  response.razorpay_payment_id
              );
              setIsProcessing(false);
              return;
            }

            finalizeOrder({
              paymentMethod: verifyData.paymentMethod, // e.g. "UPI", "Card", "Netbanking" — decided inside Razorpay's checkout
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
          } catch {
            setPaymentError('Payment verification failed. Please contact support if money was deducted.');
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        setPaymentError(resp?.error?.description || 'Payment failed. Please try again.');
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      setPaymentError(err?.message || 'Something went wrong while starting payment.');
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    setIsProcessing(true);
    handleRazorpayPayment();
  };

  // Order Confirmed View
  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in-50">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
            Payment Successful & Verified
          </span>
          <h1 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C]">
            Thank You For Your Order!
          </h1>
          <p className="text-sm text-[#2C4A3E]">
            Your order confirmation has been sent to <strong className="text-[#0B241C]">{confirmedOrder.customer.email}</strong>
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm text-left space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-[#EFEBE3] gap-2">
            <div>
              <p className="text-xs text-[#5A7469]">Order Number</p>
              <p className="font-serif-title text-xl font-bold text-[#0B241C]">{confirmedOrder.id}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-[#5A7469]">Estimated Delivery</p>
              <p className="text-sm font-semibold text-[#0C3B2E]">{confirmedOrder.estimatedDelivery}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Ordered Items</p>
            {confirmedOrder.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover bg-[#EBF3EF] border border-[#E2DBD0]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#0B241C] truncate">{item.name}</p>
                  <p className="text-[11px] text-[#5A7469]">Qty: {item.quantity} · ₹{item.price.toLocaleString('en-IN')}</p>
                </div>
                <span className="text-xs font-bold text-[#0B241C]">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#EFEBE3] pt-3 flex justify-between text-sm font-bold text-[#0B241C]">
            <span>Total Paid ({confirmedOrder.paymentMethod})</span>
            <span>₹{confirmedOrder.total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href={`/order-tracking?id=${confirmedOrder.id}`}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
          >
            Track Shipment Progress
          </Link>
          <Link
            href="/"
            className="px-8 py-3.5 rounded-full bg-white hover:bg-[#FAF8F5] text-[#0B241C] border border-[#E2DBD0] font-semibold text-xs uppercase tracking-wider transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif-title text-2xl font-bold text-[#0B241C]">No Items to Checkout</h2>
        <p className="text-sm text-[#2C4A3E]">Your bag is currently empty. Please add items to proceed with checkout.</p>
        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-full bg-[#0C3B2E] text-white text-xs font-semibold uppercase tracking-wider"
        >
          Explore Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Razorpay checkout script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayReady(true)}
      />

      {/* Title */}
      <div>
        <h1 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C]">
          Secure Checkout
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E] mt-1 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0C3B2E]" />
          <span>256-bit encrypted checkout · Official Purnya.in Store</span>
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Form: Details, Shipping, Payment */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Customer Information */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-4">
            <h3 className="font-serif-title text-lg font-bold text-[#0B241C] border-b border-[#EFEBE3] pb-3">
              1. Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#2C4A3E]">Full Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:outline-none focus:border-[#0C3B2E]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-[#2C4A3E]">Email Address</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:outline-none focus:border-[#0C3B2E]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-[#2C4A3E]">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:outline-none focus:border-[#0C3B2E]"
                />
              </div>
            </div>
          </div>

          {/* 2. Shipping Address */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-4">
            <h3 className="font-serif-title text-lg font-bold text-[#0B241C] border-b border-[#EFEBE3] pb-3">
              2. Delivery Address
            </h3>
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#2C4A3E]">Street Address & Landmark</label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Apartment, building, street, area"
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:outline-none focus:border-[#0C3B2E]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#2C4A3E]">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:outline-none focus:border-[#0C3B2E]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#2C4A3E]">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:outline-none focus:border-[#0C3B2E]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#2C4A3E]">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:outline-none focus:border-[#0C3B2E]"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-4 sticky top-28">
            <h3 className="font-serif-title text-lg font-bold text-[#0B241C] border-b border-[#EFEBE3] pb-3">
              Order Review ({cart.length} items)
            </h3>

            <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-[#EFEBE3]">
              {cart.map((item) => (
                <div key={item.product.id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-xl object-cover bg-[#EBF3EF] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#0B241C] truncate">{item.product.name}</p>
                    <p className="text-[11px] text-[#5A7469]">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-[#0B241C]">
                    ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#E2DBD0] pt-4 space-y-2 text-xs text-[#2C4A3E]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-[#0C3B2E] font-semibold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>- ₹{cartDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{cartShipping === 0 ? 'FREE' : `₹${cartShipping}`}</span>
              </div>
              <div className="border-t border-[#E2DBD0] pt-3 flex justify-between font-serif-title text-base font-bold text-[#0B241C]">
                <span>Total Amount</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {paymentError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{paymentError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>
                {!user?.email
                  ? 'Login to Purchase'
                  : isProcessing
                  ? 'Processing...'
                  : `Pay & Place Order · ₹${cartTotal.toLocaleString('en-IN')}`}
              </span>
            </button>

            <p className="text-[11px] text-[#5A7469] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>You'll choose UPI, Card, Netbanking or Wallet securely inside Razorpay's checkout.</span>
            </p>

            <p className="text-[10px] text-center text-[#5A7469]">
              By clicking "Pay & Place Order", you agree to Purnya's terms of service and shipping policies.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}