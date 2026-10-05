/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { AlertTriangle, X, ShieldAlert, Check } from 'lucide-react';

interface VoidOrderModalProps {
  isOpen: boolean;
  order: Order | null;
  onConfirm: (orderId: string, reason: string) => Promise<void> | void;
  onClose: () => void;
  isLoading?: boolean;
}

const VOID_REASON_PRESETS = [
  'Salah Input Menu',
  'Pelanggan Membatalkan',
  'Salah Metode Pembayaran',
  'Pesanan Ganda',
  'Lainnya...',
];

export const VoidOrderModal: React.FC<VoidOrderModalProps> = ({
  isOpen,
  order,
  onConfirm,
  onClose,
  isLoading = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('Salah Input Menu');
  const [customReason, setCustomReason] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset('Salah Input Menu');
      setCustomReason('');
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  const handleConfirm = async () => {
    const finalReason = selectedPreset === 'Lainnya...' 
      ? (customReason.trim() || 'Lainnya') 
      : selectedPreset;
    await onConfirm(order.id, finalReason);
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print-modal">
      <div className="bg-white border border-red-100 w-full max-w-md rounded-3xl text-slate-800 shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 bg-red-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Batalkan Pesanan (VOID)</h3>
              <p className="text-[11px] text-red-600 font-medium">Tindakan ini akan mengembalikan stok menu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Order Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono font-black text-slate-800 text-sm">{order.nomor_order}</span>
              <span className="font-bold text-red-600 text-sm font-mono">{formatIDR(order.total)}</span>
            </div>
            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
              <span>Stan: <strong className="text-slate-700">{order.booth_nama || 'Kasir'}</strong></span>
              <span>•</span>
              <span>Metode: <strong className="text-slate-700">{order.metode_bayar}</strong></span>
              {order.nama_pelanggan && (
                <>
                  <span>•</span>
                  <span>Pelanggan: <strong className="text-slate-700">{order.nama_pelanggan}</strong></span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-600 line-clamp-1 border-t border-slate-200/60 pt-1.5">
              {order.items?.map((it) => `${it.qty}x ${it.nama_item}`).join(', ') || 'Item transaksi'}
            </p>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Pilih Alasan Pembatalan:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {VOID_REASON_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSelectedPreset(preset)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    <span>{preset}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Reason Input */}
            {selectedPreset === 'Lainnya...' && (
              <div className="mt-2.5">
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Tuliskan alasan spesifik pembatalan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Warning Banner */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Status order akan ditandai sebagai <strong>VOID</strong> dan alasan akan tercatat dalam audit log transaksi.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || (selectedPreset === 'Lainnya...' && !customReason.trim())}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : (
              <span>Ya, Batalkan Pesanan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
