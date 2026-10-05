/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Booth, MasterMenu, BoothMenu, MenuItem, Order, OrderItem, EventSetting, MasterCategory } from '../types';
import { getFoodImage, getOfflineSvgFallback } from '../foodImages';
import { getCategoryColorStyle } from './AdminPanel';
import {
  cacheMasterData,
  getCachedBooths,
  getCachedMenuItems,
  saveOfflineOrder,
  getNextLocalSequenceNumber,
  getPendingOrdersCount,
  syncPendingOrdersToServer,
  getOfflineOrdersHistory,
  offlineDb
} from '../services/offlineDb';
import {
  Search, ShoppingCart, Trash2, CreditCard, QrCode,
  Coins, ArrowLeft, Loader2, Printer, Check, CheckCircle, Plus, Minus,
  AlertTriangle, ReceiptText, RefreshCw, X, ShieldAlert,
  Smartphone, Wifi, WifiOff, Tag, History, Bluetooth, Calendar, BarChart3
} from 'lucide-react';
import {
  PrinterSettings,
  getPrinterSettings,
  savePrinterSettings,
  handleTestPrintReceipt,
  KasirPrinterSettingsModal,
  handlePrintReceipt,
  KasirZReportModal,
  ReportDateMode,
  TopMenuItem,
  handlePrintZReport,
  generateWhatsAppReportText
} from './kasir';
import { VoidOrderModal } from './common/VoidOrderModal';

interface KasirMobilePanelProps {
  boothKode: string;
  booths: Booth[];
  masterMenus?: MasterMenu[];
  boothMenus?: BoothMenu[];
  menuItems: MenuItem[];
  eventSetting?: EventSetting;
  onRefreshData: () => Promise<void>;
  onNavigateHome: () => void;
}

interface CartItem {
  menuItem: MenuItem;
  qty: number;
  catatan?: string;
}

