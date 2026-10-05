/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface KasirErrorStateProps {
  type: 'not_found' | 'inactive';
  boothKode: string;
  onNavigateHome: () => void;
}

export const KasirErrorState: React.FC<KasirErrorStateProps> = ({
  type,
  boothKode,
  onNavigateHome,
}) => {
  if (type === 'not_found') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-sans">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold">Booth dengan kode "{boothKode}" tidak terdaftar</h2>
        <p className="text-slate-400 text-xs mt-1">
          Harap daftarkan booth ini terlebih dahulu di Panel Admin.
        </p>
        <button
          onClick={onNavigateHome}
          className="mt-6 bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold rounded-xl px-5 py-2.5 text-xs shadow-md cursor-pointer"
        >
          Kembali ke Landing Hub
        </button>
      </div>
    );
  }

  // type === 'inactive'
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-sans">
      <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
      <h2 className="text-xl font-bold">Booth "{boothKode}" Sedang Non-Aktif</h2>
      <p className="text-slate-400 text-xs mt-1">
        Layanan kasir ditutup sementara oleh Administrator.
      </p>
      <button
        onClick={onNavigateHome}
        className="mt-6 bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold rounded-xl px-5 py-2.5 text-xs shadow-md cursor-pointer"
      >
        Kembali ke Landing Hub
      </button>
    </div>
  );
};
