/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface KioskWelcomeScreenProps {
  kioskBanner?: string;
  onStartOrder: () => void;
}

export const KioskWelcomeScreen: React.FC<KioskWelcomeScreenProps> = ({ kioskBanner, onStartOrder }) => {
  const bgImage = kioskBanner && kioskBanner.trim() ? kioskBanner.trim() : null;

  return (
    <div
      onClick={onStartOrder}
      className={`flex-1 min-h-screen w-full flex flex-col items-center justify-center p-8 text-center cursor-pointer animate-fade-in relative overflow-hidden select-none ${
        bgImage
          ? 'bg-cover bg-center bg-slate-900'
          : 'bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/70'
      }`}
      style={bgImage ? { backgroundImage: `url('${bgImage}')` } : undefined}
    >
      {/* Sleek White-Label Ambient Background when no custom image is uploaded */}
      {!bgImage && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 md:w-[32rem] md:h-[32rem] bg-orange-500/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 md:w-[26rem] md:h-[26rem] bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
        </div>
      )}

      {/* Subtle Overlay to ensure CTA pop on uploaded image */}
      {bgImage && <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] pointer-events-none" />}

      {/* Glassmorphism Centered CTA */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="bg-white/95 backdrop-blur-xl border border-white/60 px-10 py-6 md:px-14 md:py-8 rounded-[2.5rem] shadow-2xl shadow-orange-500/10 flex flex-col items-center gap-1 animate-pulse transition-all">
          <span className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tight drop-shadow-sm">
            <span className="text-orange-500">Order</span> Now
          </span>
          <span className="text-xs md:text-sm font-bold text-slate-500 tracking-wider uppercase mt-1">
            Sentuh Layar untuk Memulai
          </span>
        </div>
      </div>
    </div>
  );
};
