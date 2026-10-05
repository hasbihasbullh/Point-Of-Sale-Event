/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { KioskNode, ConsolidationLog, ReportSummary, EventSetting } from '../../types';
import { formatIDR } from './adminTypes';
import {
  Database,
  Server,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Zap,
  Send,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  Laptop,
  MapPin,
  Download,
  HardDrive,
  FileSpreadsheet,
  Upload,
  History,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface AdminConsolidationTabProps {
  report: ReportSummary | null;
  eventSetting: EventSetting | null;
  onRefreshData: () => Promise<void>;
  fetchReports: () => Promise<void>;
  checkAuth: (res: Response) => boolean;
}

const DEFAULT_KIOSK_NODES: KioskNode[] = [
  { id: 'node_1', nama: 'Terminal 01 - Kasir Gate Barat', url: 'http://192.168.1.15:3000', lokasi: 'Pintu Masuk Utama', status: 'offline' },
  { id: 'node_2', nama: 'Terminal 02 - Food Court', url: 'http://192.168.1.16:3000', lokasi: 'Lobby Area Makan', status: 'offline' },
  { id: 'node_3', nama: 'Terminal 03 - VIP Panggung', url: 'http://192.168.1.17:3000', lokasi: 'Area Stage & VIP', status: 'offline' },
];

export const AdminConsolidationTab: React.FC<AdminConsolidationTabProps> = ({
  report,
  eventSetting,
  onRefreshData,
  fetchReports,
  checkAuth,
}) => {
  const [kioskNodes, setKioskNodes] = useState<KioskNode[]>(() => {
    try {
      const saved = localStorage.getItem('pos_kiosk_fleet_nodes');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_KIOSK_NODES;
  });

  const [consolidationLogs, setConsolidationLogs] = useState<ConsolidationLog[]>(() => {
    try {
      const saved = localStorage.getItem('pos_consolidation_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [serverInfo, setServerInfo] = useState<{
    hostname: string;
    addresses: { interface: string; ip: string; url: string }[];
    serverTime: string;
  } | null>(null);

  const [kioskTargetUrl, setKioskTargetUrl] = useState('http://192.168.1.15:3000');
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [isBatchConsolidating, setIsBatchConsolidating] = useState(false);
  const [activeNodeActionId, setActiveNodeActionId] = useState<string | null>(null);
  const [activeNodeActionType, setActiveNodeActionType] = useState<'ping' | 'pull' | 'push' | null>(null);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<{ id?: string; nama: string; url: string; lokasi: string } | null>(null);

  const [consolidationResult, setConsolidationResult] = useState<{
    type: 'success' | 'error';
    message: string;
    targetUrl?: string;
    summary?: {
      addedCount: number;
      skippedCount: number;
      voidUpdatedCount: number;
      revenueAdded: number;
      totalProcessed: number;
    };
  } | null>(null);

  const updateKioskNodesState = (newNodes: KioskNode[]) => {
    setKioskNodes(newNodes);
    localStorage.setItem('pos_kiosk_fleet_nodes', JSON.stringify(newNodes));
  };

  const addConsolidationLog = (log: Omit<ConsolidationLog, 'id' | 'timestamp'>) => {
    const newLog: ConsolidationLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setConsolidationLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 50);
      localStorage.setItem('pos_consolidation_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const fetchServerInfo = async () => {
    try {
      const res = await fetch('/api/server-info');
      if (res.ok) {
        const data = await res.json();
        setServerInfo(data);
      }
    } catch (err) {}
  };

  const handlePingNode = async (node: KioskNode) => {
    setActiveNodeActionId(node.id);
    setActiveNodeActionType('ping');
    try {
      const token = sessionStorage.getItem('pos_admin_token');
      const res = await fetch('/api/consolidate/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUrl: node.url }),
      });
      const data = await res.json();
      const updated = kioskNodes.map((n) => {
        if (n.id === node.id) {
          return {
            ...n,
            status: data.online ? ('online' as const) : ('offline' as const),
            latency: data.latency,
            totalOrders: data.ordersCount !== undefined ? data.ordersCount : n.totalOrders,
            lastSync: data.online ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : n.lastSync,
          };
        }
        return n;
      });
      updateKioskNodesState(updated);
    } catch (err) {
      const updated = kioskNodes.map((n) => (n.id === node.id ? { ...n, status: 'offline' as const, latency: undefined } : n));
      updateKioskNodesState(updated);
    } finally {
      setActiveNodeActionId(null);
      setActiveNodeActionType(null);
    }
  };

  const handlePingAllNodes = async () => {
    for (const node of kioskNodes) {
      handlePingNode(node);
    }
  };

  const handlePullNode = async (node: KioskNode) => {
    setActiveNodeActionId(node.id);
    setActiveNodeActionType('pull');
    setIsConsolidating(true);
    setConsolidationResult(null);

    try {
      const token = sessionStorage.getItem('pos_admin_token');
      const res = await fetch('/api/consolidate/pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUrl: node.url }),
      });

      if (!checkAuth(res)) return;

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menarik data dari Kiosk');
      }

      setConsolidationResult({
        type: 'success',
        message: `Berhasil menarik data dari ${node.nama}`,
        targetUrl: node.url,
        summary: data.summary,
      });

      addConsolidationLog({
        source: node.nama,
        sourceType: 'network',
        addedCount: data.summary?.addedCount || 0,
        skippedCount: data.summary?.skippedCount || 0,
        voidUpdatedCount: data.summary?.voidUpdatedCount || 0,
        revenueAdded: data.summary?.revenueAdded || 0,
        status: 'success',
        message: `Tarik ${data.summary?.addedCount || 0} order baru`,
      });

      const updated = kioskNodes.map((n) =>
        n.id === node.id
          ? {
              ...n,
              status: 'online' as const,
              lastSync: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            }
          : n
      );
      updateKioskNodesState(updated);

      await fetchReports();
      await onRefreshData();
    } catch (err: any) {
      setConsolidationResult({
        type: 'error',
        message: `Gagal menarik data dari ${node.nama}: ${err.message}`,
      });
      addConsolidationLog({
        source: node.nama,
        sourceType: 'network',
        addedCount: 0,
        skippedCount: 0,
        voidUpdatedCount: 0,
        revenueAdded: 0,
        status: 'error',
        message: err.message,
      });
    } finally {
      setIsConsolidating(false);
      setActiveNodeActionId(null);
      setActiveNodeActionType(null);
    }
  };

  const handlePushMasterToNode = async (node: KioskNode) => {
    setActiveNodeActionId(node.id);
    setActiveNodeActionType('push');
    try {
      const token = sessionStorage.getItem('pos_admin_token');
      const res = await fetch('/api/consolidate/push-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUrl: node.url }),
      });
      if (!checkAuth(res)) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mendistribusikan master data');
      alert(`Sukses: Master Data & Pengaturan Event berhasil dikirim ke ${node.nama}!`);
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setActiveNodeActionId(null);
      setActiveNodeActionType(null);
    }
  };

  const handleBatchPullAll = async () => {
    if (kioskNodes.length === 0) {
      alert('Belum ada terminal Kiosk yang terdaftar');
      return;
    }

    setIsBatchConsolidating(true);
    setConsolidationResult(null);

    try {
      const token = sessionStorage.getItem('pos_admin_token');
      const urls = kioskNodes.map((n) => n.url);
      const res = await fetch('/api/consolidate/pull-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUrls: urls }),
      });

      if (!checkAuth(res)) return;

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal melakukan konsolidasi massal');

      setConsolidationResult({
        type: 'success',
        message: data.message,
        summary: {
          addedCount: data.totalAdded,
          skippedCount: data.totalSkipped,
          voidUpdatedCount: data.totalVoidUpdated,
          revenueAdded: data.totalRevenueAdded,
          totalProcessed: data.totalAdded + data.totalSkipped,
        },
      });

      addConsolidationLog({
        source: `Batch Fleet (${urls.length} Kiosk)`,
        sourceType: 'batch',
        addedCount: data.totalAdded,
        skippedCount: data.totalSkipped,
        voidUpdatedCount: data.totalVoidUpdated,
        revenueAdded: data.totalRevenueAdded,
        status: 'success',
        message: data.message,
      });

      await fetchReports();
      await onRefreshData();
      handlePingAllNodes();
    } catch (err: any) {
      setConsolidationResult({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat batch konsolidasi',
      });
    } finally {
      setIsBatchConsolidating(false);
    }
  };

  const handlePushMasterToAllNodes = async () => {
    if (
      !confirm(`Apakah Anda yakin ingin mengirim Master Menu & Pengaturan Event ke seluruh ${kioskNodes.length} Kiosk?`)
    )
      return;
    setIsConsolidating(true);
    let successCount = 0;
    for (const node of kioskNodes) {
      try {
        const token = sessionStorage.getItem('pos_admin_token');
        const res = await fetch('/api/consolidate/push-master', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ targetUrl: node.url }),
        });
        if (res.ok) successCount++;
      } catch (e) {}
    }
    setIsConsolidating(false);
    alert(`Distribusi Selesai: Master data terkirim ke ${successCount} dari ${kioskNodes.length} Kiosk.`);
  };

  const handleSaveNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode || !editingNode.nama.trim() || !editingNode.url.trim()) return;

    let targetUrl = editingNode.url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `http://${targetUrl}`;
    }
    targetUrl = targetUrl.replace(/\/+$/, '');

    if (editingNode.id) {
      // Edit
      const updated = kioskNodes.map((n) =>
        n.id === editingNode.id
          ? {
              ...n,
              nama: editingNode.nama.trim(),
              url: targetUrl,
              lokasi: editingNode.lokasi.trim(),
            }
          : n
      );
      updateKioskNodesState(updated);
    } else {
      // Create new
      const newNode: KioskNode = {
        id: `node_${Date.now()}`,
        nama: editingNode.nama.trim(),
        url: targetUrl,
        lokasi: editingNode.lokasi.trim(),
        status: 'offline',
      };
      updateKioskNodesState([...kioskNodes, newNode]);
    }
    setIsNodeModalOpen(false);
    setEditingNode(null);
  };

  const handleDeleteNode = (id: string) => {
    if (!confirm('Hapus perangkat Kiosk ini dari daftar armada?')) return;
    const updated = kioskNodes.filter((n) => n.id !== id);
    updateKioskNodesState(updated);
  };

  const handleClearLogs = () => {
    if (!confirm('Bersihkan seluruh riwayat log audit konsolidasi?')) return;
    setConsolidationLogs([]);
    localStorage.removeItem('pos_consolidation_logs');
  };

  const handleExportConsolidatedExcel = () => {
    if (!report?.raw_orders || report.raw_orders.length === 0) {
      alert('Belum ada data transaksi yang dapat diexport');
      return;
    }

    const wb = XLSX.utils.book_new();

    const grossRevenue = (report.revenue_total || 0) + (report.total_diskon || 0);
    const netRevenue = report.revenue_total || 0;
    const totalDiskon = report.total_diskon || 0;
    const cashTotal = report.payment_stats?.CASH || 0;
    const qrisTotal = report.payment_stats?.QRIS || 0;
    const edcTotal = report.payment_stats?.EDC || 0;
    const nonCashTotal = qrisTotal + edcTotal;

    // Sheet 1: Ringkasan Konsolidasi
    const summaryRows = [
      ['LAPORAN KONSOLIDASI DATA MULTI-TERMINAL POS (KASIR & KIOSK)'],
      ['Nama Event / Festival', eventSetting?.nama_event || 'Event Festival'],
      ['Lokasi / Venue', eventSetting?.area_lokasi || 'Venue'],
      ['Client / Merchant Utama', eventSetting?.client_merchant || 'Merchant'],
      ['Waktu Export Data', new Date().toLocaleString('id-ID')],
      [],
      ['1. REKAPITULASI FINANSIAL UTAMA', 'NILAI (IDR)', 'KETERANGAN'],
      ['Omset Penjualan Kotor (Gross Sales)', grossRevenue, 'Total nilai seluruh item sebelum potongan voucher'],
      ['Total Subsidi Voucher / Diskon', totalDiskon, 'Nilai potongan kupon promosi yang disubsidi panitia'],
      ['Total Omset Bersih (Net Revenue)', netRevenue, 'Realisasi uang sah yang masuk kasir / rekening stan'],
      ['Total Transaksi Berhasil (Struk Lunas)', report.transactions_count || 0, 'Jumlah struk / nomor order selesai'],
      ['Total Volume Item Terjual (Porsi/Cup)', report.items_sold_count || 0, 'Kuantitas fisik seluruh menu yang laku'],
      ['Total Transaksi Dibatalkan (VOID)', report.voided_count || 0, 'Pesanan dibatalkan (stok balik & tidak dihitung omset)'],
      [],
      ['2. DISTRIBUSI SALURAN PEMBAYARAN', 'TOTAL NOMINAL (IDR)', 'PORSI ARUS KAS (%)', 'INSTRUMEN PENERIMAAN'],
      ['Uang Tunai (CASH)', cashTotal, netRevenue > 0 ? `${((cashTotal / netRevenue) * 100).toFixed(1)}%` : '0%', 'Uang fisik di laci kasir stan'],
      ['QRIS Digital Statis / Dinamis', qrisTotal, netRevenue > 0 ? `${((qrisTotal / netRevenue) * 100).toFixed(1)}%` : '0%', 'Scan QRIS (masuk rekening agregator)'],
      ['Mesin EDC Bank / Kartu', edcTotal, netRevenue > 0 ? `${((edcTotal / netRevenue) * 100).toFixed(1)}%` : '0%', 'Debit/Kredit via mesin gesek EDC'],
      ['Total Penerimaan Non-Tunai (QRIS + EDC)', nonCashTotal, netRevenue > 0 ? `${((nonCashTotal / netRevenue) * 100).toFixed(1)}%` : '0%', 'Akumulasi transaksi non-tunai'],
      ['TOTAL PENERIMAAN KAS', cashTotal + qrisTotal + edcTotal, '100%', 'Total uang riil masuk seluruh instrumen'],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 42 }, { wch: 24 }, { wch: 22 }, { wch: 48 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Konsolidasi');

    // Sheet 2: Per Stan (Booth Breakdown)
    const boothHeaders = [
      'Kode Stan',
      'Nama Stan',
      'Total Omset Bersih (IDR)',
      'Jumlah Transaksi',
      'Item Terjual (Porsi)',
      'Cash Fisik (IDR)',
      'QRIS Digital (IDR)',
      'Mesin EDC (IDR)',
      'Total Non-Tunai (IDR)',
      'Voucher Promo (IDR)',
      'Omset Kotor (IDR)',
    ];

    const boothStatsList = report.booth_stats || [];
    const boothRows: (string | number)[][] = boothStatsList.map((b) => [
      b.booth_kode,
      b.booth_nama,
      b.revenue,
      b.sales_count,
      b.qty_items,
      b.payment_cash,
      b.payment_qris,
      b.payment_edc,
      (b.payment_qris || 0) + (b.payment_edc || 0),
      b.diskon,
      (b.revenue || 0) + (b.diskon || 0),
    ]);

    // Grand Total Row
    const sumRev = boothStatsList.reduce((acc, b) => acc + (b.revenue || 0), 0);
    const sumSales = boothStatsList.reduce((acc, b) => acc + (b.sales_count || 0), 0);
    const sumItems = boothStatsList.reduce((acc, b) => acc + (b.qty_items || 0), 0);
    const sumCash = boothStatsList.reduce((acc, b) => acc + (b.payment_cash || 0), 0);
    const sumQris = boothStatsList.reduce((acc, b) => acc + (b.payment_qris || 0), 0);
    const sumEdc = boothStatsList.reduce((acc, b) => acc + (b.payment_edc || 0), 0);
    const sumNonCash = sumQris + sumEdc;
    const sumDiskon = boothStatsList.reduce((acc, b) => acc + (b.diskon || 0), 0);
    const sumGross = sumRev + sumDiskon;

    boothRows.push([
      'TOTAL',
      `${boothStatsList.length} Stan Terkonsolidasi`,
      sumRev,
      sumSales,
      sumItems,
      sumCash,
      sumQris,
      sumEdc,
      sumNonCash,
      sumDiskon,
      sumGross,
    ]);

    const wsBooth = XLSX.utils.aoa_to_sheet([boothHeaders, ...boothRows]);
    wsBooth['!cols'] = [
      { wch: 12 },
      { wch: 28 },
      { wch: 24 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 20 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, wsBooth, 'Rekap Per Stan');

    // Sheet 3: Semua Transaksi Konsolidasi
    const orderHeaders = [
      'ID Order',
      'Waktu & Tanggal',
      'Kode Stan',
      'Nama Stan',
      'Nomor Order',
      'Terminal / Sumber',
      'Nama Pelanggan',
      'Metode Bayar',
      'No. Referensi',
      'Total Tagihan (IDR)',
      'Diskon Voucher (IDR)',
      'Omset Kotor (IDR)',
      'Status Order',
      'Rincian Item Pesanan',
    ];

    const rawOrdersList = report.raw_orders || [];
    const orderRows: (string | number)[][] = rawOrdersList.map((ord) => {
      const itemStr = (ord.items || [])
        .map((i) => `${i.qty}x ${i.nama_item}${i.catatan ? ` (*${i.catatan})` : ''}`)
        .join('; ');
      const ordGross = (ord.total || 0) + (ord.diskon || 0);

      return [
        ord.id,
        ord.created_at.replace('T', ' ').substring(0, 19),
        ord.booth_kode,
        ord.booth_nama,
        ord.nomor_order,
        ord.sumber || 'KASIR',
        ord.nama_pelanggan || '-',
        ord.metode_bayar,
        ord.no_referensi || '-',
        ord.total,
        ord.diskon || 0,
        ordGross,
        ord.status,
        itemStr,
      ];
    });

    const sumOrdNet = rawOrdersList.filter((o) => o.status !== 'VOID').reduce((acc, o) => acc + (o.total || 0), 0);
    const sumOrdDiskon = rawOrdersList.filter((o) => o.status !== 'VOID').reduce((acc, o) => acc + (o.diskon || 0), 0);
    const sumOrdGross = sumOrdNet + sumOrdDiskon;

    orderRows.push([
      'TOTAL TRANSAKSI LUNAS',
      '-',
      '-',
      '-',
      `${rawOrdersList.filter((o) => o.status !== 'VOID').length} Struk Sah`,
      '-',
      '-',
      '-',
      '-',
      sumOrdNet,
      sumOrdDiskon,
      sumOrdGross,
      'SELESAI',
      '-',
    ]);

    const wsOrders = XLSX.utils.aoa_to_sheet([orderHeaders, ...orderRows]);
    wsOrders['!cols'] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 24 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 14 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
      { wch: 14 },
      { wch: 55 },
    ];
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Data Transaksi Konsolidasi');

    XLSX.writeFile(
      wb,
      `Laporan_Konsolidasi_POS_${eventSetting?.nama_event?.replace(/\s+/g, '_') || 'Event'}_${
        new Date().toISOString().split('T')[0]
      }.xlsx`
    );
  };

  const handlePullKioskData = async () => {
    if (!kioskTargetUrl.trim()) {
      alert('Masukkan IP / URL Server Kiosk terlebih dahulu');
      return;
    }

    setIsConsolidating(true);
    setConsolidationResult(null);

    try {
      const token = sessionStorage.getItem('pos_admin_token');
      const res = await fetch('/api/consolidate/pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUrl: kioskTargetUrl.trim() }),
      });

      if (!checkAuth(res)) return;

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menarik data dari Kiosk');
      }

      setConsolidationResult({
        type: 'success',
        message: data.message || 'Berhasil menggabungkan transaksi',
        targetUrl: data.targetUrl,
        summary: data.summary,
      });

      addConsolidationLog({
        source: kioskTargetUrl.trim(),
        sourceType: 'network',
        addedCount: data.summary?.addedCount || 0,
        skippedCount: data.summary?.skippedCount || 0,
        voidUpdatedCount: data.summary?.voidUpdatedCount || 0,
        revenueAdded: data.summary?.revenueAdded || 0,
        status: 'success',
        message: `Tarik manual ${data.summary?.addedCount || 0} order`,
      });

      await fetchReports();
      await onRefreshData();
    } catch (err: any) {
      setConsolidationResult({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat menarik data',
      });
      addConsolidationLog({
        source: kioskTargetUrl.trim(),
        sourceType: 'network',
        addedCount: 0,
        skippedCount: 0,
        voidUpdatedCount: 0,
        revenueAdded: 0,
        status: 'error',
        message: err.message,
      });
    } finally {
      setIsConsolidating(false);
    }
  };

  const handleDownloadBackupJson = async () => {
    try {
      const res = await fetch('/api/consolidate/export');
      if (!res.ok) throw new Error('Gagal mengekspor data');
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_pos_transaksi_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Gagal mendownload backup: ${err.message}`);
    }
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsConsolidating(true);
    setConsolidationResult(null);

    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      const token = sessionStorage.getItem('pos_admin_token');
      const res = await fetch('/api/consolidate/import-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!checkAuth(res)) return;

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengimpor file JSON');
      }

      setConsolidationResult({
        type: 'success',
        message: data.message || 'Berhasil mengimpor transaksi',
        summary: data.summary,
      });

      addConsolidationLog({
        source: file.name,
        sourceType: 'file',
        addedCount: data.summary?.addedCount || 0,
        skippedCount: data.summary?.skippedCount || 0,
        voidUpdatedCount: data.summary?.voidUpdatedCount || 0,
        revenueAdded: data.summary?.revenueAdded || 0,
        status: 'success',
        message: `Impor file ${file.name}`,
      });

      await fetchReports();
      await onRefreshData();
    } catch (err: any) {
      setConsolidationResult({
        type: 'error',
        message: err.message || 'Format file JSON tidak valid',
      });
      addConsolidationLog({
        source: file.name,
        sourceType: 'file',
        addedCount: 0,
        skippedCount: 0,
        voidUpdatedCount: 0,
        revenueAdded: 0,
        status: 'error',
        message: err.message,
      });
    } finally {
      setIsConsolidating(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    fetchServerInfo();
    handlePingAllNodes();
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Header Master Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-orange-500 p-3 rounded-2xl text-white shadow-md shadow-orange-500/20">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Konsolidasi Data Multi-Terminal POS
              </h2>
              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-[10px] font-bold">
                Master Server Hub
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sinkronkan transaksi dari seluruh terminal Kasir & Kiosk mandiri ke server pusat secara real-time via LAN atau file backup.
            </p>
          </div>
        </div>

        {/* Master LAN IP Address Helper */}
        {serverInfo && serverInfo.addresses && serverInfo.addresses.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs flex flex-col gap-1 shrink-0">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <Server className="h-3.5 w-3.5 text-indigo-500" />
              <span>IP Server Master ({serverInfo.hostname})</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {serverInfo.addresses.map((addr, idx) => (
                <span
                  key={idx}
                  onClick={() => {
                    navigator.clipboard?.writeText(addr.url);
                    alert(`URL disalin: ${addr.url}`);
                  }}
                  title="Klik untuk menyalin URL"
                  className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-800 font-mono text-[11px] font-bold hover:border-orange-400 hover:text-orange-600 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>{addr.url}</span>
                  <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Master Action Header Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-slate-100/50 border border-orange-200/60 rounded-3xl p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-600" />
          <span className="text-xs font-bold text-slate-800">Operasi Armada Terminal Massal:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleBatchPullAll}
            disabled={isBatchConsolidating || isConsolidating}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl px-4 py-2.5 shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            {isBatchConsolidating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            <span>{isBatchConsolidating ? 'Mengkonsolidasikan...' : 'Tarik Semua Terminal Sekaligus'}</span>
          </Button>

          <Button
            onClick={handlePushMasterToAllNodes}
            disabled={isConsolidating || isBatchConsolidating}
            variant="outline"
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-4 py-2.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5 text-blue-600" />
            <span>Distribusi Master Data ke Semua Terminal</span>
          </Button>

          <Button
            onClick={handlePingAllNodes}
            variant="outline"
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-3 py-2.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
            <span>Cek Status</span>
          </Button>
        </div>
      </div>

      {/* Results Banner Alert */}
      {consolidationResult && (
        <div
          className={`p-5 rounded-3xl text-xs border shadow-xs transition-all ${
            consolidationResult.type === 'success'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {consolidationResult.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              )}
              <span className="font-bold text-sm">{consolidationResult.message}</span>
            </div>
            <button
              onClick={() => setConsolidationResult(null)}
              className="text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {consolidationResult.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-emerald-200/60">
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Order Baru</span>
                <span className="text-base font-black text-emerald-700">
                  +{consolidationResult.summary.addedCount}
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Dilewati (Sudah Ada)</span>
                <span className="text-base font-black text-slate-700">{consolidationResult.summary.skippedCount}</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Update Status VOID</span>
                <span className="text-base font-black text-rose-700">
                  {consolidationResult.summary.voidUpdatedCount}
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Omset Bertambah</span>
                <span className="text-base font-black text-emerald-700">
                  {formatIDR(consolidationResult.summary.revenueAdded)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section: Armada Terminal Kiosk (Fleet Manager) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-orange-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Daftar Armada Terminal POS (Kasir & Kiosk) ({kioskNodes.length})
            </h3>
            <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
              {kioskNodes.filter((n) => n.status === 'online').length} Online
            </Badge>
          </div>

          <Button
            type="button"
            onClick={() => {
              setEditingNode({ nama: '', url: 'http://192.168.1.15:3000', lokasi: '' });
              setIsNodeModalOpen(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl px-3.5 py-2 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Terminal POS</span>
          </Button>
        </div>

        {/* Grid Cards of Kiosk Fleet */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kioskNodes.map((node) => {
            const isNodeActive = activeNodeActionId === node.id;
            const isOnline = node.status === 'online';

            return (
              <div
                key={node.id}
                className={`border rounded-2xl p-4 transition-all flex flex-col justify-between ${
                  isOnline
                    ? 'border-slate-200 bg-white shadow-xs hover:shadow-md'
                    : 'border-slate-200/70 bg-slate-50/60'
                }`}
              >
                <div>
                  {/* Card Header: Status Dot & Node Name */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                        }`}
                      />
                      <h4 className="font-bold text-xs text-slate-900 leading-tight">{node.nama}</h4>
                    </div>

                    {isOnline ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 border-emerald-200 text-emerald-700 text-[10px] font-bold shrink-0"
                      >
                        {node.latency !== undefined ? `${node.latency}ms` : 'Online'}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-slate-100 border-slate-200 text-slate-400 text-[10px] shrink-0"
                      >
                        Offline
                      </Badge>
                    )}
                  </div>

                  {/* Location Tag */}
                  {node.lokasi && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2 pl-4">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{node.lokasi}</span>
                    </div>
                  )}

                  {/* IP/URL */}
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px] font-mono text-slate-600 flex items-center justify-between mb-3">
                    <span className="truncate">{node.url}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {node.totalOrders !== undefined ? `${node.totalOrders} Order` : ''}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      onClick={() => handlePullNode(node)}
                      disabled={isConsolidating || isBatchConsolidating}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] py-2 rounded-xl shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download
                        className={`h-3 w-3 ${isNodeActive && activeNodeActionType === 'pull' ? 'animate-bounce' : ''}`}
                      />
                      <span>{isNodeActive && activeNodeActionType === 'pull' ? 'Menarik...' : 'Tarik Data'}</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={() => handlePushMasterToNode(node)}
                      disabled={isConsolidating || isBatchConsolidating}
                      variant="outline"
                      className="w-full border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Send
                        className={`h-3 w-3 text-blue-500 ${
                          isNodeActive && activeNodeActionType === 'push' ? 'animate-pulse' : ''
                        }`}
                      />
                      <span>Kirim Menu</span>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handlePingNode(node)}
                      disabled={isNodeActive && activeNodeActionType === 'ping'}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Activity
                        className={`h-3 w-3 text-emerald-500 ${
                          isNodeActive && activeNodeActionType === 'ping' ? 'animate-spin' : ''
                        }`}
                      />
                      <span>{isNodeActive && activeNodeActionType === 'ping' ? 'Pinging...' : 'Test Ping'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNode({ id: node.id, nama: node.nama, url: node.url, lokasi: node.lokasi || '' });
                          setIsNodeModalOpen(true);
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <span className="text-slate-200">|</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteNode(node.id)}
                        className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ad-Hoc Pull Input Box */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Tarik Manual dari URL / IP Terminal Ad-Hoc (Di Luar Daftar Armada)
          </label>
          <div className="flex gap-2 max-w-xl">
            <Input
              value={kioskTargetUrl}
              onChange={(e) => setKioskTargetUrl(e.target.value)}
              placeholder="Contoh: http://192.168.1.18:3000"
              className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-xs focus:bg-white"
            />
            <Button
              onClick={handlePullKioskData}
              disabled={isConsolidating || isBatchConsolidating}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl px-4 shrink-0 cursor-pointer"
            >
              {isConsolidating ? 'Menarik...' : 'Tarik Transaksi'}
            </Button>
          </div>
        </div>
      </div>

      {/* Section: Cadangan & Impor Offline Multi-Format */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <HardDrive className="h-4 w-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Cadangan Data & Impor Offline (Flashdisk / File)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            onClick={handleDownloadBackupJson}
            variant="outline"
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl text-xs py-5 px-4 flex items-center justify-center gap-2 shadow-xs h-auto cursor-pointer"
          >
            <Download className="h-4 w-4 text-orange-500 shrink-0" />
            <div className="text-left">
              <span className="block font-bold">Download JSON</span>
              <span className="text-[10px] text-slate-400 font-normal">Cadangan database lengkap</span>
            </div>
          </Button>

          <Button
            onClick={handleExportConsolidatedExcel}
            variant="outline"
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl text-xs py-5 px-4 flex items-center justify-center gap-2 shadow-xs h-auto cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="text-left">
              <span className="block font-bold">Export Rekap Excel</span>
              <span className="text-[10px] text-slate-400 font-normal">Spreadsheet multi-sheet</span>
            </div>
          </Button>

          <label className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl text-xs py-5 px-4 flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs h-auto">
            <Upload className="h-4 w-4 text-indigo-600 shrink-0" />
            <div className="text-left">
              <span className="block font-bold">Impor File JSON</span>
              <span className="text-[10px] text-slate-400 font-normal">Gabungkan file flashdisk</span>
            </div>
            <input type="file" accept=".json" onChange={handleImportJsonFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* Section: Riwayat Log Audit Konsolidasi (Consolidation History Log) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Riwayat Log Audit Konsolidasi ({consolidationLogs.length})
            </h3>
          </div>

          {consolidationLogs.length > 0 && (
            <button
              type="button"
              onClick={handleClearLogs}
              className="text-[11px] text-slate-400 hover:text-rose-600 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              <span>Bersihkan Log</span>
            </button>
          )}
        </div>

        {consolidationLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-6">
            Belum ada aktivitas konsolidasi pada sesi ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="pb-2.5 font-bold">Waktu</th>
                  <th className="pb-2.5 font-bold">Sumber Node / File</th>
                  <th className="pb-2.5 font-bold">Tipe</th>
                  <th className="pb-2.5 font-bold text-center">Order Baru</th>
                  <th className="pb-2.5 font-bold text-center">Dilewati</th>
                  <th className="pb-2.5 font-bold text-right">Omset Masuk</th>
                  <th className="pb-2.5 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {consolidationLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 text-slate-500">{log.timestamp}</td>
                    <td className="py-2.5 font-bold font-sans text-slate-900">{log.source}</td>
                    <td className="py-2.5 font-sans">
                      <Badge variant="outline" className="text-[9px] font-bold">
                        {log.sourceType === 'network'
                          ? 'LAN Terminal'
                          : log.sourceType === 'batch'
                          ? 'Batch All'
                          : 'File JSON'}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-center font-bold text-emerald-600">+{log.addedCount}</td>
                    <td className="py-2.5 text-center text-slate-400">{log.skippedCount}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{formatIDR(log.revenueAdded)}</td>
                    <td className="py-2.5 text-right font-sans">
                      {log.status === 'success' ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Sukses
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          Gagal
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: TAMBAH / EDIT KIOSK NODE FLEET                          */}
      {/* ============================================================== */}
      <Dialog open={isNodeModalOpen} onOpenChange={setIsNodeModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md rounded-3xl shadow-2xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Laptop className="h-5 w-5 text-orange-500" />
              <span>{editingNode?.id ? 'Edit Terminal POS' : 'Tambah Terminal / Node POS Baru'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Daftarkan identitas perangkat Kasir / Kiosk mandiri dan alamat IP lokal jaringan.
            </DialogDescription>
          </DialogHeader>

          {editingNode && (
            <form onSubmit={handleSaveNode} className="space-y-4 mt-2 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nama Terminal / Titik Kasir
                </label>
                <Input
                  value={editingNode.nama}
                  onChange={(e) => setEditingNode({ ...editingNode, nama: e.target.value })}
                  placeholder="Contoh: Terminal 01 - Kasir Gate Barat"
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Alamat IP / URL Server Terminal
                </label>
                <Input
                  value={editingNode.url}
                  onChange={(e) => setEditingNode({ ...editingNode, url: e.target.value })}
                  placeholder="Contoh: http://192.168.1.15:3000"
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl font-mono focus:bg-white"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Pastikan port (default 3000) dan protokol http:// tercantum.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Catatan Lokasi / Posisi Penempatan
                </label>
                <Input
                  value={editingNode.lokasi}
                  onChange={(e) => setEditingNode({ ...editingNode, lokasi: e.target.value })}
                  placeholder="Contoh: Lobby Utama Lantai 1 Dekat Pintu Masuk"
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white"
                />
              </div>

              <DialogFooter className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsNodeModalOpen(false)}
                  className="text-slate-500 hover:text-slate-800 text-xs cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl px-5 shadow-xs cursor-pointer"
                >
                  Simpan Terminal POS
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

