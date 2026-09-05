'use client';

import React, { useState } from 'react';
import { Boxes, AlertTriangle, Plus, Check, RefreshCw } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export default function AdminInventoryPage() {
  const { products, updateProduct, showToast } = useStore();
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  const lowStockThreshold = 20;

  const filteredItems = filterLowStockOnly
    ? products.filter((p) => p.stock <= lowStockThreshold)
    : products;

  const lowStockCount = products.filter((p) => p.stock <= lowStockThreshold).length;

  const handleQuickAddStock = (productId: string, currentStock: number, addQty: number) => {
    const newStock = currentStock + addQty;
    updateProduct(productId, {
      stock: newStock,
      status: newStock > 0 ? 'Active' : 'Out of Stock',
    });
    showToast('Stock Updated', `Added +${addQty} units.`);
  };

  const handleSetStock = (productId: string, newQty: number) => {
    updateProduct(productId, {
      stock: Math.max(0, newQty),
      status: newQty > 0 ? 'Active' : 'Out of Stock',
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
          Inventory & Stock Monitor
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E]">
          Manage stock levels, replenish units, and monitor low inventory warnings across all product lines.
        </p>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-900">
                {lowStockCount} Products Running Low on Stock (&le; {lowStockThreshold} units)
              </p>
              <p className="text-xs text-amber-700">
                Replenish inventory to avoid delays in order fulfillment.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className="px-4 py-2 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold transition-colors whitespace-nowrap"
          >
            {filterLowStockOnly ? 'Show All Products' : 'Filter Low Stock'}
          </button>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-[#E2DBD0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E2DBD0] text-[#5A7469] uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4 pl-6">Product Item</th>
                <th className="p-4">Category</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Quick Batch Restock</th>
                <th className="p-4 pr-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEBE3]">
              {filteredItems.map((prod) => {
                const isLow = prod.stock <= lowStockThreshold;
                const isOut = prod.stock === 0;

                return (
                  <tr key={prod.id} className="hover:bg-[#FAF8F5]/40 transition-colors">
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-12 h-12 rounded-xl object-cover bg-[#EBF3EF] border border-[#E2DBD0] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-[#0B241C] truncate max-w-xs">{prod.name}</p>
                        <p className="text-[11px] text-[#5A7469]">₹{prod.price.toLocaleString('en-IN')}</p>
                      </div>
                    </td>

                    <td className="p-4 text-[#2C4A3E]">
                      <p className="font-semibold">{prod.category}</p>
                      <p className="text-[11px] text-[#5A7469]">{prod.subcategory}</p>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={prod.stock}
                          onChange={(e) => handleSetStock(prod.id, Number(e.target.value))}
                          className="w-16 p-1.5 border border-[#E2DBD0] rounded-lg text-xs font-bold text-[#0B241C] text-center"
                        />
                        <span
                          className={`text-[11px] font-bold ${
                            isOut
                              ? 'text-rose-700'
                              : isLow
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Healthy'}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex gap-1.5">
                        {[+10, +25, +50].map((qty) => (
                          <button
                            key={qty}
                            onClick={() => handleQuickAddStock(prod.id, prod.stock, qty)}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#C5A059] hover:text-white border border-[#E2DBD0] text-[#2C4A3E] text-xs font-bold transition-colors"
                          >
                            +{qty}
                          </button>
                        ))}
                      </div>
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          prod.stock > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {prod.stock > 0 ? 'In Stock' : 'Sold Out'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
