/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MenuItem } from '../../types';
import { CartItem } from './kasirTypes';
import { formatIDR } from './kasirPrintUtils';
import { getFoodImage, getOfflineSvgFallback } from '../../foodImages';

interface KasirMenuGridProps {
  products: MenuItem[];
  cart: CartItem[];
  onAddToCart: (item: MenuItem) => void;
}

export const KasirMenuGrid: React.FC<KasirMenuGridProps> = ({
  products,
  cart,
  onAddToCart,
}) => {
  return (
    <main className="lg:col-span-8 p-4 md:p-6 flex flex-col gap-4 overflow-y-auto">
      {/* Grid Cards of Dishes */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
        {products.map((item) => {
          const inStock = item.tersedia && (item.stok == null || item.stok > 0);

          // Get quantity already in basket
          const cartRef = cart.find((c) => c.menuItem.id === item.id);
          const inCartQty = cartRef ? cartRef.qty : 0;

          return (
            <div
              key={item.id}
              onClick={() => inStock && onAddToCart(item)}
              className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between cursor-pointer group hover:shadow-md select-none ${
                inStock
                  ? 'hover:bg-slate-50 border-slate-200 hover:border-orange-200'
                  : 'opacity-45 border-slate-100 cursor-not-allowed'
              } ${inCartQty > 0 ? 'ring-1 ring-orange-500 border-orange-500 bg-orange-50/10' : ''}`}
            >
              <div>
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

                {/* Stock badge (if tracked) */}
                {item.stok != null && (
                  <div className="flex justify-end mb-1.5">
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      Sisa: {item.stok - inCartQty}
                    </span>
                  </div>
                )}

                <h4 className="font-bold text-slate-800 text-xs md:text-sm leading-tight group-hover:text-orange-600 transition-colors">
                  {item.nama}
                </h4>
                {item.deskripsi && (
                  <p className="text-[9px] text-slate-500 leading-tight mt-1 line-clamp-2">
                    {item.deskripsi}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-slate-100">
                <span className="font-mono text-orange-600 font-extrabold text-xs md:text-sm">
                  {formatIDR(item.harga)}
                </span>
                {inCartQty > 0 ? (
                  <span className="bg-orange-500 font-black text-[11px] text-white h-5 w-5 rounded-full flex items-center justify-center shadow">
                    {inCartQty}
                  </span>
                ) : inStock ? (
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 group-hover:text-white group-hover:bg-orange-500 transition-all font-semibold">
                    + Pilih
                  </span>
                ) : (
                  <span className="text-[9px] bg-red-50 text-red-500 border border-red-200 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Habis
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};
