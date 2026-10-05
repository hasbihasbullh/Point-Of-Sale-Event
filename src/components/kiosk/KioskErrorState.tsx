/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface KioskErrorStateProps {
  type: 'not_found' | 'inactive' | 'kiosk_disabled';
  boothKode: string;
  onNavigateHome: () => void;
}

export const KioskErrorState: React.FC<KioskErrorStateProps> = ({
  type,
  boothKode,
  onNavigateHome,
}) => {
  if (type === 'not_found') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 text-sans">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold">Booth "{boothKode}" Tidak Terdaftar</h2>
        <p className="text-slate-500 text-xs mt-1">
          Hanya booth komparatif Kiosk yang dapat mengakses layar ini.
        </p>
        <button
          onClick={onNavigateHome}
          className="mt-6 bg-orange-500 hover:bg-orange-600 text-white transition-colors font-bold rounded-xl px-5 py-2.5 text-xs shadow-xs cursor-pointer"
        >
          Kembali ke Hub
        </button>
      </div>
    );
  }

  if (type === 'inactive') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 text-sans">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold">Kiosk Booth "{boothKode}" Sedang Non-Aktif</h2>
        <p className="text-slate-500 text-xs mt-1">
          Layanan Kiosk ditutup sementara oleh Administrator.
        </p>
        <button
          onClick={onNavigateHome}
          className="mt-6 bg-orange-500 hover:bg-orange-600 text-white transition-colors font-bold rounded-xl px-5 py-2.5 text-xs shadow-xs cursor-pointer"
        >
          Kembali ke Landing Hub
        </button>
      </div>
    );
  }

  // type === 'kiosk_disabled'
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 text-sans">
      <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center max-w-md space-y-4 shadow-sm">
        <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Kiosk Offline untuk Booth {boothKode}</h2>
        <p className="text-slate-500 text-xs leading-relaxed">
          Booth ini saat ini <strong>tidak diatur</strong> untuk melayani pesanan <strong>Self-Service Kiosk</strong> mandiri.
          Silakan aktifkan mode Kiosk pada booth ini melalui Panel Admin jika diperlukan.
        </p>
        <div className="pt-2">
          <button
            onClick={onNavigateHome}
            className="bg-orange-500 hover:bg-orange-600 text-white transition-colors font-bold rounded-xl px-5 py-2.5 text-xs shadow-xs cursor-pointer"
          >
            Kembali ke Landing Hub
          </button>
        </div>
      </div>
    </div>
  );
};
