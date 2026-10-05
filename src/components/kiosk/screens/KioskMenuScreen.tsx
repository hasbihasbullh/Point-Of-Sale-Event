/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MenuItem, EventSetting } from '../../../types';
import { KioskCartItem } from '../kioskTypes';
import { formatIDR } from '../kioskPrintUtils';
import { getFoodImage, getOfflineSvgFallback } from '../../../foodImages';
import { ShoppingCart, Trash2, Clock, ChevronRight } from 'lucide-react';

interface KioskMenuScreenProps {
  boothMenus: MenuItem[];
  cart: KioskCartItem[];
  totalAmount: number;
  eventSetting?: EventSetting;
  onAddToCart: (item: MenuItem) => void;
  onModifyQty: (id: string, delta: number) => void;
  onUpdateCatatan: (id: string, text: string) => void;
  onClearCart: () => void;
  onProceedToReview: () => void;
}

export const KioskMenuScreen: React.FC<KioskMenuScreenProps> = ({
  boothMenus,
  cart,
  totalAmount,
  eventSetting,
  onAddToCart,
  onModifyQty,
  onUpdateCatatan,
  onClearCart,
  onProceedToReview,
}) => {
  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 lg:overflow-hidden animate-fade-in">
      {/* Menu Catalog Grid area (Left 2/3) */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          {/* Items Cards list */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
            {boothMenus.map((item) => {
              const cartRef = cart.find((c) => c.menuItem.id === item.id);
              const inCartQty = cartRef ? cartRef.qty : 0;
              const inStock = item.tersedia && (item.stok == null || item.stok > 0);

              return (
                <div
                  key={item.id}
                  onClick={() => inStock && onAddToCart(item)}
                  className={`bg-white rounded-2xl border p-3 flex flex-col justify-between hover:scale-[1.01] hover:bg-slate-50/50 hover:border-slate-300 transition-all cursor-pointer shadow-xs select-none ${
                    !inStock
                      ? 'opacity-45 grayscale cursor-not-allowed'
                      : inCartQty > 0
                      ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/10'
                      : 'border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex-1 flex flex-col">
                    {/* Food Image Banner */}
                    <div className="w-full aspect-square rounded-xl overflow-hidden mb-2.5 relative bg-slate-100 group">
                      <img
                        src={
                          !navigator.onLine && (!item.foto || !item.foto.startsWith('data:image/'))
                            ? getOfflineSvgFallback(item.nama, item.kategori)
                            : getFoodImage(item.nama, item.kategori, item.foto)
                        }
                        alt={item.nama}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getOfflineSvgFallback(item.nama, item.kategori);
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-800 text-sm md:text-base leading-snug">
                        {item.nama}
                      </h4>
                      {item.deskripsi && (
                        <p className="text-[10px] md:text-xs text-slate-500 leading-tight line-clamp-2">
                          {item.deskripsi}
                        </p>
                      )}
                      {item.stok != null && (
                        <span className="text-[10px] text-slate-500 block font-bold font-mono">
                          Stok: {item.stok - inCartQty}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100">
                    <span className="font-mono text-orange-600 font-extrabold text-base">
                      {formatIDR(item.harga)}
                    </span>
                    {inCartQty > 0 ? (
                      <div className="flex items-center gap-2 bg-orange-500 rounded-xl px-2.5 py-1 text-white shadow-xs font-extrabold text-xs">
                        <span className="text-xs font-mono font-extrabold">{inCartQty}x</span>
                      </div>
                    ) : inStock ? (
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 hover:bg-orange-500 hover:text-white transition-all rounded-xl px-3 py-1.5 cursor-pointer">
                        + Tambah
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-red-50 text-red-500 border border-red-200 px-2 py-1 rounded-lg uppercase">
                        Habis
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Banner bottom instruction */}
        <div className="mt-8 border-t border-slate-200 pt-6 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-bold">
            <Clock className="h-4 w-4" />
            <span>{eventSetting?.nama_event || 'POS Terminal'} • Kiosk Terminal</span>
          </span>
        </div>
      </main>

      {/* Cart Sidebar (Right 1/3) */}
      <aside className="w-full lg:w-96 xl:w-[400px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-4 md:p-6 lg:p-8 flex flex-col justify-between lg:h-full shrink-0 shadow-lg text-slate-800 lg:overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              <h3 className="font-extrabold text-base text-slate-800">Pesanan Saya</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 font-bold cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus Semua</span>
              </button>
            )}
          </div>

          {/* Rows scroller */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 mt-4">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item.menuItem.id} className="py-4 space-y-2 text-sm justify-between gap-3">
                  <div className="flex justify-between items-start gap-4">
                    <span className="font-extrabold text-slate-800 text-xs leading-snug">
                      {item.menuItem.nama}
                    </span>
                    <span className="font-mono text-orange-600 font-extrabold text-xs shrink-0">
                      {formatIDR(item.menuItem.harga * item.qty)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {formatIDR(item.menuItem.harga)} / pcs
                    </span>

                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => onModifyQty(item.menuItem.id, -1)}
                        className="bg-white hover:bg-slate-100 border border-slate-200 h-7 w-7 rounded-lg text-slate-700 font-extrabold text-sm flex items-center justify-center transition-colors shadow-3xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono font-extrabold text-xs w-8 text-center text-slate-800">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => onModifyQty(item.menuItem.id, 1)}
                        className="bg-white hover:bg-slate-100 border border-slate-200 h-7 w-7 rounded-lg text-slate-700 font-extrabold text-sm flex items-center justify-center transition-colors shadow-3xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Input Catatan Item Menu */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={item.catatan || ''}
                      onChange={(e) => onUpdateCatatan(item.menuItem.id, e.target.value)}
                      placeholder="Catatan menu (spt: Tanpa es / Pedas)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-24">
                <ShoppingCart className="h-12 w-12 text-slate-300 mb-3 ml-2" />
                <span className="font-extrabold">Keranjang Anda kosong</span>
                <span className="font-medium mt-0.5 text-slate-400">Pilih hidangan lezat di sebelah kiri</span>
              </div>
            )}
          </div>
        </div>

        {/* Summation details and proceed button */}
        <div className="border-t border-slate-100 pt-6 mt-6 space-y-5 shrink-0">
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm text-slate-500">Total Harga (Nett)</span>
            <span className="font-mono font-black text-lg md:text-xl text-orange-600">
              {formatIDR(totalAmount)}
            </span>
          </div>

          <button
            onClick={onProceedToReview}
            disabled={cart.length === 0}
            className={`w-full font-extrabold rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-97 text-sm select-none ${
              cart.length > 0
                ? 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer hover:shadow-orange-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Selesaikan Pembelian</span>
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </aside>
    </div>
  );
};
