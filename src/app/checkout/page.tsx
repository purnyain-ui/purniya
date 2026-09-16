'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Plus,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  getOrdersForCustomerFromSupabase,
  getAddressesFromSupabase,
} from '../../lib/supabase';
import type { Address, Order } from '../../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type AddressOption = {
  key: string;
  address: Address;
  source: string;
};

type AddressHistory = {
  owner: string;
  options: AddressOption[];
  loading: boolean;
  error: string;
};

const NEW_ADDRESS = '__new_address__';

const emptyAddress = (): Address => ({
  id: '',
  label: 'Home',
  fullName: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  pincode: '',
});

const normalize = (value: string | undefined) =>
  (value || '').trim().toLowerCase().replace(/\s+/g, ' ');

// Compare the delivery location, not generated IDs or labels.
// Different flat/house numbers remain separate addresses.
const addressKey = (address: Address) =>
  JSON.stringify([
    normalize(address.addressLine),
    normalize(address.city),
    normalize(address.state),
    normalize(address.pincode).replace(/\s/g, ''),
  ]);

const isCompleteAddress = (
  address: Address | null | undefined
): address is Address =>
  Boolean(
    address?.addressLine?.trim() &&
      address?.city?.trim() &&
      address?.state?.trim() &&
      address?.pincode?.trim()
  );

