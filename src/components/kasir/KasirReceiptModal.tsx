/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Booth, Order, EventSetting } from '../../types';
import { formatIDR } from './kasirPrintUtils';
import { Check, Printer } from 'lucide-react';

interface KasirReceiptModalProps {
  isOpen: boolean;
  completedOrder: Order | null;
  isReprintMode: boolean;
  currentBooth: Booth;
  eventSetting?: EventSetting;
  onPrint: () => void;
  onClose: () => void;
}

export const KasirReceiptModal: React.FC<KasirReceiptModalProps> = ({
  isOpen,
  completedOrder,
  isReprintMode,
  currentBooth,
  eventSetting,
  onPrint,
  onClose,
}) => {
  if (!isOpen || !completedOrder) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in no-print-modal">
      <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 text-slate-800 text-sans shadow-2xl flex flex-col max-h-[90vh]">
        <div
          className={`text-center mb-4 font-extrabold text-sm flex items-center justify-center gap-1.5 shrink-0 ${
            isReprintMode ? 'text-orange-600' : 'text-emerald-600'
          }`}
        >
          <span
            className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
              isReprintMode ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600'
            }`}
          >
            {isReprintMode ? <Printer className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
          </span>
          <span>{isReprintMode ? 'Cetak Ulang Struk Transaksi' : 'Transaksi Berhasil Diinput!'}</span>
        </div>

        {/* Simulated scrollable thermal printable box container */}
        <div className="flex-1 overflow-y-auto mb-4 bg-white text-black p-4 rounded-2xl shadow-inner select-all relative">
          <div id="print-invoice-area" className="font-mono text-[11px] leading-tight text-left">
            {completedOrder.status === 'VOID' && (
              <div className="mb-2 p-2 rounded-xl bg-red-50 border-2 border-dashed border-red-400 text-red-600 text-center font-bold">
                <div className="text-[12px] uppercase font-black tracking-wider">*** TRANSAKSI DIBATALKAN (VOID) ***</div>
                {completedOrder.alasan_void && (
                  <div className="text-[10px] mt-0.5 font-semibold text-red-700">Alasan: {completedOrder.alasan_void}</div>
                )}
              </div>
            )}
            {/* Header toko & event */}
            <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-slate-300">
              <h3 className="receipt-header-title font-black text-[12px] uppercase leading-none">
                {eventSetting?.nama_event || 'Festival Point of Sale'}
              </h3>
              <p className="text-[10.5px] font-bold">{completedOrder.booth_nama || currentBooth?.nama}</p>
              <p className="text-[9px] text-slate-600">
                {[eventSetting?.client_merchant, eventSetting?.area_lokasi].filter(Boolean).join(' • ') ||
                  'Main Venue'}
              </p>
            </div>

            {/* Center Hero Block: Nomor Order & Pelanggan / Meja */}
            <div className="py-2 border-b border-dashed border-slate-300 text-center space-y-0.5">
              <span className="text-[8.5px] uppercase tracking-wider text-slate-500 font-bold block">
                Nomor Order
              </span>
              <div className="receipt-order-no text-[16px] font-black tracking-wider text-slate-900 leading-none">
                {completedOrder.nomor_order}
              </div>
              {completedOrder.nama_pelanggan && String(completedOrder.nama_pelanggan).trim() && (
                <div className="receipt-customer-name text-[11.5px] font-black uppercase tracking-wide text-slate-900 mt-0.5">
                  [ {String(completedOrder.nama_pelanggan).trim()} ]
                </div>
              )}
            </div>

            {/* Meta details */}
            <div className="receipt-meta space-y-0.5 py-1.5 border-b border-dashed border-slate-300 text-[9.5px]">
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>
                  {new Date(completedOrder.created_at).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kasir / Sumber:</span>
                <span className="font-bold">{completedOrder.sumber || 'POS'}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode:</span>
                <span className="font-bold">{completedOrder.metode_bayar}</span>
              </div>
            </div>

            {/* Items rows (2-Line POS Standard Format) */}
            <div className="py-1.5 border-b border-dashed border-slate-300 space-y-2">
              {completedOrder.items.map((item) => (
                <div key={item.id} className="space-y-0.5">
                  <div className="receipt-item-title font-bold text-[11px] text-slate-900 break-words leading-tight">
                    {item.nama_item}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-700">
                    <span>
                      {item.qty}x @{formatIDR(item.harga).replace('Rp', '').trim()}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{formatIDR(item.harga * item.qty)}</span>
                  </div>
                  {item.catatan && (
                    <div className="receipt-item-note text-[9px] text-slate-600 pl-2 italic break-words leading-tight">
                      *Catatan: {item.catatan}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals row block */}
            <div className="py-1.5 space-y-0.5 text-[10px]">
              <div className="receipt-subtotal flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">{formatIDR(completedOrder.total + (completedOrder.diskon || 0))}</span>
              </div>
              {completedOrder.diskon && completedOrder.diskon > 0 ? (
                <div className="receipt-subtotal flex justify-between items-center text-emerald-700">
                  <span className="truncate">
                    Voucher ({completedOrder.diskon / (currentBooth?.voucher_nominal || 5000)}x):
                  </span>
                  <span className="font-mono whitespace-nowrap shrink-0 ml-1">- {formatIDR(completedOrder.diskon)}</span>
                </div>
              ) : null}
              <div className="receipt-subtotal flex justify-between">
                <span>PPN (0%):</span>
                <span className="font-mono">Rp0</span>
              </div>
              <div className="receipt-total flex justify-between font-black border-t border-dotted border-slate-200 pt-1 text-[12.5px] text-slate-900">
                <span>TOTAL:</span>
                <span className="font-mono">{formatIDR(completedOrder.total)}</span>
              </div>
              {completedOrder.metode_bayar === 'CASH' && (
                <>
                  <div className="flex justify-between text-slate-700 pt-0.5">
                    <span>Tunai:</span>
                    <span className="font-mono">{formatIDR(completedOrder.uang_bayar || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Kembalian:</span>
                    <span className="font-mono">{formatIDR(completedOrder.kembalian || 0)}</span>
                  </div>
                </>
              )}
              {completedOrder.metode_bayar !== 'CASH' && completedOrder.no_referensi && (
                <div className="flex justify-between text-slate-700 font-mono text-[9px] pt-0.5">
                  <span>Ref ID:</span>
                  <span>{completedOrder.no_referensi}</span>
                </div>
              )}
            </div>

            {/* Receipt Thermal Footer slogan */}
            <div className="receipt-footer text-center pt-2.5 border-t border-dashed border-slate-300 space-y-0.5 select-none whitespace-pre-line text-[9px] text-slate-600 font-medium">
              {eventSetting?.footer_struk && eventSetting.footer_struk.trim()
                ? eventSetting.footer_struk
                : 'TERIMA KASIH ATAS KUNJUNGAN ANDA\nSimpan struk ini sebagai bukti transaksi'}
            </div>
          </div>
        </div>

        {/* Receipt Modal footer buttons */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <button
            type="button"
            onClick={onPrint}
            id="btn-receipt-trigger-print"
            className="bg-slate-800 hover:bg-slate-900 text-white transition-colors font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span className="flex flex-col items-center">
              Cetak Struk (thermal)
              <span className="text-[8px] font-normal text-slate-400 -mt-1">PC / RawBT Android</span>
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            id="btn-receipt-done"
            className="bg-orange-500 hover:bg-orange-600 text-white transition-all font-black text-xs py-3 px-4 rounded-xl text-center cursor-pointer shadow-xs"
          >
            {isReprintMode ? 'Tutup' : 'Transaksi Baru'}
          </button>
        </div>
      </div>
    </div>
  );
};