export default function KasirMobilePanel({
  boothKode,
  booths: propsBooths,
  masterMenus: propsMasterMenus = [],
  boothMenus: propsBoothMenus = [],
  menuItems: propsMenuItems,
  eventSetting,
  onRefreshData,
  onNavigateHome
}: KasirMobilePanelProps) {
  // Master data fallback (Props or Offline IndexedDB Cache)
  const [booths, setBooths] = useState<Booth[]>(propsBooths);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(propsMenuItems);
  const [categories, setCategories] = useState<MasterCategory[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  // Connection & Sync States
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  // Active booth lookup
  const currentBooth = useMemo(() => {
    return booths.find((b) => b.kode.toUpperCase() === boothKode.toUpperCase()) || null;
  }, [booths, boothKode]);

  // Cart & Loading
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal statuses
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<'TODAY' | 'ALL'>('TODAY');

  // Printer Settings State
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(getPrinterSettings());

  const handleSavePrinterSettings = (newSettings: PrinterSettings) => {
    setPrinterSettings(newSettings);
    savePrinterSettings(newSettings);
  };

  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'EDC'>('CASH');
  const [cashAmountInput, setCashAmountInput] = useState<string>('');
  const [customerNameInput, setCustomerNameInput] = useState<string>('');
  const [refNoInput, setRefNoInput] = useState('');
  const [edcBank, setEdcBank] = useState('BCA');
  const [showQrisZoom, setShowQrisZoom] = useState(false);
  const [voucherCount, setVoucherCount] = useState<number>(0);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);

  // Today & Yesterday Strings
  const todayStr = useMemo(() => {
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).split(' ')[0];
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).split(' ')[0];
  }, []);

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

  const todayHistoryOrders = useMemo(() => {
    return historyOrders.filter(ord => ord.created_at && ord.created_at.startsWith(todayStr));
  }, [historyOrders, todayStr]);

  // History Filters
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilterMethod, setHistoryFilterMethod] = useState<string>('ALL');

  const filteredHistoryOrders = useMemo(() => {
    return todayHistoryOrders.filter((ord) => {
      const q = historySearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        ord.nomor_order.toLowerCase().includes(q) ||
        (ord.nama_pelanggan && ord.nama_pelanggan.toLowerCase().includes(q)) ||
        ord.items.some((it) => it.nama_item.toLowerCase().includes(q));

      const matchesMethod =
        historyFilterMethod === 'ALL' ||
        (historyFilterMethod === 'VOID'
          ? ord.status === 'VOID'
          : ord.metode_bayar === historyFilterMethod && ord.status !== 'VOID');

      return matchesSearch && matchesMethod;
    });
  }, [todayHistoryOrders, historySearchQuery, historyFilterMethod]);

  // Double-click confirm guard
  const [isConfirmingCheckout, setIsConfirmingCheckout] = useState(false);
  const checkoutConfirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConfirmingCheckoutRef = useRef(false);

  const loadOfflineCache = async () => {
    const cachedB = await getCachedBooths();
    const cachedM = await getCachedMenuItems();
    if (cachedB.length > 0) setBooths(cachedB);
    if (cachedM.length > 0) setMenuItems(cachedM);
  };

  // Automatic Background Heartbeat Sync & Reachability Ping
  const triggerAutoSync = async () => {
    if (!currentBooth || isSyncingRef.current) return;

    try {
      // 1. Test active server reachability via fast fetch
      const ping = await fetch('/api/data', { method: 'GET', cache: 'no-store' });
      if (ping.ok) {
        setIsOnline(true);
        const pendingNum = await getPendingOrdersCount(currentBooth.id);
        setPendingCount(pendingNum);

        // 2. If pending orders exist, perform automatic background batch upload
        if (pendingNum > 0) {
          isSyncingRef.current = true;
          setIsSyncing(true);

          const result = await syncPendingOrdersToServer(currentBooth.id);
          if (result.success && result.syncedCount > 0) {
            setSyncMessage(`Otomatis menyinkronkan ${result.syncedCount} pesanan ke server!`);
            await onRefreshData();
            setTimeout(() => setSyncMessage(null), 4000);
          }

          const updatedCount = await getPendingOrdersCount(currentBooth.id);
          setPendingCount(updatedCount);
          await refreshPendingCount();
        }
      } else {
        if (isOnline) {
          setIsOnline(false);
          await loadOfflineCache();
        }
      }
    } catch (err) {
      if (isOnline) {
        setIsOnline(false);
        await loadOfflineCache();
      }
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  };

  // Sync cache & network listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      loadOfflineCache();
    };

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        triggerAutoSync();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    if (navigator.onLine && (propsBooths.length > 0 || propsMenuItems.length > 0)) {
      setBooths(propsBooths);
      setMenuItems(propsMenuItems);
      cacheMasterData(propsBooths, propsMasterMenus, propsBoothMenus, propsMenuItems);
    } else {
      loadOfflineCache();
    }

    refreshPendingCount();
    triggerAutoSync();

    // Heartbeat Interval every 10 seconds: Check server & auto-sync pending orders
    const syncInterval = setInterval(() => {
      triggerAutoSync();
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      clearInterval(syncInterval);
      if (checkoutConfirmTimeoutRef.current) clearTimeout(checkoutConfirmTimeoutRef.current);
    };
  }, [propsBooths, propsMenuItems, currentBooth?.id, isOnline]);

  const refreshPendingCount = async () => {
    if (currentBooth) {
      const count = await getPendingOrdersCount(currentBooth.id);
      setPendingCount(count);

      const localHistory = await getOfflineOrdersHistory(currentBooth.id);
      let serverHistory: Order[] = [];
      if (isOnline) {
        try {
          const res = await fetch(`/api/orders/today/${currentBooth.id}`);
          if (res.ok) serverHistory = await res.json();
        } catch (e) {}
      }

      const orderMap = new Map<string, Order>();
      serverHistory.forEach(o => orderMap.set(o.id, o));
      localHistory.forEach(o => orderMap.set(o.id, o));

      const combined = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setHistoryOrders(combined);
    }
  };

  const handleSyncOrders = async () => {
    if (!currentBooth || isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncMessage(null);

    const result = await syncPendingOrdersToServer(currentBooth.id);
    if (result.success) {
      if (result.syncedCount > 0) {
        setSyncMessage(`Berhasil menyinkronkan ${result.syncedCount} pesanan ke server!`);
        await onRefreshData();
      }
    } else {
      setSyncMessage(result.message || 'Gagal menyinkronkan data');
    }

    await refreshPendingCount();
    isSyncingRef.current = false;
    setIsSyncing(false);
    setTimeout(() => setSyncMessage(null), 4000);
  };

  // Open payment modal with default active payment channel
  const openPaymentModal = () => {
    if (cart.length === 0 || !currentBooth) return;
    if (currentBooth.pay_cash_active !== false) setPaymentMethod('CASH');
    else if (currentBooth.pay_qris_active !== false) setPaymentMethod('QRIS');
    else if (currentBooth.pay_edc_active !== false) setPaymentMethod('EDC');
    setIsPaymentModalOpen(true);
  };

  // Derived calculations (Exact same as KasirPanel.tsx)
  const isVoucherEnabled = currentBooth?.voucher_active !== false;
  const voucherNominal = currentBooth?.voucher_nominal || 5000;
  const subtotalCartAmount = cart.reduce((sum, item) => sum + item.menuItem.harga * item.qty, 0);
  const totalDiscount = isVoucherEnabled ? voucherCount * voucherNominal : 0;
  const totalCartAmount = Math.max(0, subtotalCartAmount - totalDiscount);
  const parsedCashReceived = Number(cashAmountInput) || 0;
  const cashChangeAmount = parsedCashReceived >= totalCartAmount ? parsedCashReceived - totalCartAmount : 0;

  // Virtual numpad handlers
  const handleNumpadClick = (val: string) => {
    if (val === 'C') setCashAmountInput('');
    else if (val === 'DEL') setCashAmountInput(prev => prev.slice(0, -1));
    else setCashAmountInput(prev => prev + val);
  };

  const selectQuickCash = (amount: number) => {
    if (amount === 0) setCashAmountInput(String(totalCartAmount));
    else setCashAmountInput(String(amount));
  };

  // Cart Management
  const addToCart = (menuItem: MenuItem) => {
    if (!menuItem.tersedia || (menuItem.stok != null && menuItem.stok <= 0)) return;

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.menuItem.id === menuItem.id);
      const currentQty = idx > -1 ? prev[idx].qty : 0;

      if (menuItem.stok != null && currentQty >= menuItem.stok) {
        alert('Stok menu ini sudah mencapai batas maksimal!');
        return prev;
      }
      if (idx > -1) {
        return prev.map((item, i) => (i === idx ? { ...item, qty: item.qty + 1 } : item));
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
      if (newQty <= 0) return prev.filter((item) => item.menuItem.id !== id);
      return prev.map((item, i) => (i === idx ? { ...item, qty: newQty } : item));
    });
  };

  const updateCatatan = (id: string, text: string) => {
    setCart((prev) => prev.map((item) => (item.menuItem.id === id ? { ...item, catatan: text } : item)));
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setIsConfirmingCheckout(false);
    isConfirmingCheckoutRef.current = false;
    if (checkoutConfirmTimeoutRef.current) clearTimeout(checkoutConfirmTimeoutRef.current);
  };

  const handleConfirmCheckoutClick = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'CASH' && parsedCashReceived < totalCartAmount) {
      alert('Pembayaran tunai kurang dari total tagihan keranjang!');
      return;
    }

    if (isConfirmingCheckoutRef.current) {
      isConfirmingCheckoutRef.current = false;
      setIsConfirmingCheckout(false);
      if (checkoutConfirmTimeoutRef.current) clearTimeout(checkoutConfirmTimeoutRef.current);
      handleCheckout();
    } else {
      isConfirmingCheckoutRef.current = true;
      setIsConfirmingCheckout(true);
      if (checkoutConfirmTimeoutRef.current) clearTimeout(checkoutConfirmTimeoutRef.current);
      checkoutConfirmTimeoutRef.current = setTimeout(() => {
        isConfirmingCheckoutRef.current = false;
        setIsConfirmingCheckout(false);
      }, 3000);
    }
  };

  // Checkout submission with OFFICIAL SEQUENTIAL ORDER NUMBERS
  const handleCheckout = async () => {
    if (!currentBooth || cart.length === 0) return;
    setIsLoading(true);

    const timestampStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T');

    const payload = {
      booth_id: currentBooth.id,
      sumber: 'KASIR_MOBILE',
      metode_bayar: paymentMethod,
      total: totalCartAmount,
      diskon: totalDiscount,
      uang_bayar: paymentMethod === 'CASH' ? parsedCashReceived : undefined,
      kembalian: paymentMethod === 'CASH' ? cashChangeAmount : undefined,
      no_referensi: paymentMethod !== 'CASH' ? (paymentMethod === 'EDC' ? `${edcBank} - ${refNoInput}` : refNoInput) : undefined,
      nama_pelanggan: customerNameInput.trim() || undefined,
      items: cart.map((c) => ({
        menu_item_id: c.menuItem.id,
        nama_item: c.menuItem.nama,
        harga: c.menuItem.harga,
        qty: c.qty,
        catatan: c.catatan,
      })),
    };

    let processedOrder: Order | null = null;
    let isSynced = false;

    // 1. Try sending online first
    if (isOnline) {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          processedOrder = await res.json(); // Exact sequential order from DB sequence (e.g. A01-0005)
          isSynced = true;
          await onRefreshData();
        }
      } catch (err) {
        console.warn('Network offline, using sequential local IndexedDB storage');
      }
    }

    // 2. If offline or network failed, create sequential local order
    if (!processedOrder) {
      const orderId = `ord_mob_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const sequentialOrderNo = await getNextLocalSequenceNumber(currentBooth.id, currentBooth.kode);

      processedOrder = {
        id: orderId,
        booth_id: currentBooth.id,
        booth_kode: currentBooth.kode,
        booth_nama: currentBooth.nama,
        nomor_order: sequentialOrderNo,
        sumber: 'KASIR_MOBILE',
        metode_bayar: paymentMethod,
        nama_pelanggan: customerNameInput.trim() || undefined,
        total: totalCartAmount,
        diskon: totalDiscount,
        uang_bayar: paymentMethod === 'CASH' ? parsedCashReceived : undefined,
        kembalian: paymentMethod === 'CASH' ? cashChangeAmount : undefined,
        no_referensi: paymentMethod !== 'CASH' ? (paymentMethod === 'EDC' ? `${edcBank} - ${refNoInput}` : refNoInput) : undefined,
        status: currentBooth.kds_active ? 'BARU' : 'SELESAI',
        created_at: timestampStr,
        items: cart.map((c, idx) => ({
          id: `item_${orderId}_${idx}`,
          order_id: orderId,
          menu_item_id: c.menuItem.id,
          nama_item: c.menuItem.nama,
          harga: c.menuItem.harga,
          qty: c.qty,
          catatan: c.catatan
        }))
      };
    }

    // 3. Save to IndexedDB
    await saveOfflineOrder(processedOrder, isSynced);

    // 4. Update state & UI
    setCompletedOrder(processedOrder);
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
    setCart([]);
    setVoucherCount(0);
    setCashAmountInput('');
    setCustomerNameInput('');
    setRefNoInput('');

    await refreshPendingCount();
    setIsLoading(false);
  };

  const [orderToVoid, setOrderToVoid] = useState<Order | null>(null);
  const [isVoidLoading, setIsVoidLoading] = useState(false);

  // Void order handler (Online API or Offline Local Void) with Reason
  const handleConfirmVoid = async (orderId: string, reason: string) => {
    setIsVoidLoading(true);
    try {
      const rec = await offlineDb.offlineOrders.get(orderId);
      if (rec && !rec.synced) {
        rec.orderData.status = 'VOID';
        rec.orderData.alasan_void = reason;
        await offlineDb.offlineOrders.put(rec);
        alert('Transaksi offline berhasil dibatalkan (VOID)');
        setOrderToVoid(null);
        await refreshPendingCount();
        return;
      }
    } catch (e) {
      // Continue to API void
    }

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
        await refreshPendingCount();
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

  // Receipt thermal generation
  const generateRawBTReceipt = (order: Order) => {
    const center = (str: string) => {
      const pad = Math.max(0, Math.floor((32 - str.length) / 2));
      return ' '.repeat(pad) + str + '\n';
    };
    const leftRight = (left: string, right: string) => {
      const pad = Math.max(0, 32 - left.length - right.length);
      return left + ' '.repeat(pad) + right + '\n';
    };

    let text = '';
    const isVoid = order.status === 'VOID';

    if (isVoid) {
      text += '='.repeat(32) + '\n';
      text += center('*** TRANSAKSI DIBATALKAN ***');
      text += center('***       ( V O I D )        ***');
      if (order.alasan_void) {
        text += center(`Alasan: ${order.alasan_void}`);
      }
      text += '='.repeat(32) + '\n';
    } else {
      text += center(eventSetting?.nama_event || 'POINT OF SALE EVENT');
    }

    text += center(order.booth_nama || currentBooth?.nama || 'Booth');
    const subInfo = [eventSetting?.client_merchant, eventSetting?.area_lokasi].filter(Boolean).join(' • ');
    if (subInfo) text += center(subInfo);
    text += '-'.repeat(32) + '\n';
    text += center('NOMOR ORDER');
    text += center(order.nomor_order);
    if (order.nama_pelanggan && String(order.nama_pelanggan).trim()) {
      text += center(`[ ${String(order.nama_pelanggan).trim().toUpperCase()} ]`);
    }
    if (isVoid) {
      text += center('>>> STATUS: VOID / BATAL <<<');
      if (order.alasan_void) {
        text += center(`Alasan: ${order.alasan_void}`);
      }
    }
    text += '-'.repeat(32) + '\n';
    text += leftRight('Waktu', new Date(order.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }));
    text += leftRight('Kasir', `POS Mobile [${currentBooth?.kode || 'POS'}]`);
    text += leftRight('Metode', order.metode_bayar);
    text += '-'.repeat(32) + '\n';

    order.items.forEach(item => {
      text += `${item.nama_item}\n`;
      text += leftRight(`${item.qty}x ${formatIDR(item.harga)}`, formatIDR(item.harga * item.qty));
      if (item.catatan) text += `  *Catatan: ${item.catatan}\n`;
    });

    text += '-'.repeat(32) + '\n';
    text += leftRight('Subtotal', formatIDR(order.total + (order.diskon || 0)));
    if (order.diskon && order.diskon > 0) {
      const vVal = currentBooth?.voucher_nominal ?? 5000;
      text += leftRight(`Voucher (${order.diskon / vVal}x)`, `- ${formatIDR(order.diskon)}`);
    }
    text += leftRight(isVoid ? 'TOTAL (BATAL)' : 'TOTAL', formatIDR(order.total));

    if (order.metode_bayar === 'CASH') {
      text += leftRight('Tunai', formatIDR(order.uang_bayar || 0));
      text += leftRight('Kembali', formatIDR(order.kembalian || 0));
    }

    text += '-'.repeat(32) + '\n';
    if (eventSetting?.footer_struk && eventSetting.footer_struk.trim()) {
      eventSetting.footer_struk.split('\n').forEach((line) => {
        if (line.trim()) text += center(line.trim());
      });
    } else {
      text += center('TERIMA KASIH ATAS KUNJUNGAN ANDA');
      text += center('Simpan struk ini sebagai bukti');
    }
    text += '\n\n';
    return text;
  };

  // Auto-print effect when receipt modal opens
  useEffect(() => {
    if (isReceiptModalOpen && completedOrder && printerSettings.autoPrint !== false) {
      const timer = setTimeout(() => {
        handlePrintReceipt(completedOrder, currentBooth || undefined, eventSetting, printerSettings);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isReceiptModalOpen, printerSettings.autoPrint]);

  const handlePrint = async () => {
    if (completedOrder) {
      handlePrintReceipt(completedOrder, currentBooth || undefined, eventSetting, printerSettings);
    }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Filter products for active booth
  const productsFiltered = useMemo(() => {
    if (!currentBooth) return [];
    return menuItems.filter((item) => item.booth_id === currentBooth.id);
  }, [menuItems, currentBooth]);

  if (!currentBooth) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-sans">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold">Booth dengan kode "{boothKode}" tidak terdaftar</h2>
        <p className="text-slate-400 text-xs mt-1">Harap daftarkan booth ini terlebih dahulu di Panel Admin.</p>
        <button
          onClick={onNavigateHome}
          className="mt-6 bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-xl px-5 py-2.5 text-xs shadow-md"
        >
          Kembali ke Landing Hub
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative">
      {/* Dynamic Style block inject for window.print() */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-invoice-area, #print-invoice-area * { visibility: visible !important; }
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
          .no-print-modal { display: none !important; }
        }
      `}</style>

      {/* POS HEADER (100% MATCHING KasirPanel + Offline Sync Button) */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-orange-500 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
                KASIR
              </span>
              <h1 className="text-sm md:text-base font-extrabold tracking-tight text-slate-800">{currentBooth.nama}</h1>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono flex items-center gap-1 mt-0.5">
              <Smartphone className="h-3 w-3 text-orange-500" />
              <span>Terminal Kasir POS Mobile • {eventSetting?.nama_event || 'POS Kasir Mobile'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Printer & Receipt Settings Button */}
          <button
            type="button"
            onClick={() => setIsPrinterSettingsOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
            title="Pengaturan Printer & Test Print"
          >
            <Printer className="h-4 w-4 text-orange-500" />
            <span className="hidden sm:inline">Printer & Struk</span>
          </button>

          {/* Laporan Shift (Z-Report) Button */}
          <button
            type="button"
            onClick={() => {
              if (currentBooth) fetchBoothReport();
              setIsReportModalOpen(true);
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
            title="Laporan Penutupan Shift (Z-Report)"
          >
            <BarChart3 className="h-4 w-4 text-orange-500" />
            <span className="hidden sm:inline">Laporan Shift</span>
          </button>

          {/* History Button (Shows today's order count by default) */}
          <button
            onClick={() => {
              refreshPendingCount();
              setIsHistoryModalOpen(true);
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
          >
            <History className="h-4 w-4 text-orange-500" />
            <span className="hidden sm:inline">Riwayat ({todayHistoryOrders.length})</span>
          </button>

          {/* Sync & Connection Status Badge */}
          <button
            onClick={handleSyncOrders}
            disabled={isSyncing}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
              pendingCount > 0 || !isOnline
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {isSyncing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-600" />
            ) : isOnline ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-rose-600" />
            )}
            <span>{pendingCount > 0 ? `${pendingCount} Pending` : isOnline ? 'Online' : 'Offline'}</span>
          </button>
        </div>
      </header>

      {/* Sync Message Alert Banner */}
      {syncMessage && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-900 text-xs px-4 py-2 flex justify-between items-center">
          <span>{syncMessage}</span>
          <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => setSyncMessage(null)} />
        </div>
      )}

      {/* MAIN BODY GRID (100% IDENTICAL SPLIT 2-COLUMN LAYOUT AS KasirPanel.tsx) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* Menu Catalog Grid (Left 8 Columns out of 12) */}
        <main className="lg:col-span-8 p-4 md:p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Grid Cards of Dishes */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
            {productsFiltered.map((item) => {
              const inStock = item.tersedia && (item.stok == null || item.stok > 0);
              const cartRef = cart.find((c) => c.menuItem.id === item.id);
              const inCartQty = cartRef ? cartRef.qty : 0;

              return (
                <div
                  key={item.id}
                  onClick={() => inStock && addToCart(item)}
                  className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between cursor-pointer group hover:shadow-md select-none ${
                    inStock ? 'hover:bg-slate-50 border-slate-200 hover:border-orange-200' : 'opacity-45 border-slate-100 cursor-not-allowed'
                  } ${inCartQty > 0 ? 'ring-1 ring-orange-500 border-orange-500 bg-orange-50/10' : ''}`}
                >
                  <div>
                    {/* Food Image Banner */}
                    <div className="w-full aspect-square rounded-xl overflow-hidden mb-2.5 relative bg-slate-100 group">
                      <img
                        src={
                          !isOnline && (!item.foto || !item.foto.startsWith('data:image/'))
                            ? getOfflineSvgFallback(item.nama, item.kategori)
                            : getFoodImage(item.nama, item.kategori, item.foto)
                        }
                        alt={item.nama}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getOfflineSvgFallback(item.nama, item.kategori);
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Stock badge (if tracked) */}
                    {item.stok != null && (
                      <div className="flex justify-end mb-1.5">
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Sisa: {item.stok - inCartQty}
                        </span>
                      </div>
                    )}

                    <h4 className="font-bold text-slate-800 text-xs md:text-sm leading-tight group-hover:text-orange-600 transition-colors">
                      {item.nama}
                    </h4>
                    {item.deskripsi && (
                      <p className="text-[9px] text-slate-500 leading-tight mt-1 line-clamp-2">{item.deskripsi}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-slate-100">
                    <span className="font-mono text-orange-600 font-extrabold text-xs md:text-sm">
                      {formatIDR(item.harga)}
                    </span>
                    {inCartQty > 0 ? (
                      <span className="bg-orange-500 font-black text-[11px] text-white h-5 w-5 rounded-full flex items-center justify-center shadow">
                        {inCartQty}
                      </span>
                    ) : inStock ? (
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 group-hover:text-white group-hover:bg-orange-500 transition-all font-semibold">
                        + Pilih
                      </span>
                    ) : (
                      <span className="text-[9px] bg-red-50 text-red-500 border border-red-200 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Habis
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Order Basket Sidebar (Right 4 Columns out of 12 - EXACT MATCH AS KasirPanel.tsx) */}
        <aside className="lg:col-span-4 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-4 md:p-6 flex flex-col justify-between shadow-[-10px_0_30px_rgba(0,0,0,0.02)] h-full overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Basket title */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-500" />
                <h3 className="font-extrabold text-sm md:text-base text-slate-800">Keranjang Order</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => {
                    setCart([]);
                    setVoucherCount(0);
                  }}
                  className="text-xs text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            {/* Cart Rows Scroller */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 mt-2">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.menuItem.id} className="py-3 space-y-2">
                    <div className="flex justify-between gap-3 text-sm">
                      <div className="flex-1 space-y-0.5">
                        <span className="font-bold text-slate-800 text-xs leading-tight block">{item.menuItem.nama}</span>
                        <span className="font-mono text-[10px] text-slate-500">{formatIDR(item.menuItem.harga)} / pcs</span>
                      </div>
                      <span className="font-mono text-orange-600 font-bold text-xs shrink-0">{formatIDR(item.menuItem.harga * item.qty)}</span>
                    </div>

                    {/* Quantity modifiers + Item Note */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100/60">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(item.menuItem.id, -1)}
                          className="bg-slate-200 hover:bg-slate-300 h-6 w-6 rounded-lg text-slate-700 flex items-center justify-center font-bold cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-mono font-bold text-xs w-6 text-center text-slate-800">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.menuItem.id, 1)}
                          className="bg-slate-200 hover:bg-slate-300 h-6 w-6 rounded-lg text-slate-700 flex items-center justify-center font-bold cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={item.catatan || ''}
                        onChange={(e) => updateCatatan(item.menuItem.id, e.target.value)}
                        placeholder="Catatan tambahan (spt: Tanpa es)"
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-450 text-xs py-20">
                  <ShoppingCart className="h-10 w-10 stroke-[1.5] text-slate-400 mb-2" />
                  <span>Keranjang belanja masih kosong.</span>
                  <span>Silakan pilih menu di samping.</span>
                </div>
              )}
            </div>
          </div>

          {/* Summation Footer and checkout button */}
          <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Subtotal Item</span>
                <span className="font-mono text-slate-600 font-semibold">{formatIDR(totalCartAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>PPN 0% (Festival Tax-free)</span>
                <span className="font-mono text-slate-600 font-semibold">Rp0</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                <span className="font-extrabold text-sm text-slate-800">Jumlah Tagihan</span>
                <span className="font-mono font-extrabold text-lg text-orange-500">{formatIDR(totalCartAmount)}</span>
              </div>
            </div>

            <button
              onClick={openPaymentModal}
              disabled={cart.length === 0}
              className={`w-full font-extrabold text-sm rounded-2xl py-3 px-4 flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 select-none ${
                cart.length > 0 ? 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer hover:shadow-orange-500/10' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Bayar Transaksi</span>
            </button>
          </div>
        </aside>
      </div>

      {/* POPUP PAYMENT MODAL (100% EXACT MATCH WITH KasirPanel.tsx) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in no-print-modal">
          <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl text-slate-800 text-sans shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 p-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Proses Kasir Pembayaran</h3>
                <p className="text-xs text-slate-400">Selesaikan transaksi kasir untuk pesanan ini</p>
              </div>
              <button onClick={closePaymentModal} className="text-slate-400 hover:text-slate-800 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Split Content: Left (Summary & Tabs) | Right (Form Inputs) */}
            <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
              
              {/* LEFT COLUMN: Summary & Payment Channel Tabs */}
              <div className="w-full md:w-5/12 p-4 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col gap-3 bg-slate-50/30">
                {/* Total tagihan highlight */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-xs">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">TOTAL TAGIHAN</span>
                  <h2 className="text-2xl font-black text-orange-600 font-mono mt-1">{formatIDR(totalCartAmount)}</h2>
                </div>

                {/* VOUCHER DISKON PANEL */}
                {isVoucherEnabled && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/90 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                        <Tag className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <h4 className="text-xs font-bold text-emerald-900 leading-tight">
                            Voucher
                          </h4>
                          {voucherCount > 0 && (
                            <span className="text-emerald-700 font-black bg-emerald-200 px-1 py-0.2 rounded text-[9px] leading-none">
                              {voucherCount}x
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono font-bold text-emerald-600 leading-tight">
                          {formatIDR(voucherNominal)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 bg-white/90 border border-emerald-200 p-0.5 rounded-lg shadow-xs">
                      <button
                        type="button"
                        onClick={() => setVoucherCount(Math.max(0, voucherCount - 1))}
                        disabled={voucherCount === 0}
                        className="bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:hover:bg-emerald-50 text-emerald-700 h-6 w-6 rounded flex items-center justify-center font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
                        aria-label="Kurangi voucher"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono text-xs font-black text-emerald-800 w-4 text-center select-none">
                        {voucherCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setVoucherCount(voucherCount + 1)}
                        className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white h-6 w-6 rounded flex items-center justify-center font-bold shadow-xs transition-all cursor-pointer"
                        aria-label="Tambah voucher"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Payment channel tabs */}
                <div className="flex flex-col gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                  {currentBooth.pay_cash_active !== false && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`py-2.5 px-3 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                        paymentMethod === 'CASH' ? 'bg-orange-500 text-white font-bold shadow-md' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      <Coins className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-semibold">Tunai (Cash)</span>
                    </button>
                  )}
                  {currentBooth.pay_qris_active !== false && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QRIS')}
                      className={`py-2.5 px-3 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                        paymentMethod === 'QRIS' ? 'bg-purple-600 text-white font-bold shadow-md' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      <QrCode className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-semibold">QRIS Statis</span>
                    </button>
                  )}
                  {currentBooth.pay_edc_active !== false && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('EDC')}
                      className={`py-2.5 px-3 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                        paymentMethod === 'EDC' ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      <CreditCard className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-semibold">Mesin EDC</span>
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Inputs & Numpad */}
              <div className="w-full md:w-7/12 flex flex-col">
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">Nama Pelanggan / No. Meja (Opsional)</label>
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = customerNameInput.trim();
                          if (!trimmed) {
                            setCustomerNameInput('Reservasi');
                          } else if (/^reservasi\b/i.test(trimmed)) {
                            setCustomerNameInput(trimmed.replace(/^reservasi\s*[-–:]*\s*/i, ''));
                          } else {
                            setCustomerNameInput(`Reservasi - ${trimmed}`);
                          }
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer select-none active:scale-95 ${
                          /reservasi/i.test(customerNameInput)
                            ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                        }`}
                        title="Klik untuk menandai transaksi Reservasi"
                      >
                        <span>Reservasi</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={customerNameInput}
                      onChange={(e) => setCustomerNameInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-slate-400"
                      placeholder="Masukkan nama / nomor meja (Contoh: Budi / Meja 12)"
                    />
                  </div>

                  {/* CASH payments panel */}
                  {paymentMethod === 'CASH' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Diterima Uang Tunai (IDR)</label>
                        <input
                          type="text"
                          readOnly
                          value={cashAmountInput ? formatIDR(Number(cashAmountInput)) : ''}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-lg font-mono font-black text-orange-600 tracking-tight focus:outline-none cursor-default"
                          placeholder="Rp0"
                        />
                      </div>

                      {/* VIRTUAL NUMPAD & QUICK CASH */}
                      <div className="grid grid-cols-4 gap-1.5 mt-1 select-none">
                        <div className="col-span-1 flex flex-col gap-1.5">
                          <button type="button" onClick={() => selectQuickCash(0)} className="bg-orange-100 hover:bg-orange-200 text-orange-700 h-full rounded-xl text-[9px] font-bold shadow-xs transition-colors flex items-center justify-center text-center leading-tight cursor-pointer">UANG PAS</button>
                          <button type="button" onClick={() => selectQuickCash(20000)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-xl text-[10px] font-mono font-bold shadow-xs transition-colors cursor-pointer">20K</button>
                          <button type="button" onClick={() => selectQuickCash(50000)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-xl text-[10px] font-mono font-bold shadow-xs transition-colors cursor-pointer">50K</button>
                          <button type="button" onClick={() => selectQuickCash(100000)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-xl text-[10px] font-mono font-bold shadow-xs transition-colors cursor-pointer">100K</button>
                        </div>

                        <div className="col-span-3 grid grid-cols-3 gap-1.5">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                            <button key={num} type="button" onClick={() => handleNumpadClick(num)} className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 py-1.5 rounded-xl text-base font-mono font-bold shadow-xs transition-colors cursor-pointer">{num}</button>
                          ))}
                          <button type="button" onClick={() => handleNumpadClick('C')} className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer">C</button>
                          <button type="button" onClick={() => handleNumpadClick('0')} className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 py-1.5 rounded-xl text-base font-mono font-bold shadow-xs transition-colors cursor-pointer">0</button>
                          <button type="button" onClick={() => handleNumpadClick('000')} className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 py-1.5 rounded-xl text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer">000</button>
                          <button type="button" onClick={() => handleNumpadClick('DEL')} className="col-span-3 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer">Hapus</button>
                        </div>
                      </div>

                      {/* Changes highlight indicator */}
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex justify-between items-center mt-1">
                        <span className="text-[10px] text-emerald-700 font-extrabold uppercase">Kembalian</span>
                        <span className="font-mono text-lg font-extrabold text-emerald-600">
                          {formatIDR(cashChangeAmount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* QRIS Statis payment scan mockup */}
                  {paymentMethod === 'QRIS' && (
                    <div className="space-y-3">
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col items-center">
                        <div className="bg-white p-3 rounded-xl shadow-inner border border-slate-200 flex flex-col items-center shrink-0">
                          <div
                            className={`h-36 w-36 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden ${currentBooth.qris_image_path ? 'cursor-pointer hover:opacity-90' : ''}`}
                            onClick={() => currentBooth.qris_image_path && setShowQrisZoom(true)}
                          >
                            {currentBooth.qris_image_path ? (
                              <img
                                src={currentBooth.qris_image_path}
                                alt="QRIS"
                                className="w-full h-full object-contain mix-blend-multiply"
                              />
                            ) : (
                              <>
                                <QrCode className="h-24 w-24 text-slate-800" />
                                <span className="bg-orange-500 text-white font-mono font-black text-[9px] px-1.5 py-0.5 rounded absolute">
                                  BOOTH {currentBooth.kode}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-center text-[10px] text-slate-500 mt-2 max-w-xs leading-relaxed">
                          Arahkan pembeli untuk scan QRIS statis booth. Kasir mengecek mutasi lalu klik Konfirmasi.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EDC payment option panel */}
                  {paymentMethod === 'EDC' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Bank Penerbit EDC</label>
                          <select
                            value={edcBank}
                            onChange={(e) => setEdcBank(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          >
                            <option value="BCA">BCA (Standard)</option>
                            <option value="Mandiri">Mandiri</option>
                            <option value="BRI">BRI</option>
                            <option value="BNI">BNI</option>
                            <option value="QRIS">QRIS (via EDC)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">ID Approval / Trace</label>
                          <input
                            type="text"
                            value={refNoInput}
                            onChange={(e) => setRefNoInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono tracking-widest font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            placeholder="cth: 382944"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom confirm footer */}
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4 shrink-0 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Batalkan
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCheckoutClick}
                    disabled={isLoading}
                    className={`transition-all duration-200 font-black text-[11px] px-5 py-2 rounded-xl text-white shadow-lg flex items-center gap-1.5 cursor-pointer ${
                      isConfirmingCheckout
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20 animate-pulse'
                        : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isConfirmingCheckout ? (
                      <>
                        <ShieldAlert className="h-4 w-4 animate-bounce" />
                        <span>YAKIN BAYAR? (KLIK SEKALI LAGI)</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Konfirmasi Transaksi (Klik 2x)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP RECEIPT THERMAL MODAL (100% EXACT MATCH WITH KasirPanel.tsx) */}
      {isReceiptModalOpen && completedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in no-print-modal">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 text-slate-800 text-sans shadow-2xl flex flex-col max-h-[90vh]">
            <div className="text-center mb-4 text-emerald-600 font-extrabold text-sm flex items-center justify-center gap-1.5 shrink-0">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Transaksi Berhasil Diinput!</span>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 bg-white text-black p-4 rounded-2xl shadow-inner select-all relative">
              <div id="print-invoice-area" className="font-mono text-[12px] leading-tight text-left">
                {completedOrder.status === 'VOID' && (
                  <div className="mb-2 p-2 rounded-xl bg-red-50 border-2 border-dashed border-red-400 text-red-600 text-center font-bold">
                    <div className="text-[12px] uppercase font-black tracking-wider">*** TRANSAKSI DIBATALKAN (VOID) ***</div>
                    {completedOrder.alasan_void && (
                      <div className="text-[10px] mt-0.5 font-semibold text-red-700">Alasan: {completedOrder.alasan_void}</div>
                    )}
                  </div>
                )}
                {/* Header toko & event (tanpa status konektivitas) */}
                <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-slate-300">
                  <h3 className="font-black text-sm uppercase leading-none">
                    {eventSetting?.nama_event || 'Festival Point of Sale'}
                  </h3>
                  <p className="text-[11px] font-bold">{completedOrder.booth_nama || currentBooth?.nama}</p>
                  <p className="text-[9px] text-slate-600">
                    {[eventSetting?.client_merchant, eventSetting?.area_lokasi].filter(Boolean).join(' • ') || 'Main Venue'}
                  </p>
                </div>

                {/* Center Hero Block: Nomor Order & Pelanggan / Meja */}
                <div className="py-2 border-b border-dashed border-slate-300 text-center space-y-0.5">
                  <span className="text-[8.5px] uppercase tracking-wider text-slate-500 font-bold block">Nomor Order</span>
                  <div className="text-[16px] font-black tracking-wider text-slate-900 leading-none">
                    {completedOrder.nomor_order}
                  </div>
                  {completedOrder.nama_pelanggan && String(completedOrder.nama_pelanggan).trim() && (
                    <div className="text-[11.5px] font-black uppercase tracking-wide text-slate-900 mt-0.5">
                      [ {String(completedOrder.nama_pelanggan).trim()} ]
                    </div>
                  )}
                </div>

                {/* Meta details */}
                <div className="space-y-0.5 py-1.5 border-b border-dashed border-slate-300 text-[9.5px]">
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>{new Date(completedOrder.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir / Sumber:</span>
                    <span className="font-bold">{completedOrder.sumber || 'POS'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode:</span>
                    <span className="font-bold">{completedOrder.metode_bayar}</span>
                  </div>
                </div>

                <div className="py-1.5 border-b border-dashed border-slate-300 space-y-1.5">
                  {completedOrder.items.map((item) => (
                    <div key={item.id} className="space-y-0.5">
                      <div className="flex justify-between text-[10.5px]">
                        <span className="font-bold">{item.nama_item}</span>
                        <span className="font-mono">{formatIDR(item.harga * item.qty)}</span>
                      </div>
                      <div className="text-[9.5px] text-slate-600 pl-1">
                        <span>{item.qty} pcs x {formatIDR(item.harga)}</span>
                      </div>
                      {item.catatan && (
                        <div className="text-[9px] text-slate-600 pl-2 italic break-words leading-tight">
                          *Catatan: {item.catatan}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="py-1.5 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatIDR(completedOrder.total + (completedOrder.diskon || 0))}</span>
                  </div>
                  {completedOrder.diskon && completedOrder.diskon > 0 ? (
                    <div className="flex justify-between items-center text-emerald-700">
                      <span className="truncate">Voucher ({completedOrder.diskon / (currentBooth?.voucher_nominal || 5000)}x):</span>
                      <span className="font-mono whitespace-nowrap shrink-0 ml-1">- {formatIDR(completedOrder.diskon)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span>PPN (0%):</span>
                    <span className="font-mono">Rp0</span>
                  </div>
                  <div className="flex justify-between font-black border-t border-dotted border-slate-200 pt-1 text-[12.5px] text-slate-900">
                    <span>TOTAL:</span>
                    <span className="font-mono">{formatIDR(completedOrder.total)}</span>
                  </div>
                  {completedOrder.metode_bayar === 'CASH' && (
                    <>
                      <div className="flex justify-between text-slate-700 pt-0.5">
                        <span>Tunai:</span>
                        <span className="font-mono">{formatIDR(completedOrder.uang_bayar || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>Kembalian:</span>
                        <span className="font-mono">{formatIDR(completedOrder.kembalian || 0)}</span>
                      </div>
                    </>
                  )}
                  {completedOrder.metode_bayar !== 'CASH' && completedOrder.no_referensi && (
                    <div className="flex justify-between text-slate-700 font-mono text-[9px] pt-0.5">
                      <span>Ref ID:</span>
                      <span>{completedOrder.no_referensi}</span>
                    </div>
                  )}
                </div>

                <div className="text-center pt-2.5 border-t border-dashed border-slate-300 space-y-0.5 select-none whitespace-pre-line text-[9px] text-slate-600 font-medium">
                  {eventSetting?.footer_struk && eventSetting.footer_struk.trim()
                    ? eventSetting.footer_struk
                    : 'TERIMA KASIH ATAS KUNJUNGAN ANDA\nSimpan struk ini sebagai bukti transaksi'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="h-4 w-4" />
                <span className="flex flex-col items-center">
                  Cetak Struk (thermal)
                  <span className="text-[8px] font-normal text-slate-400 -mt-1">PC / RawBT Android</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setCompletedOrder(null);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs py-3 px-4 rounded-xl text-center cursor-pointer shadow-xs"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER HISTORY MODAL (STRICTLY TODAY ONLY) */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in no-print-modal">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl text-slate-800 text-sans shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center border-b border-slate-100 p-4 shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Riwayat Transaksi Hari Ini ({currentBooth.nama})</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Tanggal: {todayStr} • Total: {todayHistoryOrders.length} transaksi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => refreshPendingCount()}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  title="Segarkan Data"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  title="Tutup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search & Filter Sederhana */}
            <div className="p-4 pb-2 border-b border-slate-100 space-y-2.5 shrink-0">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-8 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800 placeholder-slate-400"
                  placeholder="Cari No. Order / Pelanggan / Menu..."
                />
                {historySearchQuery && (
                  <button
                    onClick={() => setHistorySearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'ALL', label: `Semua (${todayHistoryOrders.length})`, show: true },
                  { id: 'CASH', label: `Tunai (${todayHistoryOrders.filter(o => o.metode_bayar === 'CASH' && o.status !== 'VOID').length})`, show: currentBooth.pay_cash_active !== false },
                  { id: 'QRIS', label: `QRIS (${todayHistoryOrders.filter(o => o.metode_bayar === 'QRIS' && o.status !== 'VOID').length})`, show: currentBooth.pay_qris_active !== false },
                  { id: 'EDC', label: `EDC (${todayHistoryOrders.filter(o => o.metode_bayar === 'EDC' && o.status !== 'VOID').length})`, show: currentBooth.pay_edc_active !== false },
                  { id: 'VOID', label: `Void (${todayHistoryOrders.filter(o => o.status === 'VOID').length})`, show: true },
                ].filter(tab => tab.show).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setHistoryFilterMethod(tab.id)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                      historyFilterMethod === tab.id
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Order List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {filteredHistoryOrders.map((ord) => (
                <div
                  key={ord.id}
                  className={`border rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                    ord.status === 'VOID'
                      ? 'bg-red-50/40 border-red-200 opacity-80'
                      : 'bg-slate-50/70 border-slate-200 hover:border-orange-200 hover:bg-white'
                  }`}
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-orange-600 text-sm">{ord.nomor_order}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          ord.status === 'VOID' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {ord.status}
                      </span>
                      <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                        {ord.sumber}
                      </span>
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">
                        {ord.metode_bayar}
                      </span>
                      {ord.nama_pelanggan && (
                        <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                          Pelanggan/Meja: {ord.nama_pelanggan}
                        </span>
                      )}
                      {ord.status === 'VOID' && ord.alasan_void && (
                        <span className="text-[10px] bg-red-100 border border-red-200 text-red-700 px-2 py-0.5 rounded-md font-bold">
                          Alasan: {ord.alasan_void}
                        </span>
                      )}
                      {ord.diskon !== undefined && ord.diskon > 0 && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded-md font-sans">
                          <Tag className="h-3 w-3 text-emerald-600" />
                          <span>Voucher -{formatIDR(ord.diskon)}</span>
                        </span>
                      )}
                    </div>

                    {/* Item list summary */}
                    <p className="text-slate-600 text-[11px] leading-tight line-clamp-1">
                      {ord.items.map((it) => `${it.qty}x ${it.nama_item}`).join(', ')}
                    </p>

                    {/* Timestamp and Total */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
                      <span>
                        Jam {new Date(ord.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                      <span>•</span>
                      {ord.diskon !== undefined && ord.diskon > 0 ? (
                        <div className="flex items-center gap-1.5 font-sans">
                          <span className="line-through text-slate-400 font-mono">
                            {formatIDR(ord.total + ord.diskon)}
                          </span>
                          <span className="text-emerald-600 font-bold font-mono text-[10px]">
                            (-{formatIDR(ord.diskon)})
                          </span>
                          <span
                            className={`font-black font-mono text-xs ${
                              ord.status === 'VOID' ? 'line-through text-red-500' : 'text-slate-900'
                            }`}
                          >
                            {formatIDR(ord.total)}
                          </span>
                        </div>
                      ) : (
                        <span className={`font-bold font-sans text-xs ${ord.status === 'VOID' ? 'line-through text-red-500' : 'text-slate-800'}`}>
                          {formatIDR(ord.total)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        setCompletedOrder(ord);
                        setIsHistoryModalOpen(false);
                        setIsReceiptModalOpen(true);
                      }}
                      className="p-2.5 bg-white border border-slate-200 hover:bg-orange-50 hover:border-orange-300 rounded-xl text-slate-700 hover:text-orange-600 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                      title="Cetak Ulang Struk"
                    >
                      <Printer className="h-4 w-4 text-orange-500" />
                      <span className="text-[11px] font-bold">Cetak</span>
                    </button>
                    {ord.status !== 'VOID' && isOnline && (
                      <button
                        onClick={() => setOrderToVoid(ord)}
                        className="p-2.5 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-xl transition-all cursor-pointer"
                        title="Batalkan Transaksi (Void)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredHistoryOrders.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {todayHistoryOrders.length === 0
                    ? `Belum ada transaksi untuk hari ini (${todayStr}).`
                    : 'Tidak ada transaksi yang cocok dengan pencarian/filter.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINTER & RECEIPT SETTINGS MODAL */}
      <KasirPrinterSettingsModal
        isOpen={isPrinterSettingsOpen}
        settings={printerSettings}
        onSave={handleSavePrinterSettings}
        onClose={() => setIsPrinterSettingsOpen(false)}
        onTestPrint={(st) => handleTestPrintReceipt(currentBooth || undefined, eventSetting, st)}
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
      {showQrisZoom && currentBooth.qris_image_path && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center p-6 z-[100] animate-fade-in" onClick={() => setShowQrisZoom(false)}>
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-lg w-full relative flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQrisZoom(false)} className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full shadow-lg">
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-center text-xl font-bold text-slate-800 mb-4">Scan QRIS Pembayaran</h3>
            <img
              src={currentBooth.qris_image_path}
              alt="QRIS Zoom"
              className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
            />
            <p className="text-sm font-bold text-slate-500 mt-4 text-center">Silakan scan kode ini dengan aplikasi M-Banking atau E-Wallet Anda.</p>
          </div>
        </div>
      )}

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