const orderTime = (order: Order) => {
  const timestamp = Date.parse(order.date);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const inputClass =
  'w-full p-3 rounded-xl border border-[#E2DBD0] text-xs text-[#0B241C] focus:outline-none focus:border-[#0C3B2E]';

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
    placeOrder,
    showToast,
  } = useStore();

  const accountEmail = (user?.email || '').trim();
  const ownerKey = accountEmail.toLowerCase();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [shippingAddress, setShippingAddress] =
    useState<Address>(emptyAddress);

  const [selectedAddressKey, setSelectedAddressKey] =
    useState(NEW_ADDRESS);

  const [history, setHistory] = useState<AddressHistory>({
    owner: '',
    options: [],
    loading: true,
    error: '',
  });

  const [reloadAddresses, setReloadAddresses] = useState(0);
  const addressWasEdited = useRef(false);

  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const [paymentError, setPaymentError] = useState('');
  const [razorpayReady, setRazorpayReady] = useState(false);

  // Reset checkout information when the signed-in account changes.
  useEffect(() => {
    addressWasEdited.current = false;
    setCustomerName('');
    setCustomerEmail(accountEmail);
    setCustomerPhone('');
    setShippingAddress(emptyAddress());
    setSelectedAddressKey(NEW_ADDRESS);
    setConfirmedOrder(null);
    setPaymentError('');
  }, [accountEmail]);

  useEffect(() => {
    if (user?.name) {
      setCustomerName((previous) => previous || user.name);
    }
    if (user?.phone) {
      setCustomerPhone((previous) => previous || user.phone);
    }
  }, [accountEmail, user?.name, user?.phone]);

  useEffect(() => {
    if (isAuthLoading || accountEmail) return;

    showToast(
      'Sign In to Place Order 💎',
      'Please sign in to finalize delivery and place your order.',
      'info'
    );
    router.replace('/login?redirect=/checkout');
  }, [accountEmail, isAuthLoading, router, showToast]);

  // Fetch only the signed-in customer's history.
  // Do not use the store's all-orders list or unscoped cached addresses.
  useEffect(() => {
    if (isAuthLoading || !accountEmail) return;

    let cancelled = false;

    setHistory({
      owner: ownerKey,
      options: [],
      loading: true,
      error: '',
    });

    async function loadAddresses() {
      const results = await Promise.allSettled([
        getOrdersForCustomerFromSupabase(accountEmail),
        getAddressesFromSupabase(accountEmail),
      ]);

      if (cancelled) return;

      const orderResult = results[0];
      const addressResult = results[1];

      const customerOrders: Order[] =
        orderResult.status === 'fulfilled'
          ? orderResult.value || []
          : [];

      const savedAddresses: Address[] =
        addressResult.status === 'fulfilled'
          ? addressResult.value || []
          : [];

      const sortedOrders = customerOrders
        .filter(
          (order) =>
            normalize(order.customer?.email) === ownerKey &&
            isCompleteAddress(order.shippingAddress)
        )
        .sort((a, b) => orderTime(b) - orderTime(a));

      const options: AddressOption[] = [];
      const seen = new Set<string>();

      const addUnique = (address: Address, source: string) => {
        if (!isCompleteAddress(address)) return;

        const key = addressKey(address);
        if (seen.has(key)) return;

        seen.add(key);
        options.push({ key, address, source });
      };

      // Latest order first. Duplicate locations keep the newest details.
      sortedOrders.forEach((order, index) => {
        addUnique(
          {
            ...order.shippingAddress,
            fullName:
              order.shippingAddress.fullName || order.customer.name,
            phone: order.shippingAddress.phone || order.customer.phone,
          },
          index === 0
            ? 'Latest order address'
            : `Previous order · ${order.date}`
        );
      });

      // Add saved locations that were not already found in order history.
      [...savedAddresses]
        .sort(
          (a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault))
        )
        .forEach((address) => {
          addUnique(
            address,
            address.isDefault ? 'Default saved address' : 'Saved address'
          );
        });

      const incomplete =
        orderResult.status === 'rejected' ||
        addressResult.status === 'rejected' ||
        (orderResult.status === 'fulfilled' && orderResult.value == null) ||
        (addressResult.status === 'fulfilled' && addressResult.value == null);

      setHistory({
        owner: ownerKey,
        options,
        loading: false,
        error: incomplete
          ? 'Some previous addresses could not be loaded. You can retry or enter a new address.'
          : '',
      });

      // Never overwrite a selection or new address already being entered.
      if (!addressWasEdited.current) {
        const latest = options[0];

        if (latest) {
          setSelectedAddressKey(latest.key);
          setShippingAddress({ ...latest.address });
        } else {
          setSelectedAddressKey(NEW_ADDRESS);
          setShippingAddress(emptyAddress());
        }
      }
    }

    void loadAddresses();

    return () => {
      cancelled = true;
    };
  }, [accountEmail, ownerKey, isAuthLoading, reloadAddresses]);

  const addressOptions = useMemo(
    () => (history.owner === ownerKey ? history.options : []),
    [history, ownerKey]
  );

  const addressesLoading =
    history.owner !== ownerKey || history.loading;

  const selectedOption = addressOptions.find(
    (option) => option.key === selectedAddressKey
  );

  const isNewAddress = selectedAddressKey === NEW_ADDRESS;

  const selectAddress = (key: string) => {
    addressWasEdited.current = true;
    setSelectedAddressKey(key);

    if (key === NEW_ADDRESS) {
      setShippingAddress({
        ...emptyAddress(),
        fullName: customerName,
        phone: customerPhone,
      });
      return;
    }

    const option = addressOptions.find((item) => item.key === key);

    if (option) {
      setShippingAddress({ ...option.address });
    }
  };

  const updateShippingField = (
    field:
      | 'fullName'
      | 'phone'
      | 'addressLine'
      | 'city'
      | 'state'
      | 'pincode',
    value: string
  ) => {
    addressWasEdited.current = true;
    setShippingAddress((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const stopProcessing = () => {
    processingRef.current = false;
    setIsProcessing(false);
  };

  const handlePlaceOrder = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (processingRef.current) return;

    setPaymentError('');

    if (!accountEmail || !cart.length) {
      setPaymentError('Please sign in and add items before checking out.');
      return;
    }

    if (addressesLoading) {
      setPaymentError('Please wait while your addresses load.');
      return;
    }

    if (
      !customerName.trim() ||
      !customerEmail.trim() ||
      !customerPhone.trim()
    ) {
      setPaymentError('Please complete your customer information.');
      return;
    }

    const deliveryAddress: Address = {
      ...shippingAddress,
      id: isNewAddress
        ? `addr-checkout-${Date.now()}`
        : shippingAddress.id || `addr-checkout-${Date.now()}`,
      label: shippingAddress.label || 'Home',
      fullName: (shippingAddress.fullName || customerName).trim(),
      phone: (shippingAddress.phone || customerPhone).trim(),
      addressLine: shippingAddress.addressLine.trim(),
      city: shippingAddress.city.trim(),
      state: shippingAddress.state.trim(),
      pincode: shippingAddress.pincode.trim(),
    };

    if (!isCompleteAddress(deliveryAddress)) {
      setPaymentError('Please complete your shipping address.');
      return;
    }

    if (!/^[1-9]\d{5}$/.test(deliveryAddress.pincode)) {
      setPaymentError('Please enter a valid 6-digit PIN code.');
      return;
    }

    if (!razorpayReady || !window.Razorpay) {
      setPaymentError(
        'Payment gateway is still loading. Please try again in a moment.'
      );
      return;
    }

    // Keep the selected delivery details fixed throughout payment.
    const customer = {
      name: customerName.trim(),
      email: customerEmail.trim(),
      phone: customerPhone.trim(),
    };

    processingRef.current = true;
    setIsProcessing(true);

    let orderFinalized = false;

    try {
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartTotal,
          receipt: `purnya_${Date.now()}`,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(
          orderData.error || 'Could not initiate payment. Please try again.'
        );
      }

      const { order } = orderData;

      const options = {
        key:
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          'rzp_test_TJeWi2eGUrJwHC',
        amount: order.amount,
        currency: order.currency,
        name: 'Purnya',
        description: `Order payment · ${cart.length} item${
          cart.length > 1 ? 's' : ''
        }`,
        image: '/logoicon.png',
        order_id: order.id,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },
        notes: {
          address: `${deliveryAddress.addressLine}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.pincode}`,
        },
        theme: { color: '#0C3B2E' },

        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          if (orderFinalized) return;

          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              setPaymentError(
                'Payment could not be verified. If money was deducted, contact support with payment ID: ' +
                  response.razorpay_payment_id
              );
              stopProcessing();
              return;
            }

            if (orderFinalized) return;
            orderFinalized = true;

            const newOrder = placeOrder({
              customer,
              shippingAddress: deliveryAddress,
              paymentMethod: verifyData.paymentMethod,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });

            setConfirmedOrder(newOrder);
            stopProcessing();
          } catch {
            setPaymentError(
              'Payment verification or order confirmation failed. If money was deducted, contact support with payment ID: ' +
                response.razorpay_payment_id
            );
            stopProcessing();
          }
        },

        modal: {
          ondismiss: stopProcessing,
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on(
        'payment.failed',
        (response: { error?: { description?: string } }) => {
          setPaymentError(
            response?.error?.description || 'Payment failed. Please try again.'
          );
          stopProcessing();
        }
      );

      razorpay.open();
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : 'Something went wrong while starting payment.'
      );
      stopProcessing();
    }
  };

  if (isAuthLoading || !accountEmail) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-12 border border-[#E8E1D5] shadow-sm flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
          <p className="font-serif-title text-base font-bold text-[#0B241C]">
            Preparing your checkout...
          </p>
        </div>
      </div>
    );
  }

  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
            Payment Successful &amp; Verified
          </span>
          <h1 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C]">
            Thank You For Your Order!
          </h1>
          <p className="text-sm text-[#2C4A3E]">
            Your order has been confirmed.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm text-left space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-[#EFEBE3] pb-4">
            <div>
              <p className="text-xs text-[#5A7469]">Order Number</p>
              <p className="font-serif-title text-xl font-bold text-[#0B241C]">
                {confirmedOrder.id}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#5A7469]">Estimated Delivery</p>
              <p className="text-sm font-semibold text-[#0C3B2E]">
                {confirmedOrder.estimatedDelivery}
              </p>
            </div>
          </div>

          <div className="text-xs text-[#2C4A3E] space-y-1">
            <p className="font-bold text-[#0B241C]">Delivery Address</p>
            <p>{confirmedOrder.shippingAddress.fullName}</p>
            <p>{confirmedOrder.shippingAddress.addressLine}</p>
            <p>
              {confirmedOrder.shippingAddress.city},{' '}
              {confirmedOrder.shippingAddress.state} –{' '}
              {confirmedOrder.shippingAddress.pincode}
            </p>
            <p>{confirmedOrder.shippingAddress.phone}</p>
          </div>

          <div className="space-y-3 border-t border-[#EFEBE3] pt-4">
            {confirmedOrder.items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#0B241C] truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[#5A7469]">
                    Qty: {item.quantity} · ₹
                    {item.price.toLocaleString('en-IN')}
                  </p>
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

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href={`/order-tracking?id=${confirmedOrder.id}`}
            className="px-8 py-3 rounded-full bg-[#C5A059] text-[#08281F] font-bold text-xs"
          >
            Track Shipment Progress
          </Link>
          <Link
            href="/"
            className="px-8 py-3 rounded-full bg-white border border-[#E2DBD0] text-[#0B241C] font-semibold text-xs"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif-title text-2xl font-bold text-[#0B241C]">
          No Items to Checkout
        </h2>
        <p className="text-sm text-[#2C4A3E]">
          Your bag is currently empty. Please add items to proceed.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-full bg-[#0C3B2E] text-white text-xs font-semibold"
        >
          Explore Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setRazorpayReady(true)}
        onError={() => {
          setRazorpayReady(false);
          setPaymentError(
            'Payment gateway could not load. Please refresh and try again.'
          );
        }}
      />

      <div>
        <h1 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C]">
          Secure Checkout
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E] mt-1 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0C3B2E]" />
          Official Purnya.in Store
        </p>
      </div>

      <form
        onSubmit={handlePlaceOrder}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
      >
        <fieldset
          disabled={isProcessing}
          className="lg:col-span-8 min-w-0 space-y-6 disabled:opacity-70"
        >
          {/* Customer information */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-4">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C] border-b border-[#EFEBE3] pb-3">
              1. Customer Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label htmlFor="customer-name" className="font-semibold text-[#2C4A3E]">
                  Full Name
                </label>
                <input
                  id="customer-name"
                  required
                  autoComplete="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="customer-email" className="font-semibold text-[#2C4A3E]">
                  Email Address
                </label>
                <input
                  id="customer-email"
                  type="email"
                  required
                  readOnly
                  value={customerEmail}
                  className={`${inputClass} bg-[#FAF8F5]`}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="customer-phone" className="font-semibold text-[#2C4A3E]">
                  Phone Number
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-4">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C] border-b border-[#EFEBE3] pb-3">
              2. Shipping Address
            </h2>

            {addressesLoading ? (
              <div className="flex items-center gap-3 py-4 text-sm text-[#5A7469]">
                <div className="w-5 h-5 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
                Loading your previous addresses...
              </div>
            ) : (
              <>
                {history.error && (
                  <div role="alert" className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs space-y-2">
                    <p>{history.error}</p>
                    <button
                      type="button"
                      onClick={() => setReloadAddresses((value) => value + 1)}
                      className="font-bold underline"
                    >
                      Retry loading addresses
                    </button>
                  </div>
                )}

                {addressOptions.length > 0 ? (
                  <div className="space-y-2">
                    <label
                      htmlFor="delivery-address"
                      className="text-xs font-semibold text-[#2C4A3E]"
                    >
                      Select Delivery Address
                    </label>

                    <select
                      id="delivery-address"
                      value={selectedAddressKey}
                      onChange={(e) => selectAddress(e.target.value)}
                      className={`${inputClass} bg-white`}
                    >
                      {addressOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                       {option.address.addressLine},{' '}
                          {option.address.city}, {option.address.state} –{' '}
                          {option.address.pincode}
                        </option>
                      ))}
                      <option value={NEW_ADDRESS}>+ Add New Address</option>
                    </select>

                    <p className="text-[11px] text-[#5A7469]">
                      Repeated delivery locations appear only once.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#5A7469]">
                    Enter your delivery address below.
                  </p>
                )}

                {!isNewAddress && selectedOption ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#C5A059]/40 flex gap-3">
                      <MapPin className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
                      <div className="text-xs text-[#2C4A3E] space-y-1">
                        <p className="font-bold text-[#0C3B2E]">
                          {selectedOption.source}
                        </p>
                        <p className="font-semibold">
                          {shippingAddress.fullName || customerName}
                        </p>
                        <p>{shippingAddress.addressLine}</p>
                        <p>
                          {shippingAddress.city}, {shippingAddress.state} –{' '}
                          {shippingAddress.pincode}
                        </p>
                        <p>{shippingAddress.phone || customerPhone}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => selectAddress(NEW_ADDRESS)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#0C3B2E] text-[#0C3B2E] text-xs font-semibold hover:bg-[#EBF3EF]"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <p className="font-semibold text-[#0C3B2E]">
                      New Delivery Address
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="recipient-name" className="font-semibold text-[#2C4A3E]">
                          Recipient Name
                        </label>
                        <input
                          id="recipient-name"
                          required
                          autoComplete="shipping name"
                          value={shippingAddress.fullName}
                          onChange={(e) =>
                            updateShippingField('fullName', e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="recipient-phone" className="font-semibold text-[#2C4A3E]">
                          Delivery Phone Number
                        </label>
                        <input
                          id="recipient-phone"
                          type="tel"
                          required
                          autoComplete="shipping tel"
                          value={shippingAddress.phone}
                          onChange={(e) =>
                            updateShippingField('phone', e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="street-address" className="font-semibold text-[#2C4A3E]">
                        Street Address &amp; Landmark
                      </label>
                      <textarea
                        id="street-address"
                        required
                        rows={3}
                        autoComplete="shipping street-address"
                        value={shippingAddress.addressLine}
                        onChange={(e) =>
                          updateShippingField('addressLine', e.target.value)
                        }
                        placeholder="House/flat number, building, street, area, landmark"
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="shipping-city" className="font-semibold text-[#2C4A3E]">
                          City
                        </label>
                        <input
                          id="shipping-city"
                          required
                          autoComplete="shipping address-level2"
                          value={shippingAddress.city}
                          onChange={(e) =>
                            updateShippingField('city', e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="shipping-state" className="font-semibold text-[#2C4A3E]">
                          State
                        </label>
                        <input
                          id="shipping-state"
                          required
                          autoComplete="shipping address-level1"
                          value={shippingAddress.state}
                          onChange={(e) =>
                            updateShippingField('state', e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="shipping-pin" className="font-semibold text-[#2C4A3E]">
                          PIN Code
                        </label>
                        <input
                          id="shipping-pin"
                          required
                          inputMode="numeric"
                          autoComplete="shipping postal-code"
                          pattern="[1-9][0-9]{5}"
                          maxLength={6}
                          title="Enter a valid 6-digit PIN code"
                          value={shippingAddress.pincode}
                          onChange={(e) =>
                            updateShippingField(
                              'pincode',
                              e.target.value.replace(/\D/g, '').slice(0, 6)
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </fieldset>

        {/* Order review */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-4">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C] border-b border-[#EFEBE3] pb-3">
              Order Review ({cart.length} items)
            </h2>

            <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-[#EFEBE3]">
              {cart.map((item, index) => (
                <div
                  key={`${item.product.id}-${index}`}
                  className="pt-3 first:pt-0 flex items-center gap-3"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-xl object-cover bg-[#EBF3EF] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#0B241C] truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-[#5A7469]">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#0B241C]">
                    ₹
                    {(item.product.price * item.quantity).toLocaleString(
                      'en-IN'
                    )}
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
                <div className="flex justify-between gap-3 text-[#0C3B2E] font-semibold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span className="shrink-0">
                    - ₹{cartDiscount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {cartShipping === 0
                    ? 'FREE'
                    : `₹${cartShipping.toLocaleString('en-IN')}`}
                </span>
              </div>

              <div className="flex justify-between text-[11px] text-[#5A7469]">
                <span>Estimated Taxes</span>
                <span>Included</span>
              </div>

              <div className="border-t border-[#E2DBD0] pt-3 flex justify-between font-serif-title text-base font-bold text-[#0B241C]">
                <span>Total Amount</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {paymentError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{paymentError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing || addressesLoading || !razorpayReady}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                {isProcessing
                  ? 'Processing...'
                  : addressesLoading
                  ? 'Loading Addresses...'
                  : !razorpayReady
                  ? 'Loading Payment Gateway...'
                  : `Pay & Place Order · ₹${cartTotal.toLocaleString('en-IN')}`}
              </span>
            </button>

            <p className="text-[11px] text-[#5A7469] flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
              <span>
                Choose UPI, Card, Netbanking or Wallet securely inside
                Razorpay&apos;s checkout.
              </span>
            </p>

            <p className="text-[10px] text-center text-[#5A7469]">
              By placing your order, you agree to Purnya&apos;s{' '}
              <Link href="/terms" className="underline">
                terms of service
              </Link>{' '}
              and{' '}
              <Link href="/return-policy#shipping" className="underline">
                shipping policies
              </Link>
              .
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}