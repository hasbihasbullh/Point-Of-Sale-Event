/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Booth, Order, EventSetting } from '../../../types';
import { CheckCircle, Printer } from 'lucide-react';

interface KioskSuccessScreenProps {
  completedOrder: Order;
  currentBooth: Booth;
  eventSetting?: EventSetting;
  onPrint: () => void;
  onReset: () => void;
}

export const KioskSuccessScreen: React.FC<KioskSuccessScreenProps> = ({
  completedOrder,
  onPrint,
  onReset,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-center max-w-xl w-full mx-auto p-6 md:p-12 text-center animate-fade-in relative z-10 text-slate-800">
      <div className="absolute -top-16 -left-16 h-80 w-80 rounded-full bg-orange-500/5 blur-3xl -z-10 animate-pulse" />

      <div className="bg-white border border-slate-200 rounded-5xl p-8 md:p-10 space-y-6 shadow-2xl relative">
        <div className="bg-emerald-50 h-16 w-16 rounded-full mx-auto flex items-center justify-center text-emerald-600 shadow shadow-emerald-500/10 border border-emerald-200">
          <CheckCircle className="h-8 w-8" />
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
            ORDER BERHASIL!
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Harap catat atau hafalkan nomor antrean Anda
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-2 shadow-inner">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            NOMOR ANTREAN
          </span>
          <span className="font-mono text-5xl font-black text-orange-600 block tracking-tight">
            {completedOrder.nomor_order}
          </span>
          {completedOrder.nama_pelanggan && (
            <div className="bg-orange-100/70 border border-orange-200 text-orange-800 text-sm font-extrabold py-1.5 px-4 rounded-full inline-block mt-1">
              Atas Nama / Meja:{' '}
              <span className="text-orange-950 font-black">{completedOrder.nama_pelanggan}</span>
            </div>
          )}
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            Status: Terkirim ke Layar Dapur (KDS)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onPrint}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Struk</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs py-3.5 px-4 rounded-2xl text-center cursor-pointer shadow-xs"
          >
            Selesai / Order Baru
          </button>
        </div>
      </div>
    </div>
  );
};
