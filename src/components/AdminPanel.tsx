/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Booth, MasterMenu, MasterCategory, BoothMenu, MenuItem, EventSetting, ReportSummary, UserProfile } from '../types';
import { AdminTabKey, ADMIN_TABS, getCategoryColorStyle, CATEGORY_COLORS, formatIDR } from './admin/adminTypes';

export { getCategoryColorStyle, CATEGORY_COLORS, formatIDR };
import {
  Store,
  RefreshCw,
  FileSpreadsheet,
  LogOut,
  ChevronDown,
  User,
  LayoutDashboard,
  Utensils,
  Receipt,
  Settings,
  Database,
} from 'lucide-react';
import { DateRangePicker } from './ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

// Sub-Tab Components
import { AdminDashboardTab } from './admin/AdminDashboardTab';
import { AdminMasterMenuTab } from './admin/AdminMasterMenuTab';
import { AdminBoothTab } from './admin/AdminBoothTab';
import { AdminTransactionsTab } from './admin/AdminTransactionsTab';
import { AdminEventsTab } from './admin/AdminEventsTab';
import { AdminConsolidationTab } from './admin/AdminConsolidationTab';
import { AdminProfileTab } from './admin/AdminProfileTab';

interface AdminPanelProps {
  booths: Booth[];
  masterMenus: MasterMenu[];
  boothMenus: BoothMenu[];
  menuItems: MenuItem[];
  eventSetting: EventSetting | null;
  currentSubTab?: AdminTabKey;
  onNavigateSubTab?: (tab: AdminTabKey) => void;
  onRefreshData: () => Promise<void>;
  onLogout?: () => void;
  onNavigateHome: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  booths,
  masterMenus,
  boothMenus,
  eventSetting,
  currentSubTab = 'dashboard',
  onNavigateSubTab,
  onRefreshData,
  onLogout,
  onNavigateHome,
}) => {
  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<AdminTabKey>(currentSubTab);

  useEffect(() => {
    if (currentSubTab && currentSubTab !== activeTab) {
      setActiveTab(currentSubTab);
    }
  }, [currentSubTab]);

  const handleTabChange = (tabId: AdminTabKey) => {
    setActiveTab(tabId);
    if (onNavigateSubTab) {
      onNavigateSubTab(tabId);
    }
  };

  // Global Data & Reports
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<MasterCategory[]>([]);

  // Filters for Dashboard & Transactions
  const [filterStartDate, setFilterStartDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  });
  const [filterEndDate, setFilterEndDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  });
  const [reportBoothFilter, setReportBoothFilter] = useState<string>('');

  // Event Form State
  const [eventForm, setEventForm] = useState<EventSetting>({
    id: 'default',
    nama_event: eventSetting?.nama_event || 'POS Event',
    tanggal_event: eventSetting?.tanggal_event || '',
    area_lokasi: eventSetting?.area_lokasi || '',
    konektivitas: eventSetting?.konektivitas || 'Starlink POS Lokal',
    client_merchant: eventSetting?.client_merchant || 'Merchant Partner',
    footer_struk: eventSetting?.footer_struk || 'Terima kasih atas pesanan Anda!\nSimpan struk ini sebagai bukti.',
  });

  useEffect(() => {
    if (eventSetting) {
      setEventForm(eventSetting);
    }
  }, [eventSetting]);

  // Auth Helpers
  const checkAuth = (res: Response) => {
    if (res.status === 401 || res.status === 403) {
      sessionStorage.removeItem('pos_admin_token');
      if (onLogout) {
        onLogout();
      } else {
        onNavigateHome();
      }
      return false;
    }
    return true;
  };

  const fetchUserProfile = async () => {
    try {
      const token = sessionStorage.getItem('pos_admin_token');
      if (!token) return;
      const res = await fetch('/api/admin/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUserProfile(data.user);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil profil admin', err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pos_admin_token');
    if (onLogout) {
      onLogout();
    } else {
      onNavigateHome();
    }
  };

  // Image Upload Helper (WebP Conversion on backend/frontend)
  const handleUploadImage = async (file: File, type: 'menu' | 'qris' | 'kiosk_banner' = 'menu'): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/upload?type=${type}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
      alert('Gagal mengupload gambar ke server lokal.');
      return null;
    } catch (e) {
      alert('Terjadi kesalahan jaringan saat upload.');
      return null;
    }
  };

  // Report Fetching
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let url = '/api/reports';
      const params = new URLSearchParams();
      if (filterStartDate === 'ALL' || filterEndDate === 'ALL') {
        params.append('date', 'ALL');
      } else {
        if (filterStartDate) params.append('startDate', filterStartDate);
        if (filterEndDate) params.append('endDate', filterEndDate);
      }
      if (reportBoothFilter) params.append('booth_id', reportBoothFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}` },
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Gagal mengambil laporan', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Categories Fetching
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error('Gagal mengambil kategori', e);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchReports();
    fetchCategories();
  }, [booths, filterStartDate, filterEndDate, reportBoothFilter]);

  // Live SSE synchronization
  useEffect(() => {
    const sysEvents = new EventSource('/api/sys-stream');
    sysEvents.onmessage = () => {
      fetchReports();
      fetchCategories();
    };
    return () => {
      sysEvents.close();
    };
  }, []);

  // Export Excel
  // Export Excel
  const handleExportExcel = () => {
    if (!report) return;

    const workbook = XLSX.utils.book_new();

    const isAll = filterStartDate === 'ALL' || filterEndDate === 'ALL';
    const dateLabel = isAll
      ? 'Semua Periode'
      : filterStartDate === filterEndDate
      ? filterStartDate
      : `${filterStartDate} s/d ${filterEndDate}`;

    const boothLabel = reportBoothFilter
      ? booths.find((b) => b.id === reportBoothFilter)?.nama
        ? `[${booths.find((b) => b.id === reportBoothFilter)?.kode}] ${
            booths.find((b) => b.id === reportBoothFilter)?.nama
          }`
        : reportBoothFilter
      : 'Semua Stan';

    const grossRevenue = (report.revenue_total || 0) + (report.total_diskon || 0);
    const netRevenue = report.revenue_total || 0;
    const totalDiskon = report.total_diskon || 0;
    const cashTotal = report.payment_stats?.CASH || 0;
    const qrisTotal = report.payment_stats?.QRIS || 0;
    const edcTotal = report.payment_stats?.EDC || 0;
    const nonCashTotal = qrisTotal + edcTotal;

    // ========================================================================
    // SHEET 1: RINGKASAN EKSEKUTIF (SUMMARY)
    // ========================================================================
    const summaryData: (string | number)[][] = [
      [`LAPORAN KEUANGAN & AUDIT OPERASIONAL POS`],
      [`Nama Event / Festival`, eventSetting?.nama_event || 'Festival POS'],
      [`Penyelenggara / Merchant`, eventSetting?.client_merchant || 'Penyelenggara Festival'],
      [`Lokasi / Venue`, eventSetting?.area_lokasi || 'Main Venue'],
      [`Rentang Waktu Filter`, dateLabel],
      [`Filter Stan`, boothLabel],
      [`Waktu Ekspor Laporan`, new Date().toLocaleString('id-ID')],
      [],
      ['1. REKAPITULASI FINANSIAL UTAMA', 'NILAI (IDR)', 'KETERANGAN'],
      ['Omset Penjualan Kotor (Gross Sales)', grossRevenue, 'Total nilai seluruh item sebelum potongan voucher'],
      ['Total Subsidi Voucher / Diskon', totalDiskon, 'Nilai potongan kupon promosi yang disubsidi panitia'],
      ['Total Omset Bersih (Net Revenue)', netRevenue, 'Realisasi uang sah yang masuk kasir / rekening stan'],
      ['Total Transaksi Berhasil (Struk Lunas)', report.transactions_count || 0, 'Jumlah struk / nomor order selesai'],
      ['Total Volume Item Terjual (Porsi/Cup)', report.items_sold_count || 0, 'Kuantitas fisik seluruh menu yang laku'],
      ['Total Transaksi Dibatalkan (VOID)', report.voided_count || (report.raw_orders?.filter(o => o.status === 'VOID').length || 0), 'Pesanan dibatalkan (stok balik & tidak dihitung omset)'],
      [],
      ['2. DISTRIBUSI SALURAN PEMBAYARAN', 'TOTAL NOMINAL (IDR)', 'PORSI ARUS KAS (%)', 'INSTRUMEN PENERIMAAN'],
      [
        'Uang Tunai (CASH)',
        cashTotal,
        netRevenue > 0 ? `${((cashTotal / netRevenue) * 100).toFixed(1)}%` : '0%',
        'Uang fisik di laci kasir stan',
      ],
      [
        'QRIS Digital Statis / Dinamis',
        qrisTotal,
        netRevenue > 0 ? `${((qrisTotal / netRevenue) * 100).toFixed(1)}%` : '0%',
        'Scan QRIS (masuk rekening merchant agregator)',
      ],
      [
        'Mesin EDC Bank / Kartu',
        edcTotal,
        netRevenue > 0 ? `${((edcTotal / netRevenue) * 100).toFixed(1)}%` : '0%',
        'Debit / Kredit via mesin gesek EDC perbankan',
      ],
      [
        'Total Penerimaan Non-Tunai (QRIS + EDC)',
        nonCashTotal,
        netRevenue > 0 ? `${((nonCashTotal / netRevenue) * 100).toFixed(1)}%` : '0%',
        'Akumulasi seluruh transaksi non-fisik (digital)',
      ],
      [
        'TOTAL PENERIMAAN KAS',
        cashTotal + qrisTotal + edcTotal,
        '100%',
        'Total uang riil masuk seluruh instrumen',
      ],
      [],
      ['3. PENJUALAN BERDASARKAN KATEGORI MENU', 'QTY TERJUAL (PORSI)', 'PORSI DARI TOTAL (%)'],
    ];

    if (report.category_stats && Object.keys(report.category_stats).length > 0) {
      const catEntries = Object.entries(report.category_stats);
      const totalCatQty: number = catEntries.reduce((sum: number, [, val]) => sum + Number(val || 0), 0);
      catEntries.forEach(([catName, val]) => {
        const qty = Number(val || 0);
        const pct = totalCatQty > 0 ? `${((qty / totalCatQty) * 100).toFixed(1)}%` : '0%';
        summaryData.push([catName, qty, pct]);
      });
      summaryData.push(['TOTAL PORSI SEMUA KATEGORI', totalCatQty, '100%']);
    } else {
      summaryData.push(['(Belum ada data kategori menu)', 0, '0%']);
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [
      { wch: 42 },
      { wch: 24 },
      { wch: 22 },
      { wch: 48 },
    ];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Eksekutif');

    // ========================================================================
    // SHEET 2: REKAPITULASI PER STAN (BOOTH BREAKDOWN)
    // ========================================================================
    const boothHeaders = [
      'Kode Stan',
      'Nama Stan',
      'Total Omset Bersih (IDR)',
      'Jml Transaksi (Struk)',
      'Item Terjual (Porsi)',
      'Cash Fisik (IDR)',
      'QRIS Digital (IDR)',
      'Mesin EDC (IDR)',
      'Total Non-Tunai (IDR)',
      'Voucher Promo (IDR)',
      'Omset Kotor (IDR)',
    ];

    const boothStatsList = report.booth_stats || [];
    const boothRows = boothStatsList.map((b) => {
      const bGross = (b.revenue || 0) + (b.diskon || 0);
      const bNonCash = (b.payment_qris || 0) + (b.payment_edc || 0);
      return [
        b.booth_kode,
        b.booth_nama,
        b.revenue,
        b.sales_count,
        b.qty_items,
        b.payment_cash,
        b.payment_qris,
        b.payment_edc,
        bNonCash,
        b.diskon,
        bGross,
      ];
    });

    // Grand Total Row for Booths
    const sumBoothRev = boothStatsList.reduce((acc, b) => acc + (b.revenue || 0), 0);
    const sumBoothSales = boothStatsList.reduce((acc, b) => acc + (b.sales_count || 0), 0);
    const sumBoothItems = boothStatsList.reduce((acc, b) => acc + (b.qty_items || 0), 0);
    const sumBoothCash = boothStatsList.reduce((acc, b) => acc + (b.payment_cash || 0), 0);
    const sumBoothQris = boothStatsList.reduce((acc, b) => acc + (b.payment_qris || 0), 0);
    const sumBoothEdc = boothStatsList.reduce((acc, b) => acc + (b.payment_edc || 0), 0);
    const sumBoothNonCash = sumBoothQris + sumBoothEdc;
    const sumBoothDiskon = boothStatsList.reduce((acc, b) => acc + (b.diskon || 0), 0);
    const sumBoothGross = sumBoothRev + sumBoothDiskon;

    boothRows.push([
      'TOTAL',
      `${boothStatsList.length} Stan Terdaftar`,
      sumBoothRev,
      sumBoothSales,
      sumBoothItems,
      sumBoothCash,
      sumBoothQris,
      sumBoothEdc,
      sumBoothNonCash,
      sumBoothDiskon,
      sumBoothGross,
    ]);

    const boothSheet = XLSX.utils.aoa_to_sheet([boothHeaders, ...boothRows]);
    boothSheet['!cols'] = [
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
    XLSX.utils.book_append_sheet(workbook, boothSheet, 'Rekapitulasi Stan');

    // ========================================================================
    // SHEET 3: MENU TERLARIS (TOP SALES)
    // ========================================================================
    const menuHeaders = [
      'Peringkat',
      'Nama Menu',
      'Stan Penjual',
      'Kategori',
      'Harga Satuan (IDR)',
      'Qty Terjual (Porsi)',
      'Total Revenue (IDR)',
      'Kontribusi Omset (%)',
    ];

    const topMenusList = report.top_menus || [];
    const sumAllMenuRev = topMenusList.reduce((acc, m) => acc + (m.total_revenue || 0), 0);
    const sumAllMenuQty = topMenusList.reduce((acc, m) => acc + (m.qty || 0), 0);

    const menuRows = topMenusList.map((m, idx) => {
      const pct = sumAllMenuRev > 0 ? `${(((m.total_revenue || 0) / sumAllMenuRev) * 100).toFixed(1)}%` : '0%';
      return [
        idx + 1,
        m.name,
        m.booth,
        m.kategori,
        m.harga,
        m.qty,
        m.total_revenue,
        pct,
      ];
    });

    // Grand Total Row for Menus
    if (topMenusList.length > 0) {
      menuRows.push([
        'TOTAL',
        `${topMenusList.length} Menu Terdata`,
        '-',
        '-',
        '-',
        sumAllMenuQty,
        sumAllMenuRev,
        '100%',
      ]);
    }

    const menuSheet = XLSX.utils.aoa_to_sheet([menuHeaders, ...menuRows]);
    menuSheet['!cols'] = [
      { wch: 10 },
      { wch: 32 },
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(workbook, menuSheet, 'Menu Terlaris');

    // ========================================================================
    // SHEET 4: AUDIT LOG TRANSAKSI (RAW AUDIT TRAIL)
    // ========================================================================
    if (report.raw_orders && report.raw_orders.length > 0) {
      const txHeaders = [
        'ID Transaksi',
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

      const txRows = report.raw_orders.map((o) => {
        const itemStr = (o.items || [])
          .map((it) => `${it.qty}x ${it.nama_item}${it.catatan ? ` (*${it.catatan})` : ''}`)
          .join('; ');
        const orderGross = (o.total || 0) + (o.diskon || 0);

        return [
          o.id,
          o.created_at.replace('T', ' ').substring(0, 19),
          o.booth_kode,
          o.booth_nama,
          o.nomor_order,
          o.sumber || 'KASIR',
          o.nama_pelanggan || '-',
          o.metode_bayar,
          o.no_referensi || '-',
          o.total,
          o.diskon || 0,
          orderGross,
          o.status,
          itemStr,
        ];
      });

      // Grand Total for Audit Log
      const sumOrderNet = report.raw_orders
        .filter((o) => o.status !== 'VOID')
        .reduce((acc, o) => acc + (o.total || 0), 0);
      const sumOrderDiskon = report.raw_orders
        .filter((o) => o.status !== 'VOID')
        .reduce((acc, o) => acc + (o.diskon || 0), 0);
      const sumOrderGross = sumOrderNet + sumOrderDiskon;

      txRows.push([
        'TOTAL TRANSAKSI LUNAS',
        '-',
        '-',
        '-',
        `${report.raw_orders.filter((o) => o.status !== 'VOID').length} Struk Sah`,
        '-',
        '-',
        '-',
        '-',
        sumOrderNet,
        sumOrderDiskon,
        sumOrderGross,
        'SELESAI',
        '-',
      ]);

      const txSheet = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
      txSheet['!cols'] = [
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
      XLSX.utils.book_append_sheet(workbook, txSheet, 'Log Audit Transaksi');
    }

    const fileDateSuffix = isAll
      ? 'Semua_Periode'
      : filterStartDate === filterEndDate
      ? filterStartDate
      : `${filterStartDate}_sd_${filterEndDate}`;

    const fileName = `Laporan_Keuangan_POS_${eventSetting?.nama_event?.replace(/\s+/g, '_') || 'Event'}_${fileDateSuffix}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // --------------------------------------------------------------------------
  // MAIN ADMIN DASHBOARD SHELL
  // --------------------------------------------------------------------------
  const showSmartToolbar = activeTab === 'dashboard' || activeTab === 'transactions';

  const tabIcons: Record<AdminTabKey, React.ReactNode> = {
    dashboard: <LayoutDashboard className="h-4 w-4" />,
    'master-menu': <Utensils className="h-4 w-4" />,
    booth: <Store className="h-4 w-4" />,
    transactions: <Receipt className="h-4 w-4" />,
    events: <Settings className="h-4 w-4" />,
    consolidation: <Database className="h-4 w-4" />,
    profile: <User className="h-4 w-4" />,
  };

  const getTabBadge = (tabId: AdminTabKey) => {
    if (tabId === 'master-menu') return ` (${masterMenus.length})`;
    if (tabId === 'booth') return ` (${booths.length})`;
    if (tabId === 'transactions') return ` (${report?.raw_orders?.length || 0})`;
    return '';
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase shadow-xs">
                Admin Panel
              </span>
              <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
                {eventSetting?.nama_event || 'Festival Point of Sale'}
              </h1>
            </div>
            <p className="text-[11px] text-slate-500">
              {eventSetting?.area_lokasi || 'Main Venue'} • {eventSetting?.konektivitas || 'POS Network'}
            </p>
          </div>
        </div>

        {/* Global Header Controls (Smart Toolbar) */}
        <div className="flex flex-wrap items-center gap-2">
          {showSmartToolbar && (
            <>
              {/* Filter Stan */}
              <Select value={reportBoothFilter} onValueChange={setReportBoothFilter}>
                <SelectTrigger className="h-9 bg-white hover:bg-slate-50 border-slate-200 rounded-xl px-3 text-xs font-semibold shadow-2xs min-w-[140px] text-slate-700">
                  <Store className="h-3.5 w-3.5 text-orange-500 shrink-0 mr-1" />
                  <SelectValue placeholder="Semua Stan" />
                </SelectTrigger>
                <SelectContent className="w-56">
                  <SelectItem value="">Semua Stan</SelectItem>
                  {booths.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      <span className="font-mono text-orange-600 font-bold mr-1">[{b.kode}]</span>
                      <span>{b.nama}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range Picker */}
              <DateRangePicker
                startDate={filterStartDate}
                endDate={filterEndDate}
                className="h-9"
                onChange={(start, end) => {
                  setFilterStartDate(start);
                  setFilterEndDate(end);
                }}
              />

              {/* Export Excel Button */}
              <button
                onClick={handleExportExcel}
                className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
                title="Export Laporan ke Excel"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel</span>
              </button>
            </>
          )}

          {/* Refresh & Profile & Logout Controls */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            {/* Refresh Data Button */}
            <button
              onClick={() => {
                onRefreshData();
                fetchUserProfile();
                fetchReports();
                fetchCategories();
              }}
              className="h-9 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Segarkan Data & Laporan"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-orange-500' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Admin Profile Button */}
            <button
              onClick={() => handleTabChange('profile')}
              className={`h-9 border px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-2xs cursor-pointer group active:scale-95 ${
                activeTab === 'profile'
                  ? 'bg-orange-50 border-orange-300 text-orange-700 font-bold'
                  : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 hover:border-orange-300'
              }`}
              title="Kelola Profil & Kata Sandi Admin"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center text-[10px] font-black overflow-hidden shrink-0 shadow-xs border border-white">
                {userProfile?.foto_avatar ? (
                  <img src={userProfile.foto_avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(userProfile?.nama_lengkap || userProfile?.username || 'A').slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="text-left hidden md:flex flex-col justify-center leading-none">
                <span className="text-[11px] font-bold text-slate-800 max-w-[130px] truncate">
                  {userProfile?.nama_lengkap || 'Administrator'}
                </span>
                <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                  @{userProfile?.username || 'admin'}
                </span>
              </div>
              {userProfile?.is_default_password ? (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0 ml-0.5" title="Kata sandi bawaan masih aktif" />
              ) : (
                <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 shrink-0 ml-0.5" />
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="h-9 w-9 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 border border-slate-200 rounded-xl flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
              title="Keluar dari Admin"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="bg-white border-b border-slate-200/80 px-6 overflow-x-auto">
        <div className="flex gap-2 w-full">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600 bg-orange-50/60 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tabIcons[tab.id]}
              <span>
                {tab.label}
                {getTabBadge(tab.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Body Viewport */}
      <main className="flex-1 p-6 w-full space-y-6">
        {activeTab === 'dashboard' && (
          <AdminDashboardTab
            report={report}
            filterStartDate={filterStartDate}
            filterEndDate={filterEndDate}
          />
        )}

        {activeTab === 'master-menu' && (
          <AdminMasterMenuTab
            masterMenus={masterMenus}
            booths={booths}
            boothMenus={boothMenus}
            categories={categories}
            onRefreshData={onRefreshData}
            fetchCategories={fetchCategories}
            checkAuth={checkAuth}
            handleUploadImage={handleUploadImage}
          />
        )}

        {activeTab === 'booth' && (
          <AdminBoothTab
            booths={booths}
            masterMenus={masterMenus}
            boothMenus={boothMenus}
            categories={categories}
            eventForm={eventForm}
            onRefreshData={onRefreshData}
            checkAuth={checkAuth}
            handleUploadImage={handleUploadImage}
          />
        )}

        {activeTab === 'transactions' && (
          <AdminTransactionsTab
            orders={report?.raw_orders || []}
            onRefreshData={onRefreshData}
            fetchReports={fetchReports}
          />
        )}

        {activeTab === 'events' && (
          <AdminEventsTab
            eventForm={eventForm}
            setEventForm={setEventForm}
            onRefreshData={onRefreshData}
            checkAuth={checkAuth}
            handleUploadImage={handleUploadImage}
          />
        )}

        {activeTab === 'consolidation' && (
          <AdminConsolidationTab
            report={report}
            eventSetting={eventSetting}
            onRefreshData={onRefreshData}
            fetchReports={fetchReports}
            checkAuth={checkAuth}
          />
        )}

        {activeTab === 'profile' && (
          <AdminProfileTab
            userProfile={userProfile}
            onProfileUpdated={(updatedUser) => {
              setUserProfile(updatedUser);
            }}
            handleUploadImage={(file, type) => handleUploadImage(file, type || 'menu')}
          />
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
