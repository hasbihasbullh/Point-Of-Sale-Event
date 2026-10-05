/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Booth, EventSetting } from '../../types';
import { ReportDateMode, TopMenuItem } from './kasirTypes';
import { formatIDR } from './kasirPrintUtils';
import {
  BarChart3, Calendar, History, RefreshCw, X, Loader2, DollarSign,
  Receipt, ShoppingBag, Tag, Banknote, AlertCircle, TrendingUp, Clock,
  Printer, Share2, Check, Bookmark
} from 'lucide-react';

interface KasirZReportModalProps {
  isOpen: boolean;
  currentBooth: Booth;
  eventSetting?: EventSetting;
  reportData: any;
  isLoadingReport: boolean;
  effectiveReportDate: string;
  reportDateMode: ReportDateMode;
  customReportDate: string;
  topMenuItems: TopMenuItem[];
  isCopiedWa: boolean;
  onSetReportDateMode: (mode: ReportDateMode) => void;
  onSetCustomReportDate: (d: string) => void;
  onRefreshReport: () => void;
  onPrintZReport: () => void;
  onShareWhatsApp: () => void;
  onClose: () => void;
}

export const KasirZReportModal: React.FC<KasirZReportModalProps> = ({
  isOpen,
  currentBooth,
  eventSetting,
  reportData,
  isLoadingReport,
  effectiveReportDate,
  reportDateMode,
  customReportDate,
  topMenuItems,
  isCopiedWa,
  onSetReportDateMode,
  onSetCustomReportDate,
  onRefreshReport,
  onPrintZReport,
  onShareWhatsApp,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in no-print-modal">
      <div className="bg-white border border-slate-200 w-full h-full max-w-6xl max-h-[94vh] rounded-3xl text-slate-800 shadow-2xl flex flex-col overflow-hidden text-sans">
        {/* 1. Full-Modal Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-orange-500">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-orange-500 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg shadow-xs">
                  BOOTH {currentBooth.kode}
                </span>
                <h2 className="text-lg md:text-xl font-extrabold text-slate-900">{currentBooth.nama}</h2>
                {eventSetting?.nama_event && (
                  <span className="hidden sm:inline-block text-[10px] font-bold bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded">
                    {eventSetting.nama_event}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Laporan Penjualan Stand & Rekap Penutupan Shift (Z-Report) • Tanggal:{' '}
                <strong className="text-slate-700">{effectiveReportDate}</strong>
              </p>
            </div>
          </div>

          {/* Date Filter & Control Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-200/80 rounded-xl p-1 border border-slate-300/60">
              <button
                onClick={() => onSetReportDateMode('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  reportDateMode === 'today'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Hari Ini</span>
              </button>
              <button
                onClick={() => onSetReportDateMode('yesterday')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  reportDateMode === 'yesterday'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Kemarin</span>
              </button>
            </div>

            {/* Custom Date Input */}
            <div
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 border transition-all ${
                reportDateMode === 'custom'
                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-bold hidden sm:inline">Pilih:</span>
              <input
                type="date"
                value={customReportDate}
                onChange={(e) => {
                  onSetCustomReportDate(e.target.value);
                  onSetReportDateMode('custom');
                }}
                className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer font-mono font-bold"
              />
            </div>

            <button
              onClick={onRefreshReport}
              className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
              title="Refresh Laporan"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingReport ? 'animate-spin text-orange-500' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-all cursor-pointer shadow-xs ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2. Full-Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {isLoadingReport && !reportData ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-sm font-semibold">Mengambil data penjualan booth...</p>
            </div>
          ) : (
            <>
              {/* Top 4 KPI Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Omzet Bersih */}
                <div className="bg-white border border-orange-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Total Omzet Bersih
                    </span>
                    <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="text-2xl lg:text-3xl font-black text-slate-900 mt-2 font-mono tracking-tight">
                    {formatIDR(reportData?.revenue_total || 0)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Omzet riil dari transaksi selesai
                  </p>
                </div>

                {/* KPI 2: Total Transaksi Selesai */}
                <div className="bg-white border border-sky-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Transaksi Selesai
                    </span>
                    <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
                      <Receipt className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="text-2xl lg:text-3xl font-black text-slate-900 mt-2 font-mono tracking-tight">
                    {(reportData?.transactions_count || 0).toLocaleString('id-ID')}
                    <span className="text-sm font-semibold text-slate-500 ml-1.5">struk</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Total pesanan berhasil terlayani
                  </p>
                </div>

                {/* KPI 3: Total Porsi Terjual */}
                <div className="bg-white border border-emerald-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Porsi Terjual
                    </span>
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="text-2xl lg:text-3xl font-black text-slate-900 mt-2 font-mono tracking-tight">
                    {(reportData?.items_sold_count || 0).toLocaleString('id-ID')}
                    <span className="text-sm font-semibold text-slate-500 ml-1.5">porsi</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Akumulasi menu makanan & minuman
                  </p>
                </div>

                {/* KPI 4: Total Diskon Voucher */}
                <div className="bg-white border border-purple-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Diskon Voucher
                    </span>
                    <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                      <Tag className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="text-2xl lg:text-3xl font-black text-slate-900 mt-2 font-mono tracking-tight">
                    {formatIDR(reportData?.total_diskon || 0)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Potongan voucher festival terpakai
                  </p>
                </div>
              </div>

              {/* Highlight Rekapitulasi Reservasi jika ada */}
              {Boolean(reportData?.reservasi_count && reportData.reservasi_count > 0) && (
                <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
                      <Bookmark className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                          Rekap Pesanan Reservasi
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 font-medium mt-0.5">
                        Terdapat <strong>{reportData.reservasi_count} pesanan</strong> teridentifikasi sebagai transaksi reservasi.
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right font-mono shrink-0">
                    <div className="text-xs text-amber-700 font-semibold">Total Nilai Reservasi</div>
                    <div className="text-xl font-black text-amber-900">
                      {formatIDR(reportData?.reservasi_total || 0)}
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Rekapitulasi Kas & Pembayaran + VOID Audit */}
              {(() => {
                const isCashActive = currentBooth?.pay_cash_active !== false;
                const isQrisActive = currentBooth?.pay_qris_active !== false;
                const isEdcActive = currentBooth?.pay_edc_active !== false;
                const activePayCount = [isCashActive, isQrisActive, isEdcActive].filter(Boolean).length;

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left 8 Cols: Rekap Kas Setoran Kasir */}
                    <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <Banknote className="h-5 w-5 text-emerald-600" />
                        <h3 className="font-extrabold text-base text-slate-900">
                          Rekapitulasi Kas & Metode Pembayaran
                        </h3>
                      </div>

                      <div
                        className={`grid grid-cols-1 ${
                          activePayCount === 3
                            ? 'sm:grid-cols-3'
                            : activePayCount === 2
                            ? 'sm:grid-cols-2'
                            : 'sm:grid-cols-1'
                        } gap-4`}
                      >
                        {/* Cash on Hand */}
                        {isCashActive && (
                          <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase text-emerald-800">
                                Tunai (Cash In)
                              </span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                Uang Fisik
                              </span>
                            </div>
                            <div className="text-xl lg:text-2xl font-black text-emerald-700 font-mono mt-2">
                              {formatIDR(reportData?.payment_stats?.CASH || 0)}
                            </div>
                          </div>
                        )}

                        {/* QRIS */}
                        {isQrisActive && (
                          <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase text-blue-800">
                                QRIS Non-Tunai
                              </span>
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                                E-Wallet
                              </span>
                            </div>
                            <div className="text-xl lg:text-2xl font-black text-blue-700 font-mono mt-2">
                              {formatIDR(reportData?.payment_stats?.QRIS || 0)}
                            </div>
                          </div>
                        )}

                        {/* EDC */}
                        {isEdcActive && (
                          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase text-amber-800">
                                Mesin EDC
                              </span>
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                                Debit / Kredit
                              </span>
                            </div>
                            <div className="text-xl lg:text-2xl font-black text-amber-700 font-mono mt-2">
                              {formatIDR(reportData?.payment_stats?.EDC || 0)}
                            </div>
                          </div>
                        )}

                        {activePayCount === 0 && (
                          <div className="py-6 text-center text-xs text-slate-400 col-span-full">
                            Tidak ada metode pembayaran aktif untuk stan ini.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right 4 Cols: VOID Audit Card */}
                    <div className="lg:col-span-4 bg-rose-50/70 border border-rose-200 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-rose-200/80">
                          <span className="text-xs font-bold uppercase text-rose-800 flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-rose-600" />
                            Audit Transaksi VOID
                          </span>
                          <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                            Dibatalkan
                          </span>
                        </div>
                        <div className="text-2xl font-black text-rose-700 font-mono">
                          {reportData?.voided_count || 0}
                          <span className="text-xs text-rose-600 font-semibold ml-1.5">transaksi</span>
                        </div>
                        <p className="text-sm font-bold text-rose-800 font-mono mt-1">
                          Total Nilai: {formatIDR(reportData?.voided_total || 0)}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                          Transaksi yang dibatalkan tidak dihitung ke omzet bersih dan stok telah dikembalikan.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Section 3: Semua Menu Terlaris */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    <h3 className="font-extrabold text-base text-slate-900">
                      Menu Terlaris (Stan {currentBooth.nama})
                    </h3>
                  </div>
                  {topMenuItems.length > 0 && (
                    <span className="text-xs font-bold bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg border border-orange-200">
                      {topMenuItems.length} Menu Terjual
                    </span>
                  )}
                </div>

                {topMenuItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {topMenuItems.map((item, idx) => (
                      <div
                        key={item.nama}
                        className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`h-6 w-6 rounded-lg flex items-center justify-center font-black text-xs ${
                              idx === 0
                                ? 'bg-orange-500 text-white font-bold'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-800 font-bold'
                                : idx === 2
                                ? 'bg-amber-600 text-white font-bold'
                                : 'bg-slate-200 text-slate-600 font-bold'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                            {item.kategori}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">
                            {item.nama}
                          </h4>
                          <div className="flex justify-between items-end mt-3 pt-2 border-t border-slate-200">
                            <span className="font-mono text-sm font-black text-orange-600">
                              {item.qty} pcs
                            </span>
                            <span className="font-mono text-xs font-semibold text-slate-500">
                              {formatIDR(item.total_revenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Belum ada penjualan menu untuk periode tanggal {effectiveReportDate}.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 3. Full-Modal Footer Action Bar */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>
              Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')} • Periode:{' '}
              <strong className="text-slate-800">{effectiveReportDate}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Cetak Struk Z-Report */}
            <button
              type="button"
              onClick={onPrintZReport}
              disabled={!reportData || isLoadingReport}
              className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Printer className="h-4 w-4 text-orange-400" />
              <span>Cetak Struk Rekap Shift (Z-Report)</span>
            </button>

            {/* Bagikan / Copy ke WhatsApp */}
            <button
              type="button"
              onClick={onShareWhatsApp}
              disabled={!reportData || isLoadingReport}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isCopiedWa ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              <span>{isCopiedWa ? 'Tersalin ke Clipboard!' : 'Bagikan ke WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
