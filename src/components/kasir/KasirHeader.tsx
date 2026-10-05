/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EventSetting } from '../../types';
import { BarChart3, History, Printer } from 'lucide-react';

interface KasirHeaderProps {
  boothNama: string;
  eventSetting?: EventSetting;
  todayOrdersCount: number;
  onOpenReport: () => void;
  onOpenHistory: () => void;
  onOpenPrinterSettings?: () => void;
}

export const KasirHeader: React.FC<KasirHeaderProps> = ({
  boothNama,
  eventSetting,
  todayOrdersCount,
  onOpenReport,
  onOpenHistory,
  onOpenPrinterSettings,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-orange-500 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
              KASIR
            </span>
            <h1 className="text-sm md:text-base font-extrabold tracking-tight text-slate-800">
              {boothNama}
            </h1>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">
            Terminal Kasir POS • {eventSetting?.nama_event || 'POS Kasir'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Printer & Receipt Settings Button */}
        {onOpenPrinterSettings && (
          <button
            type="button"
            onClick={onOpenPrinterSettings}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer shadow-xs"
            title="Pengaturan Printer & Test Print"
          >
            <Printer className="h-4 w-4 text-orange-500" />
            <span className="hidden sm:inline">Printer & Struk</span>
          </button>
        )}

        {/* Booth Report Button (Z-Report) */}
        <button
          onClick={onOpenReport}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer shadow-xs"
        >
          <BarChart3 className="h-4 w-4 text-orange-500" />
          <span className="hidden sm:inline">Laporan Booth</span>
          <span className="sm:hidden">Laporan</span>
        </button>

        {/* Order History Button */}
        <button
          onClick={onOpenHistory}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer shadow-xs"
        >
          <History className="h-4 w-4 text-orange-500" />
          <span>Riwayat Hari Ini ({todayOrdersCount})</span>
        </button>

        <div className="text-right hidden md:block">
          <span className="text-xs font-bold text-slate-700 block">
            {eventSetting?.client_merchant || 'Food Festival'}
          </span>
          <span className="text-[10px] text-emerald-600 font-mono font-bold flex items-center justify-end gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {eventSetting?.konektivitas || 'Online'}
          </span>
        </div>
      </div>
    </header>
  );
};
