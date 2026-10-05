/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, ArrowLeft, ChefHat } from 'lucide-react';
import { Button } from '../ui/button';

interface KdsErrorStateProps {
  type: 'not_found' | 'inactive' | 'kds_disabled';
  boothKode?: string;
  boothNama?: string;
  onNavigateHome: () => void;
}

export const KdsErrorState: React.FC<KdsErrorStateProps> = ({
  type,
  boothKode,
  boothNama,
  onNavigateHome,
}) => {
  if (type === 'not_found') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <AlertCircle className="h-14 w-14 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-black">Stan "{boothKode}" Tidak Ditemukan</h2>
        <p className="text-slate-400 text-xs mt-1 max-w-sm">
          Harap pastikan kode stan sesuai dengan daftar stan terdaftar di sistem.
        </p>
        <Button
          onClick={onNavigateHome}
          className="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-5 py-2.5 text-xs shadow-lg"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Kembali ke Landing Hub</span>
        </Button>
      </div>
    );
  }

  if (type === 'inactive') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <AlertCircle className="h-14 w-14 text-amber-500 mb-4" />
        <h2 className="text-xl font-black">Layar Dapur Stan "{boothNama}" Sedang Non-Aktif</h2>
        <p className="text-slate-400 text-xs mt-1 max-w-sm">
          Layanan stan ini sedang dinonaktifkan oleh administrator.
        </p>
        <Button
          onClick={onNavigateHome}
          variant="outline"
          className="mt-6 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Kembali ke Landing Hub</span>
        </Button>
      </div>
    );
  }

  // type === 'kds_disabled'
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <ChefHat className="h-14 w-14 text-slate-500 mb-4" />
      <h2 className="text-xl font-black">Fitur KDS Tidak Diaktifkan</h2>
      <p className="text-slate-400 text-xs mt-1 max-w-sm">
        Stan "{boothNama}" diatur tanpa monitor dapur (KDS).
      </p>
      <Button
        onClick={onNavigateHome}
        variant="outline"
        className="mt-6 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 rounded-xl"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        <span>Kembali ke Landing Hub</span>
      </Button>
    </div>
  );
};
