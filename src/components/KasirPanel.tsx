/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MenuItem, Order } from '../types';
import {
  KasirPanelProps,
  CartItem,
  PaymentMethod,
  ReportDateMode,
  TopMenuItem,
  PrinterSettings,
  getPrinterSettings,
  savePrinterSettings,
  handleTestPrintReceipt,
  handlePrintReceipt,
  handlePrintZReport,
  generateWhatsAppReportText,
  KasirHeader,
  KasirMenuGrid,
  KasirCartSidebar,
  KasirPaymentModal,
  KasirReceiptModal,
  KasirPrinterSettingsModal,
  KasirZReportModal,
  KasirHistoryModal,
  KasirQrisZoomModal,
  KasirErrorState,
} from './kasir';
import { VoidOrderModal } from './common/VoidOrderModal';

export default function KasirPanel({
  boothKode,
  booths,
  menuItems,
  eventSetting,
  onRefreshData,
  onNavigateHome,
}: KasirPanelProps) {
  const currentBooth = booths.find(
    (b) => b.kode.toUpperCase() === boothKode.toUpperCase()
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals visibility
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);
  const [isReprintMode, setIsReprintMode] = useState(false);
  const [showQrisZoom, setShowQrisZoom] = useState(false);

  // Printer Settings State
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(getPrinterSettings());

  // History Orders & Filters
  const [todayHistoryOrders, setTodayHistoryOrders] = useState<Order[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilterMethod, setHistoryFilterMethod] = useState<string>('ALL');

  // Checkout detail state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashAmountInput, setCashAmountInput] = useState<string>('');
  const [customerNameInput, setCustomerNameInput] = useState<string>('');
  const [refNoInput, setRefNoInput] = useState('');
  const [edcBank, setEdcBank] = useState('BCA');
  const [voucherCount, setVoucherCount] = useState<number>(0);

  // Completed order for printing
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Today & Yesterday Strings
  const todayStr = useMemo(() => {
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).split(' ')[0];
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).split(' ')[0];
  }, []);

  // Fetch Today's Orders History for current booth
  const fetchTodayOrders = async () => {
    if (!currentBooth) return;
    try {
      const res = await fetch(`/api/orders/today/${currentBooth.id}`);
      if (res.ok) {
        const data = await res.json();
        setTodayHistoryOrders(data);
      }
    } catch (err) {
      console.error('Gagal memuat riwayat order kasir:', err);
    }
  };

  useEffect(() => {
    fetchTodayOrders();
  }, [currentBooth?.id]);

  const [orderToVoid, setOrderToVoid] = useState<Order | null>(null);
  const [isVoidLoading, setIsVoidLoading] = useState(false);

  // Void order handler
  const handleConfirmVoid = async (orderId: string, reason: string) => {
    setIsVoidLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/void`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alasan_void: reason }),
      });
      if (res.ok) {
        alert('Transaksi berhasil dibatalkan (VOID)');
        setOrderToVoid(null);
        await onRefreshData();
        await fetchTodayOrders();
      } else {
        const errData = await res.json().catch(() => null);
        alert(`Gagal membatalkan transaksi: ${errData?.error || 'Server error'}`);
      }
    } catch (err) {
      alert('Koneksi server terganggu saat membatalkan transaksi');
    } finally {
      setIsVoidLoading(false);
    }
  };

  // Filtered History Orders (Search + Method Filter)
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
  const [reportDateMode, setReportDateMode] = useState<ReportDateMode>('today');
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
  const topMenuItems: TopMenuItem[] = useMemo(() => {
    if (reportData?.top_menus && Array.isArray(reportData.top_menus) && reportData.top_menus.length > 0) {
      return reportData.top_menus
        .map((item: any) => ({
          nama: item.name,
          qty: item.qty,
          harga: item.harga,
          total_revenue: item.total_revenue,
          kategori: item.kategori,
        }))
        .sort((a: TopMenuItem, b: TopMenuItem) => b.qty - a.qty);
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
        .sort((a: TopMenuItem, b: TopMenuItem) => b.qty - a.qty);
    }
    if (reportData?.raw_orders && Array.isArray(reportData.raw_orders) && reportData.raw_orders.length > 0) {
      const salesMap: Record<string, TopMenuItem> = {};
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

  // Two-step confirmation for final checkout
  const [isConfirmingCheckout, setIsConfirmingCheckout] = useState(false);
  const checkoutConfirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConfirmingCheckoutRef = useRef(false);

  useEffect(() => {
    return () => {
      if (checkoutConfirmTimeoutRef.current) {
        clearTimeout(checkoutConfirmTimeoutRef.current);
      }
    };
  }, []);

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setIsConfirmingCheckout(false);
    isConfirmingCheckoutRef.current = false;
    if (checkoutConfirmTimeoutRef.current) {
      clearTimeout(checkoutConfirmTimeoutRef.current);
    }
  };

  // Derived calculations
  const isVoucherEnabled = currentBooth?.voucher_active !== false;
  const voucherNominal = currentBooth?.voucher_nominal || 5000;
  const subtotalCartAmount = cart.reduce((sum, item) => sum + item.menuItem.harga * item.qty, 0);
  const totalDiscount = isVoucherEnabled ? voucherCount * voucherNominal : 0;
  const totalCartAmount = Math.max(0, subtotalCartAmount - totalDiscount);
  const parsedCashReceived = Number(cashAmountInput) || 0;
  const cashChangeAmount = parsedCashReceived >= totalCartAmount ? parsedCashReceived - totalCartAmount : 0;

  const handleConfirmCheckoutClick = () => {
    if (cart.length === 0) return;

    // CASH validation
    if (paymentMethod === 'CASH' && parsedCashReceived < totalCartAmount) {
      alert('Pembayaran tunai kurang dari total tagihan keranjang!');
      return;
    }

    if (isConfirmingCheckoutRef.current) {
      isConfirmingCheckoutRef.current = false;
      setIsConfirmingCheckout(false);
      if (checkoutConfirmTimeoutRef.current) {
        clearTimeout(checkoutConfirmTimeoutRef.current);
      }
      handleCheckout();
    } else {
      isConfirmingCheckoutRef.current = true;
      setIsConfirmingCheckout(true);
      if (checkoutConfirmTimeoutRef.current) {
        clearTimeout(checkoutConfirmTimeoutRef.current);
      }
      checkoutConfirmTimeoutRef.current = setTimeout(() => {
        isConfirmingCheckoutRef.current = false;
        setIsConfirmingCheckout(false);
      }, 3000);
    }
  };

  // Auto-print effect when receipt modal opens
  useEffect(() => {
    if (isReceiptModalOpen && completedOrder && printerSettings.autoPrint !== false) {
      const timer = setTimeout(() => {
        handlePrintReceipt(completedOrder, currentBooth, eventSetting, printerSettings);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isReceiptModalOpen, printerSettings.autoPrint]);

  const handleSavePrinterSettings = (newSettings: PrinterSettings) => {
    setPrinterSettings(newSettings);
    savePrinterSettings(newSettings);
  };

  // Open payment modal with default active payment channel
  const openPaymentModal = () => {
    if (cart.length === 0 || !currentBooth) return;
    if (currentBooth.pay_cash_active !== false) {
      setPaymentMethod('CASH');
    } else if (currentBooth.pay_qris_active !== false) {
      setPaymentMethod('QRIS');
    } else if (currentBooth.pay_edc_active !== false) {
      setPaymentMethod('EDC');
    }
    setIsPaymentModalOpen(true);
  };

  // Virtual Numpad Handler
  const handleNumpadClick = (val: string) => {
    if (val === 'C') {
      setCashAmountInput('');
    } else if (val === 'DEL') {
      setCashAmountInput((prev) => prev.slice(0, -1));
    } else {
      setCashAmountInput((prev) => prev + val);
    }
  };

  const selectQuickCash = (amount: number) => {
    if (amount === 0) {
      setCashAmountInput(String(totalCartAmount));
    } else {
      setCashAmountInput(String(amount));
    }
  };

  useEffect(() => {
    setCart([]);
    setVoucherCount(0);
  }, [boothKode]);

  // Error guards
  if (!currentBooth) {
    return <KasirErrorState type="not_found" boothKode={boothKode} onNavigateHome={onNavigateHome} />;
  }

  if (!currentBooth.aktif) {
    return <KasirErrorState type="inactive" boothKode={boothKode} onNavigateHome={onNavigateHome} />;
  }

  // Direct active menu items assigned to this booth
  const productsFiltered = menuItems.filter((item) => item.booth_id === currentBooth.id);

  // Basket routines
  const addToCart = (menuItem: MenuItem) => {
    if (!menuItem.tersedia || (menuItem.stok != null && menuItem.stok <= 0)) {
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.menuItem.id === menuItem.id);
      const currentQty = idx > -1 ? prev[idx].qty : 0;
      if (menuItem.stok != null && currentQty >= menuItem.stok) {
        alert('Stok menu ini sudah mencapai batas maksimal ketersediaan!');
        return prev;
      }

      if (idx > -1) {
        return prev.map((item, i) =>
          i === idx ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { menuItem, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.menuItem.id === id);
      if (idx === -1) return prev;

      const newQty = prev[idx].qty + delta;
      const item = prev[idx].menuItem;
      if (delta > 0 && item.stok != null && newQty > item.stok) {
        alert('Stok menu ini sudah mencapai batas maksimal!');
        return prev;
      }

      if (newQty <= 0) {
        return prev.filter((item) => item.menuItem.id !== id);
      }

      return prev.map((item, i) =>
        i === idx ? { ...item, qty: newQty } : item
      );
    });
  };

  const updateCatatan = (id: string, text: string) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.menuItem.id === id) {
          return { ...item, catatan: text };
        }
        return item;
      });
    });
  };

  // Checkout order submission
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'CASH' && parsedCashReceived < totalCartAmount) {
      alert('Pembayaran tunai kurang dari total tagihan keranjang!');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        booth_id: currentBooth.id,
        sumber: 'KASIR',
        metode_bayar: paymentMethod,
        total: totalCartAmount,
        diskon: totalDiscount,
        uang_bayar: paymentMethod === 'CASH' ? parsedCashReceived : undefined,
        kembalian: paymentMethod === 'CASH' ? cashChangeAmount : undefined,
        no_referensi:
          paymentMethod !== 'CASH'
            ? paymentMethod === 'EDC'
              ? `${edcBank} - ${refNoInput}`
              : refNoInput
            : undefined,
        nama_pelanggan: customerNameInput.trim() || undefined,
        items: cart.map((c) => ({
          menu_item_id: c.menuItem.id,
          nama_item: c.menuItem.nama,
          harga: c.menuItem.harga,
          qty: c.qty,
          catatan: c.catatan,
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
        setIsReprintMode(false);
        setIsPaymentModalOpen(false);
        setIsReceiptModalOpen(true);
        setCart([]);
        setVoucherCount(0);
        setCashAmountInput('');
        setCustomerNameInput('');
        setRefNoInput('');
        await onRefreshData();
        await fetchTodayOrders();
      } else {
        const errorData = await res.json().catch(() => null);
        alert(`Gagal memproses transaksi: ${errorData?.error || 'Kesalahan pada server'}`);
      }
    } catch (err) {
      alert('Koneksi server terganggu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!reportData || !currentBooth) return;
    const text = generateWhatsAppReportText(
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative">
      {/* Dynamic Style block inject for window.print() formatting */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-invoice-area, #print-invoice-area * {
            visibility: visible !important;
          }
          #print-invoice-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 68mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
            color: black !important;
            font-family: monospace !important;
            font-size: 13px !important;
            line-height: 1.2 !important;
          }
          .no-print-modal {
            display: none !important;
          }
        }
      `}</style>

      {/* POS Header */}
      <KasirHeader
        boothNama={currentBooth.nama}
        eventSetting={eventSetting}
        todayOrdersCount={todayHistoryOrders.length}
        onOpenPrinterSettings={() => setIsPrinterSettingsOpen(true)}
        onOpenReport={() => {
          fetchBoothReport(effectiveReportDate);
          setIsReportModalOpen(true);
        }}
        onOpenHistory={() => {
          fetchTodayOrders();
          setIsHistoryModalOpen(true);
        }}
      />

      {/* Main Body Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Menu Grid (8 cols out of 12) */}
        <KasirMenuGrid
          products={productsFiltered}
          cart={cart}
          onAddToCart={addToCart}
        />

        {/* Order Basket Sidebar (4 cols out of 12) */}
        <KasirCartSidebar
          cart={cart}
          totalCartAmount={totalCartAmount}
          onUpdateQty={updateQty}
          onUpdateCatatan={updateCatatan}
          onClearCart={() => {
            setCart([]);
            setVoucherCount(0);
          }}
          onOpenPayment={openPaymentModal}
        />
      </div>

      {/* POPUP PAYMENT MODAL */}
      <KasirPaymentModal
        isOpen={isPaymentModalOpen}
        currentBooth={currentBooth}
        totalCartAmount={totalCartAmount}
        isVoucherEnabled={isVoucherEnabled}
        voucherNominal={voucherNominal}
        voucherCount={voucherCount}
        setVoucherCount={setVoucherCount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        customerNameInput={customerNameInput}
        setCustomerNameInput={setCustomerNameInput}
        cashAmountInput={cashAmountInput}
        refNoInput={refNoInput}
        setRefNoInput={setRefNoInput}
        edcBank={edcBank}
        setEdcBank={setEdcBank}
        cashChangeAmount={cashChangeAmount}
        isLoading={isLoading}
        isConfirmingCheckout={isConfirmingCheckout}
        onNumpadClick={handleNumpadClick}
        onSelectQuickCash={selectQuickCash}
        onConfirmCheckoutClick={handleConfirmCheckoutClick}
        onClose={closePaymentModal}
        onShowQrisZoom={() => setShowQrisZoom(true)}
      />

      {/* POPUP RECEIPT THERMAL MOCKUP & PRINTER SYSTEM MODAL */}
      <KasirReceiptModal
        isOpen={isReceiptModalOpen}
        completedOrder={completedOrder}
        isReprintMode={isReprintMode}
        currentBooth={currentBooth}
        eventSetting={eventSetting}
        onPrint={() => completedOrder && handlePrintReceipt(completedOrder, currentBooth, eventSetting, printerSettings)}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setCompletedOrder(null);
          setIsReprintMode(false);
        }}
      />

      {/* PRINTER & RECEIPT SETTINGS MODAL */}
      <KasirPrinterSettingsModal
        isOpen={isPrinterSettingsOpen}
        settings={printerSettings}
        onSave={handleSavePrinterSettings}
        onClose={() => setIsPrinterSettingsOpen(false)}
        onTestPrint={(st) => handleTestPrintReceipt(currentBooth, eventSetting, st)}
      />

      {/* FULL-MODAL: LAPORAN PENJUALAN BOOTH (Z-REPORT / CLOSING SHIFT) */}
      <KasirZReportModal
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
        onPrintZReport={() => handlePrintZReport(reportData, currentBooth, effectiveReportDate, topMenuItems, eventSetting)}
        onShareWhatsApp={handleShareWhatsApp}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* QRIS ZOOM MODAL */}
      <KasirQrisZoomModal
        isOpen={showQrisZoom}
        qrisImagePath={currentBooth.qris_image_path}
        onClose={() => setShowQrisZoom(false)}
      />

      {/* RIWAYAT TRANSAKSI MODAL */}
      <KasirHistoryModal
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
        onReprintOrder={(ord) => {
          setCompletedOrder(ord);
          setIsReprintMode(true);
          setIsHistoryModalOpen(false);
          setIsReceiptModalOpen(true);
        }}
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
    </div>
  );
}
