/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Booth } from '../../../types';
import { KioskPaymentMethod } from '../kioskTypes';
import { formatIDR } from '../kioskPrintUtils';
import {
  Minus, Plus, ShieldCheck, Loader2, QrCode, CreditCard, Tag
} from 'lucide-react';

interface KioskPaymentScreenProps {
  currentBooth: Booth;
  paymentMethod: KioskPaymentMethod;
  totalAmount: number;
  amountPaid: number;
  voucherCount: number;
  isVoucherEnabled: boolean;
  voucherNominal: number;
  isLoading: boolean;
  setVoucherCount: React.Dispatch<React.SetStateAction<number>>;
  onNumpad: (val: string) => void;
  onQuickBill: (amount: number) => void;
  onBackToReview: () => void;
  onSubmitOrder: () => void;
  onShowQrisZoom: () => void;
}

export const KioskPaymentScreen: React.FC<KioskPaymentScreenProps> = ({
  currentBooth,
  paymentMethod,
  totalAmount,
  amountPaid,
  voucherCount,
  isVoucherEnabled,
  voucherNominal,
  isLoading,
  setVoucherCount,
  onNumpad,
  onQuickBill,
  onBackToReview,
  onSubmitOrder,
  onShowQrisZoom,
}) => {
  return (
    <div className="flex-1 max-w-3xl lg:max-w-5xl xl:max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center animate-fade-in text-slate-800 bg-transparent">
      <div className="bg-white border border-slate-200 rounded-4xl p-6 sm:p-8 md:p-10 shadow-2xl">
        {/* Top Centered Header for Payment Screen */}
        <div className="text-center mb-6 pb-4 border-b border-slate-100">
          <span className="text-[9px] uppercase font-bold tracking-widest text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
            {paymentMethod === 'QRIS'
              ? 'QRIS Dinamis Kiosk'
              : paymentMethod === 'EDC'
              ? 'Pembayaran Kartu / EDC'
              : 'Pembayaran Tunai (Cash)'}
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black mt-2.5 text-slate-800">{currentBooth.nama}</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
            {paymentMethod === 'QRIS'
              ? 'Silakan scan QRIS di bawah ini dengan aplikasi pembayaran Anda'
              : paymentMethod === 'EDC'
              ? 'Silakan ikuti instruksi pembayaran pada mesin EDC'
              : 'Masukkan nominal uang tunai yang diterima'}
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-10 lg:items-center">
          {/* Left Column in Landscape / Top in Portrait */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* VOUCHER DISKON PANEL */}
            {isVoucherEnabled && (
              <div className="p-3.5 sm:p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                    <Tag className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-extrabold text-emerald-900 leading-tight">
                        Voucher Diskon
                      </h4>
                      {voucherCount > 0 && (
                        <span className="text-emerald-700 font-black bg-emerald-200/90 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs leading-none">
                          {voucherCount}x
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono font-bold text-emerald-600 leading-tight mt-0.5">
                      {formatIDR(voucherNominal)} <span className="text-[9px] font-sans text-emerald-500/90 font-medium">/ lbr</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 bg-white/90 border border-emerald-200 p-1 rounded-xl shadow-xs">
                  <button
                    type="button"
                    onClick={() => setVoucherCount(Math.max(0, voucherCount - 1))}
                    disabled={voucherCount === 0}
                    className="bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:hover:bg-emerald-50 text-emerald-700 h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Kurangi voucher"
                  >
                    <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <span className="font-mono text-sm sm:text-base font-black text-emerald-800 w-5 sm:w-6 text-center select-none">
                    {voucherCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVoucherCount(voucherCount + 1)}
                    className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center font-bold shadow-xs transition-all cursor-pointer"
                    aria-label="Tambah voucher"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Total tagihan card */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                JUMLAH TAGIHAN
              </span>
              <h3 className="text-3xl font-black text-slate-800 font-mono leading-none">
                {formatIDR(totalAmount)}
              </h3>
            </div>

            {/* Left instructions on landscape only */}
            {paymentMethod === 'CASH' && (
              <div className="hidden lg:flex bg-emerald-50 border border-emerald-100 p-3 rounded-xl justify-between items-center">
                <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-widest">
                  Kembalian:
                </span>
                <span className="font-mono text-lg font-extrabold text-emerald-600">
                  {amountPaid >= totalAmount ? formatIDR(amountPaid - totalAmount) : 'UANG KURANG'}
                </span>
              </div>
            )}

            {/* Left Action Buttons on landscape only */}
            <div className="hidden lg:grid grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={onBackToReview}
                className="col-span-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors font-bold text-xs py-3.5 rounded-xl cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={onSubmitOrder}
                disabled={isLoading || (paymentMethod === 'CASH' && amountPaid < totalAmount)}
                className={`col-span-2 transition-colors font-black text-xs py-3.5 rounded-xl text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                  isLoading || (paymentMethod === 'CASH' && amountPaid < totalAmount)
                    ? 'bg-slate-300 border-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : paymentMethod === 'CASH'
                    ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 shadow-emerald-500/20 hover:shadow-lg'
                    : paymentMethod === 'EDC'
                    ? 'bg-blue-500 hover:bg-blue-600 border-blue-500 shadow-blue-500/20 hover:shadow-lg'
                    : 'bg-orange-500 hover:bg-orange-600 border-orange-500 shadow-orange-500/20 hover:shadow-lg'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                <span className="text-xs sm:text-sm">
                  {paymentMethod === 'CASH' ? 'BAYAR PESANAN' : 'SAYA SUDAH BAYAR'}
                </span>
              </button>
            </div>
          </div>

          {/* Right Column in Landscape / Middle in Portrait */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center my-2 lg:my-0">
            {/* --- QRIS VIEW --- */}
            {paymentMethod === 'QRIS' && (
              <div className="flex flex-col items-center space-y-3 w-full">
                <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200 flex flex-col items-center shadow-md">
                  <div
                    className={`h-48 w-48 sm:h-52 sm:w-52 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden ${
                      currentBooth.qris_image_path ? 'cursor-pointer hover:opacity-90' : ''
                    }`}
                    onClick={() => currentBooth.qris_image_path && onShowQrisZoom()}
                  >
                    <div className="absolute inset-2 border border-dashed border-slate-200 rounded-2xl pointer-events-none" />
                    {currentBooth.qris_image_path ? (
                      <img
                        src={currentBooth.qris_image_path}
                        alt="QRIS"
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <>
                        <QrCode className="h-40 w-40 text-slate-800" />
                        <span className="bg-orange-500 text-white font-mono font-bold text-[11px] px-2.5 py-1 rounded absolute">
                          SCAN DI SINI
                        </span>
                      </>
                    )}
                  </div>
                  {!currentBooth.qris_image_path && (
                    <span className="text-[8px] tracking-widest uppercase text-slate-400 font-black font-sans mt-2">
                      QRIS NATIONAL STANDARD GPN
                    </span>
                  )}
                </div>

                <div className="text-center space-y-0.5 text-xs text-slate-600 max-w-sm">
                  <p className="font-extrabold text-slate-800">Langkah Pembayaran QRIS:</p>
                  <p>1. Scan QR di atas dengan OVO, GoPay, Dana, M-Banking Anda.</p>
                  <p>2. Pastikan nominal transfer sama persis dengan angka tagihan.</p>
                  <p>3. Setelah transfer berhasil, klik tombol konfirmasi bayar.</p>
                </div>
              </div>
            )}

            {/* --- EDC VIEW --- */}
            {paymentMethod === 'EDC' && (
              <div className="flex flex-col items-center space-y-4 w-full py-2">
                <div className="h-28 w-28 bg-blue-50 rounded-full flex justify-center items-center text-blue-500">
                  <CreditCard className="h-14 w-14 text-blue-500" />
                </div>
                <div className="text-center space-y-2 text-xs sm:text-sm text-slate-600 max-w-sm">
                  <h3 className="font-black text-lg sm:text-xl text-slate-800">Pembayaran Kartu / EDC</h3>
                  <p>1. Gunakan mesin EDC yang ada di Kiosk ini.</p>
                  <p>
                    2. Masukkan nominal tagihan: <strong>{formatIDR(totalAmount)}</strong>.
                  </p>
                  <p>3. Gesek/Tap kartu Anda.</p>
                  <p>4. Jika struk EDC berhasil keluar, klik "SAYA SUDAH BAYAR".</p>
                </div>
              </div>
            )}

            {/* --- CASH VIEW --- */}
            {paymentMethod === 'CASH' && (
              <div className="w-full max-w-md space-y-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Diterima Uang Tunai (IDR)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={amountPaid ? formatIDR(Number(amountPaid)) : ''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-2xl font-mono font-black text-orange-600 tracking-tight focus:outline-none cursor-default text-center"
                    placeholder="Rp0"
                  />
                </div>

                <div className="grid grid-cols-4 gap-1.5 select-none">
                  <div className="col-span-1 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => onQuickBill(totalAmount)}
                      className="bg-orange-100 hover:bg-orange-200 text-orange-700 h-full rounded-xl text-[9px] font-bold shadow-xs transition-colors flex items-center justify-center text-center leading-tight cursor-pointer"
                    >
                      UANG PAS
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickBill(20000)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      20K
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickBill(50000)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      50K
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickBill(100000)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      100K
                    </button>
                  </div>

                  <div className="col-span-3 grid grid-cols-3 gap-1.5">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => onNumpad(num)}
                        className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 py-3 rounded-xl text-xl font-mono font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => onNumpad('C')}
                      className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 py-3 rounded-xl text-base font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      C
                    </button>
                    <button
                      type="button"
                      onClick={() => onNumpad('0')}
                      className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 py-3 rounded-xl text-xl font-mono font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => onNumpad('000')}
                      className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 py-3 rounded-xl text-base font-mono font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      000
                    </button>
                  </div>
                </div>

                <div className="lg:hidden bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl flex justify-between items-center">
                  <span className="text-[11px] text-emerald-700 font-extrabold uppercase tracking-widest">
                    Kembalian
                  </span>
                  <span className="font-mono text-xl font-extrabold text-emerald-600">
                    {amountPaid >= totalAmount ? formatIDR(amountPaid - totalAmount) : 'UANG KURANG'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons on Portrait (at the bottom) */}
          <div className="lg:hidden w-full grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onBackToReview}
              className="col-span-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors font-bold text-xs py-3.5 rounded-xl cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={onSubmitOrder}
              disabled={isLoading || (paymentMethod === 'CASH' && amountPaid < totalAmount)}
              className={`col-span-2 transition-colors font-black text-xs py-3.5 rounded-xl text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                isLoading || (paymentMethod === 'CASH' && amountPaid < totalAmount)
                  ? 'bg-slate-300 border-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : paymentMethod === 'CASH'
                  ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 shadow-emerald-500/20 hover:shadow-lg'
                  : paymentMethod === 'EDC'
                  ? 'bg-blue-500 hover:bg-blue-600 border-blue-500 shadow-blue-500/20 hover:shadow-lg'
                  : 'bg-orange-500 hover:bg-orange-600 border-orange-500 shadow-orange-500/20 hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
              <span className="text-xs sm:text-sm">
                {paymentMethod === 'CASH' ? 'BAYAR PESANAN' : 'SAYA SUDAH BAYAR'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
