'use client';

import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  FileText,
  Sliders,
  Settings,
  Send,
  ExternalLink,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { Order } from '../../../types';

export default function AdminShippingPage() {
  const { orders, updateOrderStatus, showToast } = useStore();

  // Shipping Rules State
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(999);
  const [standardRate, setStandardRate] = useState<number>(99);
  const [expressRate, setExpressRate] = useState<number>(199);
  const [codSurcharge, setCodSurcharge] = useState<number>(49);
  const [warehouseCity, setWarehouseCity] = useState('Mumbai, Maharashtra');
  const [warehousePincode, setWarehousePincode] = useState('400001');

  // Pincode Lookup Tester
  const [checkPincode, setCheckPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<{
    serviceable: boolean;
    tat: string;
    codAvailable: boolean;
    courier: string;
  } | null>(null);

  // Couriers list
  const [couriers, setCouriers] = useState([
    {
      id: 'bluedart',
      name: 'BlueDart Express',
      tier: 'Primary Air & Express',
      status: 'Active',
      trackingPrefix: 'BD-',
      avgDeliveryDays: '2 - 3 Days',
      coverage: '28,000+ Pincodes',
    },
    {
      id: 'delhivery',
      name: 'Delhivery Surface & Air',
      tier: 'Standard & Bulk Surface',
      status: 'Active',
      trackingPrefix: 'DEL-',
      avgDeliveryDays: '3 - 5 Days',
      coverage: '19,000+ Pincodes',
    },
    {
      id: 'dtdc',
      name: 'DTDC Courier',
      tier: 'Secondary Backup',
      status: 'Standby',
      trackingPrefix: 'DTDC-',
      avgDeliveryDays: '4 - 6 Days',
      coverage: '14,000+ Pincodes',
    },
    {
      id: 'indiapost',
      name: 'India Post Speed Post',
      tier: 'Remote & Northeast Regions',
      status: 'Active',
      trackingPrefix: 'EM-',
      avgDeliveryDays: '5 - 7 Days',
      coverage: 'Pan-India All Postal Codes',
    },
  ]);

  const pendingOrders = orders.filter((o) => o.status === 'New' || o.status === 'Processing');
  const shippedOrders = orders.filter((o) => o.status === 'Shipped' || o.status === 'Out for Delivery');

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPincode || checkPincode.length !== 6) {
      showToast('Validation Error', 'Please enter a valid 6-digit Indian pincode.');
      return;
    }
    // Simulate lookup
    const isRemote = checkPincode.startsWith('7') || checkPincode.startsWith('19');
    setPincodeResult({
      serviceable: true,
      tat: isRemote ? '5 - 7 Business Days' : '2 - 4 Business Days',
      codAvailable: !isRemote,
      courier: isRemote ? 'India Post Speed Post' : 'BlueDart Express',
    });
    showToast('Pincode Verified', `Delivery available to pincode ${checkPincode}.`);
  };

  const handleGenerateAWB = (ord: Order) => {
    const awb = `BD${Date.now().toString().slice(-8)}`;
    updateOrderStatus(ord.id, 'Shipped', awb, 'BlueDart Express');
    showToast('AWB Generated', `Air Waybill ${awb} generated for Order ${ord.id}.`);
  };

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Rules Saved', 'Shipping rates and threshold configuration updated.');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
          Shipping & Logistics Integration
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E]">
          Configure shipping rate tiers, courier partner integrations, consignment dispatch manifests, and tracking updates (SOW Section 15 & 19).
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Ready for Dispatch</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            {pendingOrders.length}
          </p>
          <p className="text-[11px] text-[#5A7469]">Awaiting AWB generation</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Active Consignments</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            {shippedOrders.length}
          </p>
          <p className="text-[11px] text-[#5A7469]">In-transit across India</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Integrated Couriers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            {couriers.filter((c) => c.status === 'Active').length} Active
          </p>
          <p className="text-[11px] text-[#5A7469]">API automated tracking sync</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Free Shipping Threshold</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#C5A059] flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            ₹{freeShippingThreshold}
          </p>
          <p className="text-[11px] text-[#5A7469]">Cart subtotal qualifier</p>
        </div>
      </div>

      {/* Main 2-Column: Consignments & Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Ready for Dispatch Consignments */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#EFEBE3] pb-4">
            <div>
              <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
                Consignments Awaiting Dispatch
              </h2>
              <p className="text-xs text-[#5A7469]">
                Assign Air Waybills and hand over packages to logistics partners.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              {pendingOrders.length} Pending
            </span>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto opacity-50" />
              <p className="text-sm font-bold text-[#0B241C]">All Consignments Dispatched</p>
              <p className="text-xs text-[#5A7469] max-w-sm mx-auto">
                No orders are currently waiting for fulfillment. Newly confirmed purchases will appear here ready for AWB generation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#0B241C]">{ord.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#2C4A3E]">
                      Patron: <strong className="text-[#0B241C]">{ord.customer.name}</strong> · {ord.shippingAddress.city}, {ord.shippingAddress.pincode}
                    </p>
                    <p className="text-[10px] text-[#5A7469]">
                      Items: {ord.items.map((i) => i.name).join(', ')} (₹{ord.total.toLocaleString('en-IN')})
                    </p>
                  </div>

                  <button
                    onClick={() => handleGenerateAWB(ord)}
                    className="px-3.5 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Generate AWB</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Shipping Rate & Threshold Rules */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
          <div className="border-b border-[#EFEBE3] pb-4">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
              Shipping Rate Rules
            </h2>
            <p className="text-xs text-[#5A7469]">
              Configure checkout calculation rules and origin warehouse.
            </p>
          </div>

          <form onSubmit={handleSaveRules} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#0B241C] mb-1">
                Free Shipping Cart Threshold (₹)
              </label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#C5A059]"
              />
              <p className="text-[10px] text-[#5A7469] mt-0.5">Orders at or above this amount receive ₹0 shipping fee.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#0B241C] mb-1">
                  Standard Shipping (₹)
                </label>
                <input
                  type="number"
                  value={standardRate}
                  onChange={(e) => setStandardRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1">
                  Express Air Delivery (₹)
                </label>
                <input
                  type="number"
                  value={expressRate}
                  onChange={(e) => setExpressRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#0B241C] mb-1">
                  COD Handling Fee (₹)
                </label>
                <input
                  type="number"
                  value={codSurcharge}
                  onChange={(e) => setCodSurcharge(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1">
                  Origin Pincode
                </label>
                <input
                  type="text"
                  value={warehousePincode}
                  onChange={(e) => setWarehousePincode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              Save Shipping Rules
            </button>
          </form>

          {/* Pincode Checker Simulator */}
          <div className="pt-4 border-t border-[#EFEBE3] space-y-3">
            <h3 className="font-bold text-xs text-[#0B241C] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Serviceability Test by Pincode</span>
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit Pincode (e.g. 560001)"
                value={checkPincode}
                maxLength={6}
                onChange={(e) => setCheckPincode(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs focus:outline-none focus:border-[#C5A059]"
              />
              <button
                type="button"
                onClick={handlePincodeCheck}
                className="px-3 py-2 rounded-xl bg-white border border-[#E2DBD0] hover:bg-[#FAF8F5] text-xs font-semibold text-[#0B241C]"
              >
                Check
              </button>
            </div>

            {pincodeResult && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Serviceable via {pincodeResult.courier}
                </p>
                <p className="text-[11px] text-emerald-800">
                  Est. Transit: {pincodeResult.tat} · COD: {pincodeResult.codAvailable ? 'Available' : 'Prepaid Only'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Courier Partners Grid */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
        <div className="border-b border-[#EFEBE3] pb-4">
          <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
            Integrated Logistics & Courier Providers
          </h2>
          <p className="text-xs text-[#5A7469]">
            Active delivery APIs supporting real-time tracking webhook callbacks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {couriers.map((courier) => (
            <div
              key={courier.id}
              className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#0B241C]">{courier.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    courier.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {courier.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#C5A059] font-semibold">{courier.tier}</p>
                <p className="text-[11px] text-[#5A7469]">Coverage: {courier.coverage}</p>
                <p className="text-[11px] text-[#5A7469]">Avg. Transit: {courier.avgDeliveryDays}</p>
              </div>

              <div className="pt-2 border-t border-[#E2DBD0] flex justify-between items-center text-[10px] text-[#5A7469]">
                <span>Prefix: <code className="font-mono text-[#0B241C] font-bold">{courier.trackingPrefix}</code></span>
                <span className="text-emerald-700 font-bold">API Synced</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
