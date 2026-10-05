/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CartItem } from './kasirTypes';
import { formatIDR } from './kasirPrintUtils';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard } from 'lucide-react';

interface KasirCartSidebarProps {
  cart: CartItem[];
  totalCartAmount: number;
  onUpdateQty: (id: string, delta: number) => void;
  onUpdateCatatan: (id: string, text: string) => void;
  onClearCart: () => void;
  onOpenPayment: () => void;
}

export const KasirCartSidebar: React.FC<KasirCartSidebarProps> = ({
  cart,
  totalCartAmount,
  onUpdateQty,
  onUpdateCatatan,
  onClearCart,
  onOpenPayment,
}) => {
  return (
    <aside className="lg:col-span-4 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-4 md:p-6 flex flex-col justify-between shadow-[-10px_0_30px_rgba(0,0,0,0.02)] h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Basket title */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-sm md:text-base text-slate-800">Keranjang Order</h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              id="btn-clear-cart"
              className="text-xs text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus</span>
            </button>
          )}
        </div>

        {/* Cart Rows Scroller */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 mt-2">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.menuItem.id} className="py-3 space-y-2">
                <div className="flex justify-between gap-3 text-sm">
                  <div className="flex-1 space-y-0.5">
                    <span className="font-bold text-slate-800 text-xs leading-tight block">
                      {item.menuItem.nama}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {formatIDR(item.menuItem.harga)} / pcs
                    </span>
                  </div>
                  <span className="font-mono text-orange-600 font-bold text-xs shrink-0">
                    {formatIDR(item.menuItem.harga * item.qty)}
                  </span>
                </div>

                {/* Quantity modifiers + Item Note */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100/60">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onUpdateQty(item.menuItem.id, -1)}
                      className="bg-slate-200 hover:bg-slate-300 h-6 w-6 rounded-lg text-slate-700 flex items-center justify-center font-bold cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-mono font-bold text-xs w-6 text-center text-slate-800">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.menuItem.id, 1)}
                      className="bg-slate-200 hover:bg-slate-300 h-6 w-6 rounded-lg text-slate-700 flex items-center justify-center font-bold cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={item.catatan || ''}
                    onChange={(e) => onUpdateCatatan(item.menuItem.id, e.target.value)}
                    placeholder="Catatan tambahan (spt: Tanpa es)"
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-20">
              <ShoppingCart className="h-10 w-10 stroke-[1.5] text-slate-400 mb-2" />
              <span>Keranjang belanja masih kosong.</span>
              <span>Silakan pilih menu di samping.</span>
            </div>
          )}
        </div>
      </div>

      {/* Summation Footer and checkout button */}
      <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Subtotal Item</span>
            <span className="font-mono text-slate-600 font-semibold">{formatIDR(totalCartAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>PPN 0% (Festival Tax-free)</span>
            <span className="font-mono text-slate-600 font-semibold">Rp0</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-100 pt-2">
            <span className="font-extrabold text-sm text-slate-800">Jumlah Tagihan</span>
            <span className="font-mono font-extrabold text-lg text-orange-500">
              {formatIDR(totalCartAmount)}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenPayment}
          disabled={cart.length === 0}
          id="btn-cart-pay"
          className={`w-full font-extrabold text-sm rounded-2xl py-3 px-4 flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 select-none ${
            cart.length > 0
              ? 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer hover:shadow-orange-500/10'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Bayar Transaksi</span>
        </button>
      </div>
    </aside>
  );
};
