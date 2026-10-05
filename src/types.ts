/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Booth {
  id: string; // e.g. "booth_1"
  kode: string; // e.g. "B01", "B02"
  nama: string;
  qris_image_path?: string | null;
  aktif: boolean;
  kiosk: boolean;
  kds_active: boolean;
  kategori_list?: string | null;
  pay_cash_active?: boolean;
  pay_qris_active?: boolean;
  pay_edc_active?: boolean;
  voucher_active?: boolean;
  voucher_nominal?: number;
}

export interface MasterCategory {
  id: string;
  nama: string;
  urutan: number;
  warna?: string | null; // e.g. 'orange', 'blue', 'emerald', 'purple', 'rose', 'amber', 'cyan', 'slate'
  ikon?: string | null;
  aktif?: boolean;
  created_at?: string;
  updated_at?: string;
  menu_count?: number;
}

export interface MasterMenu {
  id: string;
  nama: string;
  harga_default: number;
  kategori: string;
  foto?: string | null;
  deskripsi?: string | null;
  kds_display?: boolean;
  aktif: boolean;
}

export interface BoothMenu {
  id: string;
  booth_id: string;
  master_menu_id: string;
  harga: number;
  stok?: number | null;
  kds_display?: boolean | null;
  tersedia: boolean;
  urutan?: number;
  masterMenu?: MasterMenu;
}

// MenuItem represents the active resolved menu item available at a specific booth
export interface MenuItem {
  id: string; // Master Menu ID (e.g. "m_bakso_urat")
  booth_id: string;
  booth_menu_id?: string;
  master_menu_id?: string;
  nama: string;
  harga: number; // Booth-specific selling price
  harga_default?: number;
  kategori: string;
  foto?: string | null;
  deskripsi?: string | null;
  kds_display?: boolean;
  tersedia: boolean;
  stok?: number | null; // Booth-specific remaining stock
}

export interface Order {
  id: string;
  booth_id: string;
  booth_kode: string;
  booth_nama: string;
  nomor_order: string; // e.g., "B01-0024"
  sumber: 'KASIR' | 'KASIR_MOBILE' | 'KIOSK';
  metode_bayar: 'CASH' | 'QRIS' | 'EDC';
  nama_pelanggan?: string;
  total: number;
  diskon?: number;
  uang_bayar?: number; // for CASH
  kembalian?: number; // for CASH
  no_referensi?: string; // for EDC / QRIS verification
  status: 'BARU' | 'DIPROSES' | 'SELESAI' | 'VOID';
  alasan_void?: string;
  created_at: string; // ISO string or format
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string; // Master Menu ID
  master_menu_id?: string;
  nama_item: string;
  harga: number;
  qty: number;
  catatan?: string;
  kds_display?: boolean;
}

export interface ReportSummary {
  revenue_total: number;
  total_diskon: number;
  transactions_count: number;
  items_sold_count: number;
  voided_count?: number;
  voided_total?: number;
  reservasi_count?: number;
  reservasi_total?: number;
  booth_stats: {
    booth_id: string;
    booth_kode: string;
    booth_nama: string;
    revenue: number;
    sales_count: number;
    diskon: number;
    qty_items: number;
    payment_cash: number;
    payment_qris: number;
    payment_edc: number;
    reservasi_count?: number;
    reservasi_total?: number;
  }[];
  payment_stats: {
    CASH: number;
    QRIS: number;
    EDC: number;
  };
  category_stats: Record<string, number>;
  timeline_stats: {
    tanggal: string; // Day 1 - Day 4 (23 Juli - 26 Juli 2026)
    revenue: number;
    count: number;
  }[];
  top_menus?: {
    name: string;
    booth: string;
    kategori: string;
    harga: number;
    qty: number;
    total_revenue: number;
  }[];
  menu_sales?: Record<string, { qty: number; booth: string; kategori: string; harga: number; total_revenue: number }>;
  raw_orders?: Order[];
}

export interface EventSetting {
  id: string;
  nama_event: string;
  tanggal_event: string;
  area_lokasi: string;
  konektivitas: string;
  client_merchant: string;
  footer_struk: string;
  voucher_active?: boolean;
  voucher_nominal?: number;
  kiosk_banner?: string;
}

export interface KioskNode {
  id: string;
  nama: string;
  url: string;
  lokasi?: string;
  status?: 'online' | 'offline' | 'checking';
  latency?: number;
  lastSync?: string;
  totalOrders?: number;
  unpulledOrders?: number;
}

export interface ConsolidationLog {
  id: string;
  timestamp: string;
  source: string;
  sourceType: 'network' | 'file' | 'batch';
  addedCount: number;
  skippedCount: number;
  voidUpdatedCount: number;
  revenueAdded: number;
  status: 'success' | 'error';
  message: string;
}

export interface UserProfile {
  id: string;
  username: string;
  nama_lengkap: string;
  foto_avatar?: string | null;
  role: string;
  is_default_password?: boolean;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
}


