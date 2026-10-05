/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Booth } from '../../../types';
import { KioskCartItem } from '../kioskTypes';
import { formatIDR } from '../kioskPrintUtils';
import { User, Coins, QrCode, CreditCard } from 'lucide-react';

interface KioskReviewScreenProps {
  cart: KioskCartItem[];
  totalAmount: number;
  currentBooth: Booth;
  customerNameInput: string;
  setCustomerNameInput: (s: string) => void;
  onBackToMenu: () => void;
  onSelectPaymentMethod: (method: 'CASH' | 'QRIS' | 'EDC') => void;
}

export const KioskReviewScreen: React.FC<KioskReviewScreenProps> = ({
  cart,
  totalAmount,
  currentBooth,
  customerNameInput,
  setCustomerNameInput,
  onBackToMenu,
  onSelectPaymentMethod,
}) => {
  const activeCount = [
    currentBooth.pay_cash_active !== false,
    currentBooth.pay_qris_active !== false,
    currentBooth.pay_edc_active !== false,
  ].filter(Boolean).length;

  return (
    <div className="flex-1 max-w-3xl lg:max-w-5xl xl:max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center animate-fade-in text-slate-800">
      <div className="bg-white border border-slate-200 rounded-4xl p-6 sm:p-8 md:p-10 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-800">Detail Pembelian Anda</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-semibold">
            Harap tinjau kembali daftar pesanan Anda sebelum membayar
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-10 lg:items-start space-y-6 lg:space-y-0">
          {/* Left Column: Order Items Summary & Total */}
          <div className="lg:col-span-6 space-y-4">
            <div className="divide-y divide-slate-100 max-h-52 lg:max-h-56 overflow-y-auto pr-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {cart.map((c) => (
                <div key={c.menuItem.id} className="py-2.5 flex justify-between gap-4 text-xs md:text-sm">
                  <div>
                    <span className="font-black text-slate-800 block">{c.menuItem.nama}</span>
                    {c.catatan && (
                      <span className="italic text-[10px] text-orange-600 block font-medium">
                        *{c.catatan}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-bold font-mono">
                      {c.qty} pcs x {formatIDR(c.menuItem.harga)}
                    </span>
                  </div>
                  <span className="font-mono text-orange-600 font-extrabold shrink-0">
                    {formatIDR(c.menuItem.harga * c.qty)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center px-4 py-3 bg-slate-100/60 rounded-2xl border border-slate-200">
              <span className="font-extrabold text-sm text-slate-600">
                Total Tagihan Yang Harus Dibayar
              </span>
              <span className="font-mono font-black text-base md:text-lg text-orange-600">
                {formatIDR(totalAmount)}
              </span>
            </div>

            <button
              type="button"
              onClick={onBackToMenu}
              className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors font-bold text-xs py-3.5 px-4 rounded-xl cursor-pointer text-slate-700"
            >
              Ubah Order
            </button>
          </div>

          {/* Right Column: Customer Name / Table No & Payment Method Selection */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            {/* Input Nama Pemesan / Nomor Meja */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-orange-500" />
                  <span>Nama Pelanggan / No. Meja (Opsional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = customerNameInput.trim();
                    if (!trimmed) {
                      setCustomerNameInput('Reservasi');
                    } else if (/^reservasi\b/i.test(trimmed)) {
                      setCustomerNameInput(trimmed.replace(/^reservasi\s*[-–:]*\s*/i, ''));
                    } else {
                      setCustomerNameInput(`Reservasi - ${trimmed}`);
                    }
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1 cursor-pointer select-none active:scale-95 ${
                    /reservasi/i.test(customerNameInput)
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-3xs'
                  }`}
                  title="Klik untuk menandai transaksi Reservasi"
                >
                  <span>Reservasi</span>
                </button>
              </div>
              <input
                type="text"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                placeholder="Contoh: Budi / Meja 12"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Nama / nomor meja akan tercetak di struk & diteruskan ke dapur KDS
              </p>
            </div>

            <div className="text-left hidden lg:block">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                LANGKAH 2 DARI 2
              </span>
              <h3 className="text-sm font-extrabold text-slate-800">Pilih Metode Pembayaran:</h3>
            </div>

            <div
              className={`grid gap-3 ${
                activeCount === 1 ? 'grid-cols-1' : activeCount === 2 ? 'grid-cols-2' : 'grid-cols-3'
              }`}
            >
              {currentBooth.pay_cash_active !== false && (
                <button
                  type="button"
                  onClick={() => onSelectPaymentMethod('CASH')}
                  className="bg-orange-500 hover:bg-orange-600 transition-colors font-extrabold text-xs py-5 px-2 rounded-2xl text-white text-center cursor-pointer shadow-md flex flex-col items-center gap-2"
                >
                  <Coins className="h-8 w-8" />
                  <span>TUNAI (CASH)</span>
                </button>
              )}
              {currentBooth.pay_qris_active !== false && (
                <button
                  type="button"
                  onClick={() => onSelectPaymentMethod('QRIS')}
                  className="bg-purple-600 hover:bg-purple-700 transition-colors font-extrabold text-xs py-5 px-2 rounded-2xl text-white text-center cursor-pointer shadow-md flex flex-col items-center gap-2"
                >
                  <QrCode className="h-8 w-8" />
                  <span>QRIS STATIS</span>
                </button>
              )}
              {currentBooth.pay_edc_active !== false && (
                <button
                  type="button"
                  onClick={() => onSelectPaymentMethod('EDC')}
                  className="bg-indigo-600 hover:bg-indigo-700 transition-colors font-extrabold text-xs py-5 px-2 rounded-2xl text-white text-center cursor-pointer shadow-md flex flex-col items-center gap-2"
                >
                  <CreditCard className="h-8 w-8" />
                  <span>KARTU / EDC</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
