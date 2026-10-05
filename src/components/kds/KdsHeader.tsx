/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EventSetting } from '../../types';
import { KdsFilterStatus } from './kdsTypes';
import { ChefHat, Check, Volume2, VolumeX, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KdsHeaderProps {
  boothNama: string;
  eventSetting?: EventSetting;
  now: number;
  baruCount: number;
  prosesCount: number;
  selesaiCount: number;
  activeCount: number;
  filterStatus: KdsFilterStatus;
  setFilterStatus: (status: KdsFilterStatus) => void;
  isMuted: boolean;
  toggleMute: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const KdsHeader: React.FC<KdsHeaderProps> = ({
  boothNama,
  eventSetting,
  now,
  baruCount,
  prosesCount,
  selesaiCount,
  activeCount,
  filterStatus,
  setFilterStatus,
  isMuted,
  toggleMute,
  isFullscreen,
  toggleFullscreen,
  isLoading,
  onRefresh,
}) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
      {/* Booth Brand & Event Info */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-orange-500 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
              KDS
            </span>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
              {boothNama}
            </h1>
            {eventSetting?.nama_event && (
              <span className="hidden md:inline-block text-[10px] font-bold text-slate-400 bg-slate-800/90 border border-slate-700/60 px-2 py-0.5 rounded-full">
                {eventSetting.nama_event}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Kitchen Display System • {eventSetting?.area_lokasi || 'Antrean Dapur Real-time'}
          </p>
        </div>
      </div>

      {/* Header Right Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Quick Counter Badges & Real-time Clock */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
          {/* Live Clock */}
          <div className="px-2.5 py-0.5 text-center border-r border-slate-800">
            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Jam</span>
            <span className="font-mono font-black text-emerald-400 text-sm">
              {new Date(now).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
          <div className="px-2.5 py-0.5 text-center border-r border-slate-800">
            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Baru</span>
            <span className="font-black text-amber-400 text-sm">{baruCount}</span>
          </div>
          <div className="px-2.5 py-0.5 text-center border-r border-slate-800">
            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Masak</span>
            <span className="font-black text-sky-400 text-sm">{prosesCount}</span>
          </div>
          <div className="px-2.5 py-0.5 text-center">
            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Selesai</span>
            <span className="font-black text-slate-400 text-sm">{selesaiCount}</span>
          </div>
        </div>

        {/* Filter Switcher Tabs */}
        <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shrink-0">
          <button
            onClick={() => setFilterStatus('BELUM_SELESAI')}
            className={cn(
              'text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
              filterStatus === 'BELUM_SELESAI'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <ChefHat className="h-3.5 w-3.5" />
            <span>Dapur Aktif ({activeCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('HANYA_SELESAI')}
            className={cn(
              'text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
              filterStatus === 'HANYA_SELESAI'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Check className="h-3.5 w-3.5" />
            <span>Riwayat Selesai ({selesaiCount})</span>
          </button>
        </div>

        {/* Audio Mute/Unmute Toggle */}
        <button
          onClick={toggleMute}
          className={cn(
            'p-2 rounded-xl border transition-colors cursor-pointer',
            !isMuted
              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          )}
          title={isMuted ? 'Suara Bel Nonaktif' : 'Suara Bel Aktif'}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer"
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh Dapur'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>

        {/* Manual Refresh */}
        <button
          onClick={onRefresh}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer"
          title="Segarkan Antrean"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin text-orange-400')} />
        </button>
      </div>
    </header>
  );
};
