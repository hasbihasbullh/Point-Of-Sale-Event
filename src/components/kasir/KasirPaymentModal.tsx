/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Booth } from '../../types';
import { PaymentMethod } from './kasirTypes';
import { formatIDR } from './kasirPrintUtils';
import {
  X, Coins, QrCode, CreditCard, Minus, Plus, Check, Loader2, ShieldAlert, Tag
} from 'lucide-react';

interface KasirPaymentModalProps {
  isOpen: boolean;
  currentBooth: Booth;
  totalCartAmount: number;
  isVoucherEnabled: boolean;
  voucherNominal: number;
  voucherCount: number;
  setVoucherCount: React.Dispatch<React.SetStateAction<number>>;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  customerNameInput: string;
  setCustomerNameInput: (s: string) => void;
  cashAmountInput: string;
  refNoInput: string;
  setRefNoInput: (s: string) => void;
  edcBank: string;
  setEdcBank: (s: string) => void;
  cashChangeAmount: number;
  isConfirmingCheckout: boolean;
  isLoading: boolean;
  onNumpadClick: (val: string) => void;
  onSelectQuickCash: (nominal: number) => void;
  onClose: () => void;
  onConfirmCheckoutClick: () => void;
  onShowQrisZoom: () => void;
}

export const KasirPaymentModal: React.FC<KasirPaymentModalProps> = ({
  isOpen,
  currentBooth,
  totalCartAmount,
  isVoucherEnabled,
  voucherNominal,
  voucherCount,
  setVoucherCount,
  paymentMethod,
  setPaymentMethod,
  customerNameInput,
  setCustomerNameInput,
  cashAmountInput,
  refNoInput,
  setRefNoInput,
  edcBank,
  setEdcBank,
  cashChangeAmount,
  isConfirmingCheckout,
  isLoading,
  onNumpadClick,
  onSelectQuickCash,
  onClose,
  onConfirmCheckoutClick,
  onShowQrisZoom,
}) => {
  if (!isOpen) return null;

  const totalVoucherDiscount = voucherCount * voucherNominal;
  const grandTotal = Math.max(0, totalCartAmount - totalVoucherDiscount);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-scale-up border border-slate-100">
        {/* Header Modal */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
              Pembayaran Transaksi ({currentBooth.nama})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Split Content: Left (Summary & Tabs) | Right (Form Inputs) */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
          {/* LEFT COLUMN: Summary & Payment Channel Tabs */}
          <div className="w-full md:w-5/12 p-4 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col gap-3 bg-slate-50/30">
            {/* Total tagihan highlight */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-xs">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
                TOTAL TAGIHAN
              </span>
              <h2 className="text-2xl font-black text-orange-600 font-mono mt-1">
                {formatIDR(grandTotal)}
              </h2>
              {voucherCount > 0 && (
                <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                  Hemat {formatIDR(totalVoucherDiscount)} dari voucher
                </div>
              )}
            </div>

            {/* VOUCHER DISKON PANEL */}
            {isVoucherEnabled && (
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/90 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                    <Tag className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <h4 className="text-xs font-bold text-emerald-900 leading-tight">
                        Voucher
                      </h4>
                      {voucherCount > 0 && (
                        <span className="text-emerald-700 font-black bg-emerald-200 px-1 py-0.2 rounded text-[9px] leading-none">
                          {voucherCount}x
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono font-bold text-emerald-600 leading-tight">
                      {formatIDR(voucherNominal)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 bg-white/90 border border-emerald-200 p-0.5 rounded-lg shadow-xs">
                  <button
                    type="button"
                    onClick={() => setVoucherCount(Math.max(0, voucherCount - 1))}
                    disabled={voucherCount === 0}
                    className="bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:hover:bg-emerald-50 text-emerald-700 h-6 w-6 rounded flex items-center justify-center font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Kurangi voucher"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="font-mono text-xs font-black text-emerald-800 w-4 text-center select-none">
                    {voucherCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVoucherCount(voucherCount + 1)}
                    className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white h-6 w-6 rounded flex items-center justify-center font-bold shadow-xs transition-all cursor-pointer"
                    aria-label="Tambah voucher"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Payment channel tabs (Vertical list on tablet) */}
            <div className="flex flex-col gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
              {currentBooth.pay_cash_active !== false && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2.5 px-3 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                    paymentMethod === 'CASH'
                      ? 'bg-orange-500 text-white font-bold shadow-md'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  <Coins className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-semibold">Tunai (Cash)</span>
                </button>
              )}
              {currentBooth.pay_qris_active !== false && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`py-2.5 px-3 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                    paymentMethod === 'QRIS'
                      ? 'bg-purple-600 text-white font-bold shadow-md'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  <QrCode className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-semibold">QRIS Statis</span>
                </button>
              )}
              {currentBooth.pay_edc_active !== false && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('EDC')}
                  className={`py-2.5 px-3 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                    paymentMethod === 'EDC'
                      ? 'bg-indigo-600 text-white font-bold shadow-md'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  <CreditCard className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-semibold">Mesin EDC</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Inputs & Numpad */}
          <div className="w-full md:w-7/12 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-500">
                    Nama Pelanggan / No. Meja (Opsional)
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
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer select-none ${
                      /reservasi/i.test(customerNameInput)
                        ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-slate-400"
                  placeholder="Masukkan nama / nomor meja (Contoh: Budi / Meja 12)"
                />
              </div>

              {/* CASH payments panel */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Diterima Uang Tunai (IDR)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={cashAmountInput ? formatIDR(Number(cashAmountInput)) : ''}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-lg font-mono font-black text-orange-600 tracking-tight focus:outline-none cursor-default"
                      placeholder="Rp0"
                    />
                  </div>

                  {/* VIRTUAL NUMPAD & QUICK CASH */}
                  <div className="grid grid-cols-4 gap-1.5 mt-1 select-none">
                    {/* Quick Cash Column */}
                    <div className="col-span-1 flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectQuickCash(0)}
                        className="bg-orange-100 hover:bg-orange-200 text-orange-700 h-full rounded-xl text-[9px] font-bold shadow-xs transition-colors flex items-center justify-center text-center leading-tight cursor-pointer"
                      >
                        UANG PAS
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectQuickCash(20000)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-xl text-[10px] font-mono font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        20K
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectQuickCash(50000)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-xl text-[10px] font-mono font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        50K
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectQuickCash(100000)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-xl text-[10px] font-mono font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        100K
                      </button>
                    </div>

                    {/* Numpad Column */}
                    <div className="col-span-3 grid grid-cols-3 gap-1.5">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => onNumpadClick(num)}
                          className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 py-1.5 rounded-xl text-base font-mono font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => onNumpadClick('C')}
                        className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        C
                      </button>
                      <button
                        type="button"
                        onClick={() => onNumpadClick('0')}
                        className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 py-1.5 rounded-xl text-base font-mono font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={() => onNumpadClick('000')}
                        className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 py-1.5 rounded-xl text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        000
                      </button>
                      <button
                        type="button"
                        onClick={() => onNumpadClick('DEL')}
                        className="col-span-3 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>

                  {/* Changes highlight indicator */}
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex justify-between items-center mt-1">
                    <span className="text-[10px] text-emerald-700 font-extrabold uppercase">
                      Kembalian
                    </span>
                    <span className="font-mono text-lg font-extrabold text-emerald-600">
                      {formatIDR(cashChangeAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* QRIS Statis payment scan mockup instruction */}
              {paymentMethod === 'QRIS' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col items-center">
                    {!currentBooth.qris_image_path && (
                      <div className="text-center w-full max-w-xs space-y-1 mb-2 select-none">
                        <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded tracking-widest font-mono">
                          Booths QRIS Portal
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-800 leading-tight">
                          {currentBooth.nama}
                        </h4>
                        <p className="text-[9px] text-slate-400 font-mono">NMID: ID2023294844733</p>
                      </div>
                    )}

                    <div className="bg-white p-3 rounded-xl shadow-inner border border-slate-200 flex flex-col items-center shrink-0">
                      <div
                        className={`h-36 w-36 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden ${
                          currentBooth.qris_image_path ? 'cursor-pointer hover:opacity-90' : ''
                        }`}
                        onClick={() => currentBooth.qris_image_path && onShowQrisZoom()}
                      >
                        <div className="absolute inset-1.5 border-2 border-orange-500/10 rounded pointer-events-none" />
                        {currentBooth.qris_image_path ? (
                          <img
                            src={currentBooth.qris_image_path}
                            alt="QRIS"
                            onError={(e) => {
                              e.currentTarget.src = `data:image/svg+xml;utf8,${encodeURIComponent(
                                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="16" fill="#cbd5e1">QRIS OFFLINE</text></svg>'
                              )}`;
                            }}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        ) : (
                          <>
                            <QrCode className="h-24 w-24 text-slate-800" />
                            <span className="bg-orange-500 text-white font-mono font-black text-[9px] px-1.5 py-0.5 rounded absolute">
                              BOOTH {currentBooth.kode}
                            </span>
                          </>
                        )}
                      </div>
                      {!currentBooth.qris_image_path && (
                        <span className="text-[7px] tracking-widest uppercase text-slate-500 font-black font-sans mt-1.5">
                          QRIS INDONESIA STATIS
                        </span>
                      )}
                    </div>

                    <div className="text-center text-[10px] text-slate-500 mt-2 max-w-xs font-sans leading-relaxed">
                      Arahkan pembeli untuk scan QRIS statis booth. Kasir mengecek mutasi lalu klik Konfirmasi.
                    </div>
                  </div>
                </div>
              )}

              {/* EDC payment credit card option panel input */}
              {paymentMethod === 'EDC' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Bank Penerbit EDC
                      </label>
                      <select
                        value={edcBank}
                        onChange={(e) => setEdcBank(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="BCA">BCA (Standard)</option>
                        <option value="Mandiri">Mandiri</option>
                        <option value="BRI">BRI</option>
                        <option value="BNI">BNI</option>
                        <option value="QRIS">QRIS (via EDC)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        ID Approval / Trace
                      </label>
                      <input
                        type="text"
                        value={refNoInput}
                        onChange={(e) => setRefNoInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono tracking-widest font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="cth: 382944"
                      />
                    </div>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-2 mt-1">
                    <Check className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-indigo-700 leading-relaxed font-sans font-medium">
                      {edcBank === 'QRIS'
                        ? 'Pilih menu QRIS pada mesin EDC Anda. Setelah pembayaran BERHASIL pada mesin fisik, masukkan nomor trace ID/referensi di atas, lalu klik Konfirmasi Transaksi.'
                        : `Gunakan mesin EDC bank ${edcBank}. Setelah transaksi BERHASIL pada mesin fisik, catat nomor trace ID di atas, lalu klik Konfirmasi Transaksi.`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom confirm footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4 shrink-0 bg-slate-50/50">
              <button
                type="button"
                onClick={onClose}
                className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={onConfirmCheckoutClick}
                disabled={isLoading}
                id="btn-confirm-checkout"
                className={`transition-all duration-200 font-black text-[11px] px-5 py-2 rounded-xl text-white shadow-lg flex items-center gap-1.5 cursor-pointer ${
                  isConfirmingCheckout
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20 animate-pulse'
                    : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isConfirmingCheckout ? (
                  <>
                    <ShieldAlert className="h-4 w-4 animate-bounce" />
                    <span>YAKIN BAYAR? (KLIK SEKALI LAGI)</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Konfirmasi Transaksi (Klik 2x)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
