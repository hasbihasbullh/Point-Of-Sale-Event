/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ReportSummary } from '../../types';
import { formatIDR } from './adminTypes';
import {
  Coins, Ticket, Receipt, Package, RotateCcw,
  QrCode, CreditCard, TrendingUp, Utensils, Store
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid
} from 'recharts';
import { ScrollArea } from '../ui/scroll-area';

export interface AdminDashboardTabProps {
  report: ReportSummary | null;
  filterStartDate: string;
  filterEndDate: string;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  report,
  filterStartDate,
  filterEndDate,
}) => {
  const txCount = report?.transactions_count || 0;
  const itemsCount = report?.items_sold_count || 0;
  const voidCount = report?.voided_count || 0;
  const totalVoucherDiscount = report?.total_diskon || 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid & Payment Breakdown with crystal clear information */}
      <div className="space-y-6">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Omset Bersih */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Coins className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Omset Bersih</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                  Net Masuk
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatIDR(report?.revenue_total || 0)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Total uang riil masuk kasir/rekening stan (di luar transaksi VOID).
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Diskon Voucher Promo */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                    <Ticket className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Diskon Voucher</span>
                </div>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full">
                  Subsidi
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-amber-600 tracking-tight">
                  {formatIDR(totalVoucherDiscount)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Nilai potongan kupon promosi yang ditanggung panitia festival.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Transaksi Berhasil */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-sky-300 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Transaksi Sah</span>
                </div>
                <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200/70 px-2 py-0.5 rounded-full">
                  Lunas
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {txCount} <span className="text-sm font-semibold text-slate-500">Struk</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Jumlah struk order berhasil terlayani & dibayar di kasir/kiosk.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Total Porsi Terjual */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
                    <Package className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Porsi Terjual</span>
                </div>
                <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-200/70 px-2 py-0.5 rounded-full">
                  Volume
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {itemsCount} <span className="text-sm font-semibold text-slate-500">Porsi</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Akumulasi kuantitas seluruh makanan & minuman yang laku.
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: Transaksi Batal (VOID) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Transaksi Void</span>
                </div>
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-full">
                  Batal
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-rose-600 tracking-tight">
                  {voidCount} <span className="text-sm font-semibold text-slate-500">Struk</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Pesanan dibatalkan kasir (salah ketik/batal) & tidak dihitung omset.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-4">
            <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-3 rounded-xl">
              <Coins className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Uang Tunai (CASH)</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                  {report?.revenue_total ? Math.round(((report?.payment_stats?.CASH || 0) / report.revenue_total) * 100) : 0}%
                </span>
              </div>
              <p className="text-lg font-black text-slate-900 mt-0.5">{formatIDR(report?.payment_stats?.CASH || 0)}</p>
              <p className="text-[10.5px] text-slate-400 mt-0.5">Uang fisik tunai di laci kasir stan</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-4">
            <div className="bg-purple-50 text-purple-600 border border-purple-200 p-3 rounded-xl">
              <QrCode className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">QRIS Statis / Dinamis</span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/70">
                  {report?.revenue_total ? Math.round(((report?.payment_stats?.QRIS || 0) / report.revenue_total) * 100) : 0}%
                </span>
              </div>
              <p className="text-lg font-black text-slate-900 mt-0.5">{formatIDR(report?.payment_stats?.QRIS || 0)}</p>
              <p className="text-[10.5px] text-slate-400 mt-0.5">Pembayaran via scan barcode QRIS</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-4">
            <div className="bg-indigo-50 text-indigo-600 border border-indigo-200 p-3 rounded-xl">
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mesin EDC Bank / Kartu</span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/70">
                  {report?.revenue_total ? Math.round(((report?.payment_stats?.EDC || 0) / report.revenue_total) * 100) : 0}%
                </span>
              </div>
              <p className="text-lg font-black text-slate-900 mt-0.5">{formatIDR(report?.payment_stats?.EDC || 0)}</p>
              <p className="text-[10.5px] text-slate-400 mt-0.5">Debit/Kredit via mesin gesek EDC</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Revenue Chart */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-orange-500" />
          <span>Tren Kecepatan Omset Transaksi ({filterStartDate === 'ALL' || filterEndDate === 'ALL' ? 'Semua Periode' : filterStartDate === filterEndDate ? `Per Jam (${filterStartDate})` : `${filterStartDate} s/d ${filterEndDate}`})</span>
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={report?.timeline_stats || []}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="tanggal" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                formatter={(v: any) => [formatIDR(Number(v)), 'Omset']}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Menu Rankings & Booth Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Menus */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Utensils className="h-4 w-4 text-orange-500" />
            <span>Menu Paling Laris (Top Sales)</span>
          </h3>
          <ScrollArea className="h-72 pr-1">
            <div className="divide-y divide-slate-100 pr-2">
              {(report?.top_menus || []).slice(0, 8).map((m, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${idx === 0 ? 'bg-amber-100 text-amber-800 font-black' : 'bg-slate-100 text-slate-600'
                      }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">{m.name}</p>
                      <p className="text-[11px] text-slate-500">{m.booth} • {m.kategori}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-orange-600">{m.qty} porsi</span>
                    <p className="text-[11px] text-slate-500">{formatIDR(m.total_revenue)}</p>
                  </div>
                </div>
              ))}
              {(!report?.top_menus || report.top_menus.length === 0) && (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada transaksi penjualan pada tanggal ini.</p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Booth Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Store className="h-4 w-4 text-orange-500" />
            <span>Omset per Stan (Booth Leaderboard)</span>
          </h3>
          <ScrollArea className="h-72 pr-1">
            <div className="divide-y divide-slate-100 pr-2">
              {(report?.booth_stats || []).map((b, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-orange-600 font-bold">[{b.booth_kode}]</span>
                      <span className="font-bold text-slate-800">{b.booth_nama}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{b.sales_count} transaksi • {b.qty_items} item terjual</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600 text-sm">{formatIDR(b.revenue)}</p>
                    <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-500 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-0.5 font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/70">
                        Cash: {formatIDR(b.payment_cash)}
                      </span>
                      <span className="inline-flex items-center gap-0.5 font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/70">
                        QRIS: {formatIDR(b.payment_qris)}
                      </span>
                      <span className="inline-flex items-center gap-0.5 font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/70">
                        EDC: {formatIDR(b.payment_edc)}
                      </span>
                      {b.diskon > 0 && (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Ticket className="h-3 w-3 text-amber-600" />
                          <span>Voucher: {formatIDR(b.diskon)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!report?.booth_stats || report.booth_stats.length === 0) && (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada data stan.</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
