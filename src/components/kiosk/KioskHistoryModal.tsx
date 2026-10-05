/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Booth, Order } from '../../types';
import { formatIDR } from './kioskPrintUtils';
import { History, RefreshCw, X, Search, Printer, Trash2, Tag } from 'lucide-react';

interface KioskHistoryModalProps {
  isOpen: boolean;
  currentBooth: Booth;
  todayStr: string;
  todayHistoryOrders: Order[];
  filteredHistoryOrders: Order[];
  historySearchQuery: string;
  historyFilterMethod: string;
  setHistorySearchQuery: (q: string) => void;
  setHistoryFilterMethod: (m: string) => void;
  onRefreshHistory: () => void;
  onPrintOrder: (ord: Order) => void;
  onVoidOrder: (ord: Order) => void;
  onClose: () => void;
}

export const KioskHistoryModal: React.FC<KioskHistoryModalProps> = ({
  isOpen,
  currentBooth,
  todayStr,
  todayHistoryOrders,
  filteredHistoryOrders,
  historySearchQuery,
  historyFilterMethod,
  setHistorySearchQuery,
  setHistoryFilterMethod,
  onRefreshHistory,
  onPrintOrder,
  onVoidOrder,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in no-print-modal">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl text-slate-800 text-sans shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header Modal */}
        <div className="flex justify-between items-center border-b border-slate-100 p-4 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Riwayat Transaksi Kiosk Hari Ini ({currentBooth.nama})
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Tanggal: {todayStr} • Total: {todayHistoryOrders.length} transaksi
                {todayHistoryOrders.some((o) => (o.diskon || 0) > 0) && (
                  <span className="text-emerald-600 font-sans font-bold ml-1.5">
                    • {todayHistoryOrders.filter((o) => (o.diskon || 0) > 0 && o.status !== 'VOID').length} pakai voucher
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onRefreshHistory}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Segarkan Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="p-4 pb-2 border-b border-slate-100 space-y-2.5 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-8 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800 placeholder-slate-400"
              placeholder="Cari No. Order / Pelanggan / Menu / Voucher..."
            />
            {historySearchQuery && (
              <button
                onClick={() => setHistorySearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'ALL', label: `Semua (${todayHistoryOrders.length})`, show: true },
              {
                id: 'CASH',
                label: `Tunai (${todayHistoryOrders.filter((o) => o.metode_bayar === 'CASH' && o.status !== 'VOID').length})`,
                show: currentBooth.pay_cash_active !== false,
              },
              {
                id: 'QRIS',
                label: `QRIS (${todayHistoryOrders.filter((o) => o.metode_bayar === 'QRIS' && o.status !== 'VOID').length})`,
                show: currentBooth.pay_qris_active !== false,
              },
              {
                id: 'EDC',
                label: `EDC (${todayHistoryOrders.filter((o) => o.metode_bayar === 'EDC' && o.status !== 'VOID').length})`,
                show: currentBooth.pay_edc_active !== false,
              },
              {
                id: 'VOID',
                label: `Void (${todayHistoryOrders.filter((o) => o.status === 'VOID').length})`,
                show: true,
              },
            ]
              .filter((tab) => tab.show)
              .map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setHistoryFilterMethod(tab.id)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                    historyFilterMethod === tab.id
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
          </div>
        </div>

        {/* Order List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {filteredHistoryOrders.map((ord) => (
            <div
              key={ord.id}
              className={`border rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                ord.status === 'VOID'
                  ? 'bg-red-50/40 border-red-200 opacity-80'
                  : 'bg-slate-50/70 border-slate-200 hover:border-orange-200 hover:bg-white'
              }`}
            >
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-black text-orange-600 text-sm">{ord.nomor_order}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      ord.status === 'VOID' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {ord.status}
                  </span>
                  <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                    {ord.sumber}
                  </span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">
                    {ord.metode_bayar}
                  </span>
                  {ord.nama_pelanggan && (
                    <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                      Pelanggan/Meja: {ord.nama_pelanggan}
                    </span>
                  )}
                  {ord.status === 'VOID' && ord.alasan_void && (
                    <span className="text-[10px] bg-red-100 border border-red-200 text-red-700 px-2 py-0.5 rounded-md font-bold">
                      Alasan: {ord.alasan_void}
                    </span>
                  )}
                  {ord.diskon !== undefined && ord.diskon > 0 && (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded-md font-sans">
                      <Tag className="h-3 w-3 text-emerald-600" />
                      <span>Voucher -{formatIDR(ord.diskon)}</span>
                    </span>
                  )}
                </div>

                {/* Item list summary */}
                <p className="text-slate-600 text-[11px] leading-tight line-clamp-1">
                  {ord.items.map((it) => `${it.qty}x ${it.nama_item}`).join(', ')}
                </p>

                {/* Timestamp and Total */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <span>
                    Jam {new Date(ord.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                  <span>•</span>
                  {ord.diskon !== undefined && ord.diskon > 0 ? (
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="line-through text-slate-400 font-mono">
                        {formatIDR(ord.total + ord.diskon)}
                      </span>
                      <span className="text-emerald-600 font-bold font-mono text-[10px]">
                        (-{formatIDR(ord.diskon)})
                      </span>
                      <span
                        className={`font-black font-mono text-xs ${
                          ord.status === 'VOID' ? 'line-through text-red-500' : 'text-slate-900'
                        }`}
                      >
                        {formatIDR(ord.total)}
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`font-bold font-sans text-xs ${
                        ord.status === 'VOID' ? 'line-through text-red-500' : 'text-slate-800'
                      }`}
                    >
                      {formatIDR(ord.total)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => onPrintOrder(ord)}
                  className="p-2.5 bg-white border border-slate-200 hover:bg-orange-50 hover:border-orange-300 rounded-xl text-slate-700 hover:text-orange-600 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  title="Cetak Struk Thermal"
                >
                  <Printer className="h-4 w-4 text-orange-500" />
                  <span className="text-[11px] font-bold">Cetak</span>
                </button>
                {ord.status !== 'VOID' && (
                  <button
                    onClick={() => onVoidOrder(ord)}
                    className="p-2.5 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-xl transition-all cursor-pointer"
                    title="Batalkan Transaksi (Void)"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredHistoryOrders.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              {todayHistoryOrders.length === 0
                ? `Belum ada transaksi untuk hari ini (${todayStr}).`
                : 'Tidak ada transaksi yang cocok dengan pencarian/filter.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
