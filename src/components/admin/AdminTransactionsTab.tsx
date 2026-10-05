/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Order } from '../../types';
import { formatIDR } from './adminTypes';
import { Ticket, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { VoidOrderModal } from '../common/VoidOrderModal';

interface AdminTransactionsTabProps {
  orders: Order[];
  onRefreshData: () => Promise<void>;
  fetchReports: () => Promise<void>;
}

export const AdminTransactionsTab: React.FC<AdminTransactionsTabProps> = ({
  orders,
  onRefreshData,
  fetchReports,
}) => {
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState('ALL');
  const [txPaymentFilter, setTxPaymentFilter] = useState('ALL');
  const [txDiscountFilter, setTxDiscountFilter] = useState<'ALL' | 'DISCOUNT_ONLY' | 'NO_DISCOUNT'>('ALL');

  // Order Details Modal
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [orderToVoid, setOrderToVoid] = useState<Order | null>(null);
  const [isVoidLoading, setIsVoidLoading] = useState(false);

  // Filter Transactions Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = txSearchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        o.nomor_order.toLowerCase().includes(q) ||
        (o.nama_pelanggan && o.nama_pelanggan.toLowerCase().includes(q)) ||
        o.booth_nama.toLowerCase().includes(q) ||
        o.booth_kode.toLowerCase().includes(q) ||
        o.items.some((it) => it.nama_item.toLowerCase().includes(q)) ||
        (o.alasan_void && o.alasan_void.toLowerCase().includes(q)) ||
        ((q.includes('voucher') || q.includes('diskon') || q.includes('potongan')) && (o.diskon || 0) > 0);

      const matchStatus = txStatusFilter === 'ALL' || o.status === txStatusFilter;
      const matchPayment = txPaymentFilter === 'ALL' || o.metode_bayar === txPaymentFilter;
      const matchDiscount =
        txDiscountFilter === 'ALL' ||
        (txDiscountFilter === 'DISCOUNT_ONLY' && (o.diskon || 0) > 0) ||
        (txDiscountFilter === 'NO_DISCOUNT' && (!o.diskon || o.diskon === 0));

      return matchQuery && matchStatus && matchPayment && matchDiscount;
    });
  }, [orders, txSearchQuery, txStatusFilter, txPaymentFilter, txDiscountFilter]);

  // ==========================================
  // TRANSACTION & VOID ACTIONS
  // ==========================================
  const handleConfirmVoid = async (orderId: string, reason: string) => {
    setIsVoidLoading(true);
    try {
      const token = sessionStorage.getItem('pos_admin_token');
      const res = await fetch(`/api/orders/${orderId}/void`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ alasan_void: reason }),
      });
      if (res.ok) {
        await onRefreshData();
        await fetchReports();
        if (selectedOrderForDetail?.id === orderId) {
          setSelectedOrderForDetail(null);
        }
        setOrderToVoid(null);
        alert('Order berhasil dibatalkan (VOID) & stok telah dikembalikan ke stan.');
      } else {
        const err = await res.json();
        alert(`Gagal membatalkan order: ${err.error || 'Server error'}`);
      }
    } catch (e) {
      alert('Koneksi terputus saat membatalkan order.');
    } finally {
      setIsVoidLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Audit Log Transaksi Pesanan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Seluruh transaksi terverifikasi dan pembatalan (VOID) dengan snapshot data akurat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Cari order #, stan, item, diskon..."
            value={txSearchQuery}
            onChange={(e) => setTxSearchQuery(e.target.value)}
            className="bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs w-60 shadow-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
          />

          <Select value={txStatusFilter} onValueChange={setTxStatusFilter}>
            <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs shadow-xs min-w-[135px]">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="w-44">
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="SELESAI">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block mr-1.5" />
                <span>SELESAI</span>
              </SelectItem>
              <SelectItem value="BARU">
                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block mr-1.5" />
                <span>BARU</span>
              </SelectItem>
              <SelectItem value="DIPROSES">
                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block mr-1.5" />
                <span>DIPROSES</span>
              </SelectItem>
              <SelectItem value="VOID">
                <span className="h-2 w-2 rounded-full bg-rose-500 inline-block mr-1.5" />
                <span>VOID (Batal)</span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={txPaymentFilter} onValueChange={setTxPaymentFilter}>
            <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs shadow-xs min-w-[135px]">
              <SelectValue placeholder="Semua Metode" />
            </SelectTrigger>
            <SelectContent className="w-44">
              <SelectItem value="ALL">Semua Metode</SelectItem>
              <SelectItem value="CASH">
                <span>CASH</span>
              </SelectItem>
              <SelectItem value="QRIS">
                <span>QRIS</span>
              </SelectItem>
              <SelectItem value="EDC">
                <span>EDC</span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={txDiscountFilter}
            onValueChange={(val: 'ALL' | 'DISCOUNT_ONLY' | 'NO_DISCOUNT') => setTxDiscountFilter(val)}
          >
            <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs shadow-xs min-w-[140px]">
              <Ticket className="h-3.5 w-3.5 text-amber-600 mr-1 shrink-0" />
              <SelectValue placeholder="Semua Diskon" />
            </SelectTrigger>
            <SelectContent className="w-44">
              <SelectItem value="ALL">Semua Diskon</SelectItem>
              <SelectItem value="DISCOUNT_ONLY">
                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block mr-1.5" />
                <span>Ada Diskon</span>
              </SelectItem>
              <SelectItem value="NO_DISCOUNT">
                <span className="h-2 w-2 rounded-full bg-slate-400 inline-block mr-1.5" />
                <span>Tanpa Diskon</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Waktu & Tanggal</th>
                <th className="py-3 px-4">Nomor Order</th>
                <th className="py-3 px-4">Stan (Booth)</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Total Tagihan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Rincian & VOID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Ticket className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-600">
                        Tidak ada transaksi yang cocok dengan filter / pencarian.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Coba ubah kata kunci pencarian atau sesuaikan opsi filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isVoid = ord.status === 'VOID';
                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-slate-50/70 transition-colors ${isVoid ? 'bg-rose-50/40 opacity-70' : ''}`}
                    >
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {ord.created_at.replace('T', ' ').substring(0, 16)}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-slate-900">
                        <span className={isVoid ? 'line-through text-slate-400' : ''}>{ord.nomor_order}</span>
                        {ord.nama_pelanggan && (
                          <p className="text-[10px] text-slate-500 font-sans">{ord.nama_pelanggan}</p>
                        )}
                        {isVoid && ord.alasan_void && (
                          <span className="text-[10px] text-rose-700 font-medium block">Alasan: {ord.alasan_void}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-orange-600 font-bold mr-1">[{ord.booth_kode}]</span>
                        <span className="text-slate-800">{ord.booth_nama}</span>
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            ord.metode_bayar === 'CASH'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ord.metode_bayar === 'QRIS'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {ord.metode_bayar}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className={`font-bold ${isVoid ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {formatIDR(ord.total)}
                        </span>
                        {ord.diskon !== undefined && ord.diskon > 0 && (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md font-sans">
                              <Ticket className="h-2.5 w-2.5" />
                              <span>Diskon {formatIDR(ord.diskon)}</span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isVoid
                              ? 'bg-rose-100 text-rose-800 border border-rose-200 font-black'
                              : ord.status === 'SELESAI'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrderForDetail(ord)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg text-xs cursor-pointer"
                            title="Lihat Struk Pesanan"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {!isVoid && (
                            <button
                              onClick={() => setOrderToVoid(ord)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-2 py-1 rounded-lg text-[11px] font-bold border border-rose-200 cursor-pointer"
                              title="Batalkan Transaksi & Kembalikan Stok"
                            >
                              VOID
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: ORDER DETAILS & RECEIPT VIEW                            */}
      {/* ============================================================== */}
      <Dialog open={!!selectedOrderForDetail} onOpenChange={() => setSelectedOrderForDetail(null)}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md rounded-3xl font-sans shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Struk Transaksi</span>
              <span className="font-mono text-orange-600 text-sm">#{selectedOrderForDetail?.nomor_order}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {selectedOrderForDetail?.created_at.replace('T', ' ')} • Stan [{selectedOrderForDetail?.booth_kode}]{' '}
              {selectedOrderForDetail?.booth_nama}
            </DialogDescription>
          </DialogHeader>

          {selectedOrderForDetail && (
            <div className="space-y-3 mt-2 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="divide-y divide-slate-200">
                  {selectedOrderForDetail.items.map((it, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between">
                      <div>
                        <span className="font-bold text-slate-900">
                          {it.qty}x {it.nama_item}
                        </span>
                        {it.catatan && <p className="text-[10px] text-slate-500 italic">*{it.catatan}</p>}
                      </div>
                      <span className="font-mono text-slate-700">{formatIDR(it.harga * it.qty)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-mono">
                      {formatIDR(selectedOrderForDetail.total + (selectedOrderForDetail.diskon || 0))}
                    </span>
                  </div>
                  {selectedOrderForDetail.diskon > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Diskon Voucher</span>
                      <span className="font-mono">-{formatIDR(selectedOrderForDetail.diskon)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-1">
                    <span>TOTAL</span>
                    <span className="font-mono text-orange-600">{formatIDR(selectedOrderForDetail.total)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
                  <span>
                    Metode Bayar: <b className="text-slate-800">{selectedOrderForDetail.metode_bayar}</b>
                  </span>
                  <span>
                    Status:{' '}
                    <b
                      className={
                        selectedOrderForDetail.status === 'VOID' ? 'text-rose-600' : 'text-emerald-600'
                      }
                    >
                      {selectedOrderForDetail.status}
                    </b>
                  </span>
                </div>

                {selectedOrderForDetail.status === 'VOID' && selectedOrderForDetail.alasan_void && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-800 mt-2">
                    <strong>Alasan Pembatalan (VOID):</strong> {selectedOrderForDetail.alasan_void}
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="text-slate-500 hover:text-slate-800 text-xs cursor-pointer"
                >
                  Tutup
                </Button>
                {selectedOrderForDetail.status !== 'VOID' && (
                  <Button
                    type="button"
                    onClick={() => setOrderToVoid(selectedOrderForDetail)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Batalkan Pesanan (VOID)
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* VOID CONFIRMATION & REASON MODAL */}
      <VoidOrderModal
        isOpen={!!orderToVoid}
        order={orderToVoid}
        onConfirm={handleConfirmVoid}
        onClose={() => setOrderToVoid(null)}
        isLoading={isVoidLoading}
      />
    </div>
  );
};
