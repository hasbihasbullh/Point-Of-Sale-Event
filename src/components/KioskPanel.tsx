/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Order } from '../types';
import {
  KioskPanelProps,
  KioskScreen,
  KioskCartItem,
  KioskPaymentMethod,
  KioskReportDateMode,
  KioskTopMenuItem,
  KioskPrinterSettings,
  getKioskPrinterSettings,
  saveKioskPrinterSettings,
  handleTestPrintKioskReceipt,
  handlePrintKioskReceipt,
  handlePrintKioskZReport,
  generateKioskWhatsAppReportText,
  KioskHeader,
  KioskWelcomeScreen,
  KioskMenuScreen,
  KioskReviewScreen,
  KioskPaymentScreen,
  KioskSuccessScreen,
  KioskPrinterSettingsModal,
  KioskZReportModal,
  KioskHistoryModal,
  KioskQrisZoomModal,
  KioskErrorState,
} from './kiosk';
import { VoidOrderModal } from './common/VoidOrderModal';
import { SupervisorPinModal } from './common/SupervisorPinModal';

export default function KioskPanel({
  boothKode,
  booths,
  menuItems,
  eventSetting,
  onRefreshData,
  onNavigateHome,
}: KioskPanelProps) {
  const currentBooth = booths.find(
    (b) => b.kode.toUpperCase() === boothKode.toUpperCase()
  );

  // Kiosk Screens: 'welcome' | 'menu' | 'review' | 'payment' | 'success'
  const [screen, setScreen] = useState<KioskScreen>('welcome');
  const [cart, setCart] = useState<KioskCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showQrisZoom, setShowQrisZoom] = useState(false);

  // Supervisor PIN Authorization State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinActionTarget, setPinActionTarget] = useState<'report' | 'printer' | 'history' | null>(null);
  const [activeSupervisorPin, setActiveSupervisorPin] = useState<string>('8888');

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilterMethod, setHistoryFilterMethod] = useState<string>('ALL');

  // Printer Settings State
  const [printerSettings, setPrinterSettings] = useState<KioskPrinterSettings>(getKioskPrinterSettings());

  // Customer Name / Table Number
  const [customerNameInput, setCustomerNameInput] = useState<string>('');

  // Multi-payment states
  const [paymentMethod, setPaymentMethod] = useState<KioskPaymentMethod>('QRIS');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [voucherCount, setVoucherCount] = useState<number>(0);

  // Today Date Filter (WIB)
  const todayStr = useMemo(() => {
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).split(' ')[0];
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).split(' ')[0];
  }, []);

  const [todayHistoryOrders, setTodayHistoryOrders] = useState<Order[]>([]);

  // Filtered History Orders (Search + Active Method Tabs)
  const filteredHistoryOrders = useMemo(() => {
    return todayHistoryOrders.filter((ord) => {
      const q = historySearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        ord.nomor_order.toLowerCase().includes(q) ||
        (ord.nama_pelanggan && ord.nama_pelanggan.toLowerCase().includes(q)) ||
        ord.items.some((it) => it.nama_item.toLowerCase().includes(q)) ||
        ((q.includes('voucher') || q.includes('diskon') || q.includes('potongan')) && (ord.diskon || 0) > 0);

      const matchesMethod =
        historyFilterMethod === 'ALL' ||
        (historyFilterMethod === 'VOID'
          ? ord.status === 'VOID'
          : ord.metode_bayar === historyFilterMethod && ord.status !== 'VOID');

      return matchesSearch && matchesMethod;
    });
  }, [todayHistoryOrders, historySearchQuery, historyFilterMethod]);

  // Booth Report Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportDateMode, setReportDateMode] = useState<KioskReportDateMode>('today');
  const [customReportDate, setCustomReportDate] = useState<string>(todayStr);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isCopiedWa, setIsCopiedWa] = useState(false);

  // Active Effective Date for Report
  const effectiveReportDate = useMemo(() => {
    if (reportDateMode === 'today') return todayStr;
    if (reportDateMode === 'yesterday') return yesterdayStr;
    return customReportDate || todayStr;
  }, [reportDateMode, customReportDate, todayStr, yesterdayStr]);

  const fetchBoothReport = async (targetDate?: string) => {
    if (!currentBooth) return;
    setIsLoadingReport(true);
    try {
      const dateToQuery = targetDate || effectiveReportDate;
      const res = await fetch(`/api/reports?booth_id=${currentBooth.id}&date=${dateToQuery}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error('Gagal mengambil laporan penjualan booth:', err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  useEffect(() => {
    if (isReportModalOpen) {
      fetchBoothReport(effectiveReportDate);
    }
  }, [isReportModalOpen, effectiveReportDate]);

  // All Best-Selling Menu Items Sorted by Highest Sales
  const topMenuItems: KioskTopMenuItem[] = useMemo(() => {
    if (reportData?.top_menus && Array.isArray(reportData.top_menus) && reportData.top_menus.length > 0) {
      return reportData.top_menus
        .map((item: any) => ({
          nama: item.name,
          qty: item.qty,
          harga: item.harga,
          total_revenue: item.total_revenue,
          kategori: item.kategori,
        }))
        .sort((a: KioskTopMenuItem, b: KioskTopMenuItem) => b.qty - a.qty);
    }
    if (reportData?.menu_sales && typeof reportData.menu_sales === 'object' && Object.keys(reportData.menu_sales).length > 0) {
      return Object.entries(reportData.menu_sales)
        .map(([key, val]: [string, any]) => ({
          nama: val.name || (key.includes('::') ? key.split('::')[1] : key),
          qty: val.qty,
          harga: val.harga,
          total_revenue: val.total_revenue,
          kategori: val.kategori,
        }))
        .sort((a: KioskTopMenuItem, b: KioskTopMenuItem) => b.qty - a.qty);
    }
    if (reportData?.raw_orders && Array.isArray(reportData.raw_orders) && reportData.raw_orders.length > 0) {
      const salesMap: Record<string, KioskTopMenuItem> = {};
      reportData.raw_orders
        .filter((o: any) => o.status !== 'VOID')
        .forEach((o: any) => {
          o.items?.forEach((it: any) => {
            const name = it.nama_item || 'Menu';
            if (!salesMap[name]) {
              salesMap[name] = { nama: name, qty: 0, harga: it.harga, total_revenue: 0, kategori: 'Umum' };
            }
            salesMap[name].qty += it.qty;
            salesMap[name].total_revenue += it.qty * it.harga;
          });
        });
      return Object.values(salesMap).sort((a, b) => b.qty - a.qty);
    }
    return [];
  }, [reportData]);

  const fetchTodayOrders = async () => {
    if (!currentBooth) return;
    try {
      const res = await fetch(`/api/orders/today/${currentBooth.id}`);
      if (res.ok) {
        const data = await res.json();
        setTodayHistoryOrders(data);
      }
    } catch (err) {
      console.error('Gagal memuat riwayat order Kiosk', err);
    }
  };

  useEffect(() => {
    fetchTodayOrders();
  }, [currentBooth?.id]);

  const handleNumpad = (val: string) => {
    if (val === 'C') {
      setAmountPaid(0);
    } else if (val === '000') {
      setAmountPaid((prev) => prev * 1000);
    } else {
      setAmountPaid((prev) => parseInt(prev.toString() + val));
    }
  };

  const handleQuickBill = (amount: number) => {
    setAmountPaid(amount);
  };

  const [orderToVoid, setOrderToVoid] = useState<Order | null>(null);
  const [isVoidLoading, setIsVoidLoading] = useState(false);

  // Supervisor PIN Check Handlers
  const handleOpenReportWithPin = () => {
    setPinActionTarget('report');
    setIsPinModalOpen(true);
  };

  const handleOpenPrinterWithPin = () => {
    setPinActionTarget('printer');
    setIsPinModalOpen(true);
  };

  const handleOpenHistoryWithPin = () => {
    setPinActionTarget('history');
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = (pin: string) => {
    setActiveSupervisorPin(pin);
    setIsPinModalOpen(false);
    if (pinActionTarget === 'report') {
      fetchBoothReport(effectiveReportDate);
      setIsReportModalOpen(true);
    } else if (pinActionTarget === 'printer') {
      setIsPrinterSettingsOpen(true);
    } else if (pinActionTarget === 'history') {
      onRefreshData();
      fetchTodayOrders();
      setIsHistoryModalOpen(true);
    }
    setPinActionTarget(null);
  };

  const handleConfirmVoid = async (orderId: string, reason: string) => {
    setIsVoidLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/void`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alasan_void: reason,
          supervisor_pin: activeSupervisorPin
        }),
      });
      if (res.ok) {
        alert('Transaksi berhasil dibatalkan (VOID)');
        setOrderToVoid(null);
        await onRefreshData();
        await fetchTodayOrders();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Gagal membatalkan transaksi: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      alert('Gagal menghubungi server untuk membatalkan transaksi');
    } finally {
      setIsVoidLoading(false);
    }
  };

  // Error guards
  if (!currentBooth) {
    return <KioskErrorState type="not_found" boothKode={boothKode} onNavigateHome={onNavigateHome} />;
  }

  if (!currentBooth.aktif) {
    return <KioskErrorState type="inactive" boothKode={boothKode} onNavigateHome={onNavigateHome} />;
  }

  if (!currentBooth.kiosk) {
    return <KioskErrorState type="kiosk_disabled" boothKode={currentBooth.kode} onNavigateHome={onNavigateHome} />;
  }

  const isVoucherEnabled = currentBooth?.voucher_active !== false;
  const voucherNominal = currentBooth?.voucher_nominal || 5000;
  const boothMenus = menuItems.filter((m) => m.booth_id === currentBooth.id && m.tersedia);
  const subtotalAmount = cart.reduce((sum, item) => sum + item.menuItem.harga * item.qty, 0);
  const totalDiscount = isVoucherEnabled ? voucherCount * voucherNominal : 0;
  const totalAmount = Math.max(0, subtotalAmount - totalDiscount);

  const addToCart = (item: MenuItem) => {
    if (!item.tersedia || (item.stok != null && item.stok <= 0)) return;

    setCart((prev) => {
      const idx = prev.findIndex((c) => c.menuItem.id === item.id);
      const currentQty = idx > -1 ? prev[idx].qty : 0;
      if (item.stok != null && currentQty >= item.stok) {
        alert('Maaf, stok item ini tidak mencukupi untuk ditambah lagi.');
        return prev;
      }

      if (idx > -1) {
        return prev.map((c, i) => (i === idx ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { menuItem: item, qty: 1 }];
    });
  };

  const modifyQty = (id: string, delta: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.menuItem.id === id);
      if (idx === -1) return prev;

      const item = prev[idx].menuItem;
      const newQty = prev[idx].qty + delta;

      if (delta > 0 && item.stok != null && newQty > item.stok) {
        alert('Maaf, stok item ini tidak mencukupi untuk ditambah lagi.');
        return prev;
      }

      if (newQty <= 0) {
        return prev.filter((c) => c.menuItem.id !== id);
      }
      return prev.map((c, i) => (i === idx ? { ...c, qty: newQty } : c));
    });
  };

  const updateCatatan = (id: string, text: string) => {
    setCart((prev) =>
      prev.map((c) => (c.menuItem.id === id ? { ...c, catatan: text } : c))
    );
  };

  const handleResetKiosk = () => {
    setCart([]);
    setCompletedOrder(null);
    setVoucherCount(0);
    setCustomerNameInput('');
    setScreen('welcome');
  };

  // Auto-print effect when order is completed on success screen
  useEffect(() => {
    let printTimer: NodeJS.Timeout;

    if (screen === 'success' && completedOrder && printerSettings.autoPrint !== false) {
      printTimer = setTimeout(() => {
        handlePrintKioskReceipt(completedOrder, currentBooth, eventSetting, printerSettings);
      }, 800);
    }

    return () => {
      if (printTimer) clearTimeout(printTimer);
    };
  }, [screen, completedOrder, printerSettings.autoPrint]);

  const handleSavePrinterSettings = (newSettings: KioskPrinterSettings) => {
    setPrinterSettings(newSettings);
    saveKioskPrinterSettings(newSettings);
  };

  const submitKioskOrder = async () => {
    if (cart.length === 0) return;
    setIsLoading(true);

    try {
      const payload = {
        booth_id: currentBooth.id,
        sumber: 'KIOSK',
        metode_bayar: paymentMethod,
        uang_bayar: paymentMethod === 'CASH' ? amountPaid : totalAmount,
        kembalian: paymentMethod === 'CASH' ? amountPaid - totalAmount : 0,
        total: totalAmount,
        diskon: totalDiscount,
        nama_pelanggan: customerNameInput.trim() || undefined,
        items: cart.map((c) => ({
          menu_item_id: c.menuItem.id,
          nama_item: c.menuItem.nama,
          harga: c.menuItem.harga,
          qty: c.qty,
          catatan: c.catatan?.trim() || undefined,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCompletedOrder(data);
        setVoucherCount(0);
        setScreen('success');
        await onRefreshData();
        await fetchTodayOrders();
      } else {
        const errorData = await res.json().catch(() => null);
        alert(`Pesanan Kiosk gagal: ${errorData?.error || 'Silakan coba lagi.'}`);
      }
    } catch (err) {
      alert('Koneksi ke server pusat terputus.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!reportData || !currentBooth) return;
    const text = generateKioskWhatsAppReportText(
      reportData,
      currentBooth,
      effectiveReportDate,
      topMenuItems,
      eventSetting
    );

    navigator.clipboard.writeText(text);
    setIsCopiedWa(true);
    setTimeout(() => setIsCopiedWa(false), 2500);

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between overflow-x-hidden lg:overflow-hidden relative select-none">
      {/* HEADER CONTROL BAR (HANYA DITAMPILKAN SAAT BUKAN WELCOME) */}
      {screen !== 'welcome' && (
        <KioskHeader
          boothNama={currentBooth.nama}
          eventSetting={eventSetting}
          todayOrdersCount={todayHistoryOrders.length}
          onOpenPrinterSettings={handleOpenPrinterWithPin}
          onOpenReport={handleOpenReportWithPin}
          onOpenHistory={handleOpenHistoryWithPin}
        />
      )}

      {/* 1. WELCOME SCREEN */}
      {screen === 'welcome' && (
        <KioskWelcomeScreen
          kioskBanner={eventSetting?.kiosk_banner}
          onStartOrder={() => setScreen('menu')}
        />
      )}

      {/* 2. ORDERING MENU SCREEN */}
      {screen === 'menu' && (
        <KioskMenuScreen
          boothMenus={boothMenus}
          cart={cart}
          totalAmount={totalAmount}
          eventSetting={eventSetting}
          onAddToCart={addToCart}
          onModifyQty={modifyQty}
          onUpdateCatatan={updateCatatan}
          onClearCart={() => {
            setCart([]);
            setVoucherCount(0);
          }}
          onProceedToReview={() => cart.length > 0 && setScreen('review')}
        />
      )}

      {/* 3. REVIEW SCREEN */}
      {screen === 'review' && (
        <KioskReviewScreen
          cart={cart}
          totalAmount={totalAmount}
          currentBooth={currentBooth}
          customerNameInput={customerNameInput}
          setCustomerNameInput={setCustomerNameInput}
          onBackToMenu={() => setScreen('menu')}
          onSelectPaymentMethod={(method) => {
            setPaymentMethod(method);
            if (method === 'CASH') setAmountPaid(0);
            setTimeout(() => setScreen('payment'), 50);
          }}
        />
      )}

      {/* 4. PAYMENT STATUS SCREEN */}
      {screen === 'payment' && (
        <KioskPaymentScreen
          currentBooth={currentBooth}
          paymentMethod={paymentMethod}
          totalAmount={totalAmount}
          amountPaid={amountPaid}
          voucherCount={voucherCount}
          isVoucherEnabled={isVoucherEnabled}
          voucherNominal={voucherNominal}
          isLoading={isLoading}
          setVoucherCount={setVoucherCount}
          onNumpad={handleNumpad}
          onQuickBill={handleQuickBill}
          onBackToReview={() => setScreen('review')}
          onSubmitOrder={submitKioskOrder}
          onShowQrisZoom={() => setShowQrisZoom(true)}
        />
      )}

      {/* 5. SUCCESS QUEUE SCREEN */}
      {screen === 'success' && completedOrder && (
        <KioskSuccessScreen
          completedOrder={completedOrder}
          currentBooth={currentBooth}
          eventSetting={eventSetting}
          onPrint={() => handlePrintKioskReceipt(completedOrder, currentBooth, eventSetting, printerSettings)}
          onReset={handleResetKiosk}
        />
      )}

      {/* FULL-MODAL: LAPORAN PENJUALAN BOOTH (Z-REPORT) */}
      <KioskZReportModal
        isOpen={isReportModalOpen}
        currentBooth={currentBooth}
        eventSetting={eventSetting}
        reportData={reportData}
        isLoadingReport={isLoadingReport}
        effectiveReportDate={effectiveReportDate}
        reportDateMode={reportDateMode}
        customReportDate={customReportDate}
        topMenuItems={topMenuItems}
        isCopiedWa={isCopiedWa}
        onSetReportDateMode={setReportDateMode}
        onSetCustomReportDate={setCustomReportDate}
        onRefreshReport={() => fetchBoothReport(effectiveReportDate)}
        onPrintZReport={() => handlePrintKioskZReport(reportData, currentBooth, effectiveReportDate, topMenuItems, eventSetting)}
        onShareWhatsApp={handleShareWhatsApp}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* KIOSK TRANSACTION HISTORY MODAL */}
      <KioskHistoryModal
        isOpen={isHistoryModalOpen}
        currentBooth={currentBooth}
        todayStr={todayStr}
        todayHistoryOrders={todayHistoryOrders}
        filteredHistoryOrders={filteredHistoryOrders}
        historySearchQuery={historySearchQuery}
        historyFilterMethod={historyFilterMethod}
        setHistorySearchQuery={setHistorySearchQuery}
        setHistoryFilterMethod={setHistoryFilterMethod}
        onRefreshHistory={fetchTodayOrders}
        onPrintOrder={(ord) => handlePrintKioskReceipt(ord, currentBooth, eventSetting, printerSettings)}
        onVoidOrder={(ord) => setOrderToVoid(ord)}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* VOID CONFIRMATION & REASON MODAL */}
      <VoidOrderModal
        isOpen={!!orderToVoid}
        order={orderToVoid}
        onConfirm={handleConfirmVoid}
        onClose={() => setOrderToVoid(null)}
        isLoading={isVoidLoading}
      />

      {/* PRINTER & RECEIPT SETTINGS MODAL */}
      <KioskPrinterSettingsModal
        isOpen={isPrinterSettingsOpen}
        settings={printerSettings}
        onSave={handleSavePrinterSettings}
        onClose={() => setIsPrinterSettingsOpen(false)}
        onTestPrint={(st) => handleTestPrintKioskReceipt(currentBooth, eventSetting, st)}
      />

      {/* QRIS ZOOM MODAL */}
      <KioskQrisZoomModal
        isOpen={showQrisZoom}
        qrisImagePath={currentBooth.qris_image_path}
        onClose={() => setShowQrisZoom(false)}
      />

      {/* SUPERVISOR PIN AUTHORIZATION MODAL */}
      <SupervisorPinModal
        isOpen={isPinModalOpen}
        title={
          pinActionTarget === 'report'
            ? 'Buka Laporan Penjualan (Z-Report)'
            : pinActionTarget === 'printer'
            ? 'Buka Pengaturan Printer Struk'
            : 'Buka Riwayat & Manajemen Order'
        }
        description="Masukkan 4 digit PIN Supervisor Stan untuk membuka akses menu ini"
        onSuccess={handlePinSuccess}
        onClose={() => {
          setIsPinModalOpen(false);
          setPinActionTarget(null);
        }}
      />
    </div>
  );
}
