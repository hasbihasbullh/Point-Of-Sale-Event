/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BellRing, Volume2, Radio, ChefHat } from 'lucide-react';
import { Button } from '../ui/button';

interface KdsSoundUnlockModalProps {
  boothNama: string;
  onUnlock: () => void;
  onSkip: () => void;
}

export const KdsSoundUnlockModal: React.FC<KdsSoundUnlockModalProps> = ({
  boothNama,
  onUnlock,
  onSkip,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-800/80 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden ring-1 ring-white/10">
        {/* Ambient Background Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Booth Header Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-full mb-6 text-slate-300 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-200">{boothNama}</span>
        </div>

        {/* Glowing Icon Container */}
        <div className="relative mx-auto mb-5 w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-orange-500/20 rounded-2xl blur-lg animate-pulse" />
          <div className="relative bg-gradient-to-tr from-orange-500/20 via-orange-500/10 to-amber-500/10 border border-orange-500/30 p-4.5 rounded-2xl text-orange-400 shadow-inner flex items-center justify-center">
            <BellRing className="h-9 w-9 text-orange-400" />
          </div>
        </div>

        {/* Title & Description */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Monitor Dapur Siap
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 mb-6 leading-relaxed">
          Browser memerlukan interaksi sekali sentuh untuk mengizinkan bel suara pesanan otomatis saat transaksi baru masuk dari kasir atau kiosk.
        </p>

        {/* Feature Mini Badges */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-[10.5px] text-slate-300">
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5 flex flex-col items-center gap-1">
            <Volume2 className="h-4 w-4 text-orange-400" />
            <span className="font-semibold">Bel Otomatis</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5 flex flex-col items-center gap-1">
            <Radio className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold">Real-time SSE</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5 flex flex-col items-center gap-1">
            <ChefHat className="h-4 w-4 text-sky-400" />
            <span className="font-semibold">Antrean Koki</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <Button
          onClick={onUnlock}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-3.5 px-6 rounded-2xl w-full shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2.5 text-xs uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer h-12"
        >
          <BellRing className="h-4 w-4" />
          <span>Aktifkan Bel & Mulai Monitor</span>
        </Button>

        {/* Secondary Skip Option */}
        <button
          onClick={onSkip}
          className="mt-3 text-[11.5px] text-slate-500 hover:text-slate-300 transition-colors py-1 cursor-pointer font-medium"
        >
          Lanjut tanpa suara bel
        </button>
      </div>
    </div>
  );
};
