/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Booth, Order, EventSetting } from '../types';
import { cn } from '../lib/utils';
import {
  KdsFilterStatus,
  KdsAction,
  ConfirmingOrderState,
  playPOSChime,
  KdsSoundUnlockModal,
  KdsHeader,
  KdsOrderCard,
  KdsEmptyState,
  KdsErrorState,
} from './kds';

interface KdsPanelProps {
  boothKode: string;
  booths: Booth[];
  eventSetting?: EventSetting;
  onRefreshData: () => Promise<void>;
  onNavigateHome: () => void;
}

export default function KdsPanel({
  boothKode,
  booths,
  eventSetting,
  onRefreshData,
  onNavigateHome,
}: KdsPanelProps) {
  const currentBooth = booths.find(
    (b) => b.kode.toUpperCase() === boothKode.toUpperCase()
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<KdsFilterStatus>('BELUM_SELESAI');
  const [isLoading, setIsLoading] = useState(false);
  const [soundUnlocked, setSoundUnlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Local item-level strikethrough checklist state for kitchen staff
  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(new Set());

  // Real-time clock ticker (1s) to update live clock and elapsed time badges
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Track previous order IDs to play audio chimes on new arrivals
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDoneRef = useRef(false);

  // Tablet touch prevention: double-tap confirmation state
  const [confirmingOrder, setConfirmingOrder] = useState<ConfirmingOrderState>(null);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Gagal beralih ke layar penuh:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Gagal keluar dari layar penuh:', err);
      });
    }
  };

  const handleActionClick = (orderId: string, action: KdsAction) => {
    if (confirmingOrder && confirmingOrder.id === orderId && confirmingOrder.action === action) {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
      setConfirmingOrder(null);
      updateStatus(orderId, action === 'KEMBALIKAN' ? 'DIPROSES' : action);
    } else {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
      setConfirmingOrder({ id: orderId, action });
      confirmTimeoutRef.current = setTimeout(() => {
        setConfirmingOrder(null);
      }, 3000); // 3-second auto-reset
    }
  };

  const toggleItemCompleted = (itemId: string) => {
    setCompletedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Fetch KDS active orders for this specific booth
  const fetchKdsOrders = async () => {
    if (!currentBooth) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders/active/${currentBooth.id}`);
      if (res.ok) {
        const sorted = await res.json();
        setOrders(sorted);

        // Sound chime analysis
        const currentIds = sorted.filter((o: Order) => o.status !== 'SELESAI').map((o: Order) => o.id);
        const prevIds = prevOrderIdsRef.current;

        let hasNewOrder = false;
        for (const id of currentIds) {
          if (!prevIds.has(id)) {
            hasNewOrder = true;
            break;
          }
        }

        prevOrderIdsRef.current = new Set(currentIds);

        if (hasNewOrder && initialFetchDoneRef.current) {
          playPOSChime(isMuted);
        }

        initialFetchDoneRef.current = true;
      }
    } catch (err) {
      console.error('KDS Network error', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time EventSource (SSE) for KDS orders and system broadcast
  useEffect(() => {
    if (!currentBooth) return;

    fetchKdsOrders();

    const eventSource = new EventSource(`/api/kds-stream/${currentBooth.id}`);
    const sysSource = new EventSource('/api/sys-stream');

    eventSource.onmessage = () => {
      fetchKdsOrders();
    };

    sysSource.onmessage = () => {
      onRefreshData();
      fetchKdsOrders();
    };

    eventSource.onerror = () => {
      console.warn('KDS SSE Connection lost. Reconnecting...');
    };

    return () => {
      eventSource.close();
      sysSource.close();
    };
  }, [currentBooth?.id]);

  // Update order status
  const updateStatus = async (orderId: string, newStatus: 'BARU' | 'DIPROSES' | 'SELESAI') => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        onRefreshData();
      }
    } catch (e) {
      alert('Koneksi server terputus');
    }
  };

  // Filtered orders list
  const ordersFiltered = useMemo(() => {
    return orders
      .filter((o) => {
        if (filterStatus === 'SEMUA') return true;
        if (filterStatus === 'HANYA_SELESAI') return o.status === 'SELESAI';
        return o.status === 'BARU' || o.status === 'DIPROSES';
      })
      .sort((a, b) => {
        if (filterStatus === 'HANYA_SELESAI') {
          return b.created_at.localeCompare(a.created_at);
        }
        return a.created_at.localeCompare(b.created_at); // Earliest orders first for kitchen queue
      });
  }, [orders, filterStatus]);

  // Metric counts
  const activeCount = orders.filter((o) => o.status !== 'SELESAI').length;
  const baruCount = orders.filter((o) => o.status === 'BARU').length;
  const prosesCount = orders.filter((o) => o.status === 'DIPROSES').length;
  const selesaiCount = orders.filter((o) => o.status === 'SELESAI').length;

  // Error guards
  if (!currentBooth) {
    return <KdsErrorState type="not_found" boothKode={boothKode} onNavigateHome={onNavigateHome} />;
  }

  if (!currentBooth.aktif) {
    return <KdsErrorState type="inactive" boothNama={currentBooth.nama} onNavigateHome={onNavigateHome} />;
  }

  if (currentBooth.kds_active === false) {
    return <KdsErrorState type="kds_disabled" boothNama={currentBooth.nama} onNavigateHome={onNavigateHome} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative antialiased select-none">
      {/* Sound Unlock Overlay Modal */}
      {!soundUnlocked && (
        <KdsSoundUnlockModal
          boothNama={currentBooth.nama}
          onUnlock={() => {
            setSoundUnlocked(true);
            playPOSChime(false);
          }}
          onSkip={() => {
            setSoundUnlocked(true);
            setIsMuted(true);
          }}
        />
      )}

      {/* Top Navigation Header */}
      <KdsHeader
        boothNama={currentBooth.nama}
        eventSetting={eventSetting}
        now={now}
        baruCount={baruCount}
        prosesCount={prosesCount}
        selesaiCount={selesaiCount}
        activeCount={activeCount}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        isMuted={isMuted}
        toggleMute={() => {
          setIsMuted(!isMuted);
          if (isMuted) setTimeout(() => playPOSChime(false), 100);
        }}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        isLoading={isLoading}
        onRefresh={fetchKdsOrders}
      />

      {/* Main KDS Order Cards Grid Stream */}
      <main className={cn('flex-1 p-4 sm:p-6 overflow-y-auto', ordersFiltered.length === 0 && 'flex flex-col items-center justify-center')}>
        {ordersFiltered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {ordersFiltered.map((order) => (
              <KdsOrderCard
                key={order.id}
                order={order}
                now={now}
                completedItemIds={completedItemIds}
                onToggleItem={toggleItemCompleted}
                confirmingOrder={confirmingOrder}
                onActionClick={handleActionClick}
              />
            ))}
          </div>
        ) : (
          <KdsEmptyState filterStatus={filterStatus} />
        )}
      </main>
    </div>
  );
}
