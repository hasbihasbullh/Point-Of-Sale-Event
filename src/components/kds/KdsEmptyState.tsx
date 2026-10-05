/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { KdsFilterStatus } from './kdsTypes';

interface KdsEmptyStateProps {
  filterStatus: KdsFilterStatus;
}

export const KdsEmptyState: React.FC<KdsEmptyStateProps> = ({ filterStatus }) => {
  return (
    <div className="flex flex-col items-center justify-center text-slate-500 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800/80 max-w-md w-full p-8 text-center my-auto shadow-xl">
      <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 mb-4 text-slate-500">
        <UtensilsCrossed className="h-12 w-12 stroke-[1.2]" />
      </div>
      <h3 className="font-black text-white text-base">
        {filterStatus === 'HANYA_SELESAI' ? 'Belum Ada Riwayat Selesai' : 'Antrean Dapur Bersih'}
      </h3>
      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
        {filterStatus === 'HANYA_SELESAI'
          ? 'Belum ada pesanan yang selesai disajikan pada stan ini.'
          : 'Tidak ada pesanan aktif yang harus dimasak koki saat ini. Semua pesanan telah disajikan!'}
      </p>
    </div>
  );
};
