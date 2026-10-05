/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EventSetting } from '../../types';
import { BarChart3, History, Printer } from 'lucide-react';

interface KioskHeaderProps {
  boothNama: string;
  eventSetting?: EventSetting;
  todayOrdersCount: number;
  onOpenReport: () => void;
  onOpenHistory: () => void;
  onOpenPrinterSettings?: () => void;
}

export const KioskHeader: React.FC<KioskHeaderProps> = ({
  boothNama,
  eventSetting,
  todayOrdersCount,
  onOpenReport,
  onOpenHistory,
  onOpenPrinterSettings,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs shrink-0 z-30">
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-orange-500 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
              KIOSK
            </span>
            <h1 className="text-sm md:text-base font-extrabold tracking-tight text-slate-800">
              {boothNama}
            </h1>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono mt-0.5">
            Self-Service Kiosk Terminal • {eventSetting?.nama_event || 'POS Terminal'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Printer & Receipt Settings Button */}
        {onOpenPrinterSettings && (
          <button
            type="button"
            onClick={onOpenPrinterSettings}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer shadow-xs"
            title="Pengaturan Struk Kiosk & Test Print"
          >
            <Printer className="h-4 w-4 text-orange-500" />
            <span className="hidden sm:inline">Printer & Struk</span>
          </button>
        )}

        {/* Booth Report Button (Z-Report) */}
        <button
          onClick={onOpenReport}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer shadow-xs"
        >
          <BarChart3 className="h-4 w-4 text-orange-500" />
          <span>Laporan Booth</span>
        </button>

        {/* Order History Button */}
        <button
          onClick={onOpenHistory}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer shadow-xs"
        >
          <History className="h-4 w-4 text-orange-500" />
          <span>Riwayat Hari Ini ({todayOrdersCount})</span>
        </button>
      </div>
    </header>
  );
};
