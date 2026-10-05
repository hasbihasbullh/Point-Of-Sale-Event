/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Order } from '../../types';
import { KdsAction, ConfirmingOrderState } from './kdsTypes';
import { getElapsedTimeBadge } from './kdsUtils';
import {
  Monitor, ChefHat, FileText, CheckSquare, Square,
  AlertCircle, Play, Check, RotateCcw
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface KdsOrderCardProps {
  order: Order;
  now: number;
  completedItemIds: Set<string>;
  onToggleItem: (itemId: string) => void;
  confirmingOrder: ConfirmingOrderState;
  onActionClick: (orderId: string, action: KdsAction) => void;
}

export const KdsOrderCard: React.FC<KdsOrderCardProps> = ({
  order,
  now,
  completedItemIds,
  onToggleItem,
  confirmingOrder,
  onActionClick,
}) => {
  const { text: elapsedTxt, badgeClass, isUrgent } = getElapsedTimeBadge(order.created_at, now);
  const isConfirmingThis = confirmingOrder?.id === order.id;

  // Filter out non-kitchen items if any
  const kitchenItems = order.items.filter((it) => it.kds_display !== false);
  const displayItems = kitchenItems.length > 0 ? kitchenItems : order.items;

  const isOrderBaru = order.status === 'BARU';
  const isOrderDiproses = order.status === 'DIPROSES';
  const isOrderSelesai = order.status === 'SELESAI';

  return (
    <div
      className={cn(
        'bg-slate-900 border rounded-3xl p-4.5 shadow-xl flex flex-col justify-between transition-all duration-200 relative overflow-hidden',
        isOrderBaru && 'border-amber-500/40 ring-1 ring-amber-500/20 bg-gradient-to-b from-amber-950/10 to-slate-900',
        isOrderDiproses && 'border-sky-500/40 ring-1 ring-sky-500/20 bg-gradient-to-b from-sky-950/10 to-slate-900',
        isOrderSelesai && 'border-slate-800/80 opacity-70 hover:opacity-100',
        isUrgent && isOrderBaru && 'border-rose-500 ring-2 ring-rose-500/30'
      )}
    >
      {/* Card Header: Order Number, Source, Table & Elapsed Timer */}
      <div className="pb-3 border-b border-slate-800/80">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-2xl font-black text-white font-mono tracking-tight leading-none">
            #{order.nomor_order}
          </h3>

          {/* Elapsed Timer Badge */}
          {!isOrderSelesai && (
            <span className={cn('px-2.5 py-1 text-[10.5px] font-mono font-bold rounded-xl border shrink-0', badgeClass)}>
              {elapsedTxt}
            </span>
          )}
        </div>

        {/* Second Row: Source & Time (Left) | Nama / Meja (Right) */}
        <div className="flex items-center justify-between gap-2 mt-2.5">
          {/* Left: Source Pill & Order Time */}
          <div className="flex items-center gap-1.5 shrink-0">
            {order.sumber === 'KIOSK' ? (
              <span className="text-[9px] uppercase font-bold tracking-wider bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono px-2 py-0.5 rounded-md flex items-center gap-1">
                <Monitor className="h-3 w-3 shrink-0" />
                <span>Kiosk</span>
              </span>
            ) : (
              <span className="text-[9px] uppercase font-bold tracking-wider bg-orange-950/80 text-orange-300 border border-orange-800/60 font-mono px-2 py-0.5 rounded-md flex items-center gap-1">
                <ChefHat className="h-3 w-3 shrink-0" />
                <span>Kasir</span>
              </span>
            )}

            <span className="text-[10px] font-mono text-slate-400">
              {new Date(order.created_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Right: Nama / Meja */}
          {order.nama_pelanggan ? (
            <div
              className="bg-slate-800/90 border border-slate-700/70 text-[10.5px] font-bold text-amber-300 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 truncate max-w-[150px]"
              title={order.nama_pelanggan}
            >
              <span className="text-slate-400 font-normal shrink-0">Meja:</span>
              <span className="truncate">{order.nama_pelanggan}</span>
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* Card Content: Kitchen Items with Interactive Cook Checklist */}
      <div className="flex-1 py-3.5 space-y-3">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span>Menu Masak ({displayItems.length})</span>
          <span className="text-[9.5px] font-normal lowercase text-slate-400">ketuk menu untuk coret</span>
        </div>

        <div className="space-y-2.5">
          {displayItems.map((item) => {
            const isItemDone = completedItemIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => onToggleItem(item.id)}
                className={cn(
                  'p-2 rounded-xl transition-all cursor-pointer border flex flex-col gap-1',
                  isItemDone
                    ? 'bg-slate-950/60 border-slate-800/40 opacity-40'
                    : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-800/80'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className={cn('text-lg font-black font-mono shrink-0', isItemDone ? 'text-slate-500' : 'text-orange-400')}>
                      {item.qty}x
                    </span>
                    <span className={cn('font-bold text-sm leading-snug', isItemDone ? 'line-through text-slate-400' : 'text-white')}>
                      {item.nama_item}
                    </span>
                  </div>

                  <div className="shrink-0 mt-0.5 text-slate-500">
                    {isItemDone ? (
                      <CheckSquare className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-600 hover:text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Item Cooking Notes */}
                {item.catatan && (
                  <div className="bg-amber-950/50 border border-amber-900/50 text-[10.5px] text-amber-300 font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1.5 ml-6">
                    <FileText className="h-3 w-3 text-amber-400 shrink-0" />
                    <span>*{item.catatan}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Action Footer with Double-Tap Protection */}
      <div className="pt-3 border-t border-slate-800/80 mt-1">
        {isOrderBaru && (
          <Button
            type="button"
            onClick={() => onActionClick(order.id, 'DIPROSES')}
            id={`btn-kds-proses-${order.id}`}
            className={cn(
              'w-full py-3 h-11 text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer',
              isConfirmingThis && confirmingOrder?.action === 'DIPROSES'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 animate-pulse ring-2 ring-amber-400'
                : 'bg-sky-600 hover:bg-sky-500 text-white'
            )}
          >
            {isConfirmingThis && confirmingOrder?.action === 'DIPROSES' ? (
              <>
                <AlertCircle className="h-4 w-4 animate-bounce" />
                <span>YAKIN PROSES? (KETUK LAGI)</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>PROSES MASAK</span>
              </>
            )}
          </Button>
        )}

        {isOrderDiproses && (
          <Button
            type="button"
            onClick={() => onActionClick(order.id, 'SELESAI')}
            id={`btn-kds-selesai-${order.id}`}
            className={cn(
              'w-full py-3 h-11 text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer',
              isConfirmingThis && confirmingOrder?.action === 'SELESAI'
                ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            )}
          >
            {isConfirmingThis && confirmingOrder?.action === 'SELESAI' ? (
              <>
                <AlertCircle className="h-4 w-4 animate-bounce" />
                <span>YAKIN SELESAI? (KETUK LAGI)</span>
              </>
            ) : (
              <>
                <Check className="h-4.5 w-4.5 stroke-[3]" />
                <span>SAJIKAN / SELESAI</span>
              </>
            )}
          </Button>
        )}

        {isOrderSelesai && (
          <div className="space-y-2">
            <div className="bg-slate-950/80 rounded-xl py-2 px-3 text-center border border-slate-800 text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 shadow-inner">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>SUDAH DISAJIKAN</span>
            </div>
            <Button
              type="button"
              onClick={() => onActionClick(order.id, 'KEMBALIKAN')}
              id={`btn-kds-kembalikan-${order.id}`}
              className={cn(
                'w-full py-2.5 h-10 text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border',
                isConfirmingThis && confirmingOrder?.action === 'KEMBALIKAN'
                  ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400 animate-pulse ring-2 ring-rose-400'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              )}
            >
              {isConfirmingThis && confirmingOrder?.action === 'KEMBALIKAN' ? (
                <>
                  <AlertCircle className="h-4 w-4 animate-bounce" />
                  <span>YAKIN KEMBALIKAN? (KETUK LAGI)</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 text-slate-400" />
                  <span>KEMBALIKAN KE ANTREAN</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
