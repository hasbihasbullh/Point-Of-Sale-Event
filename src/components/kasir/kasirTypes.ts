/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, Booth, EventSetting } from '../../types';

export interface CartItem {
  menuItem: MenuItem;
  qty: number;
  catatan?: string;
}

export type PaymentMethod = 'CASH' | 'QRIS' | 'EDC';

export type ReportDateMode = 'today' | 'yesterday' | 'custom';

export interface TopMenuItem {
  nama: string;
  qty: number;
  harga: number;
  total_revenue: number;
  kategori: string;
}

export interface PrinterSettings {
  paperWidth: '58mm' | '80mm';
  autoPrint: boolean;
  printCopies: 1 | 2;
  showCustomerName: boolean;
  showItemNotes: boolean;
}

export interface KasirPanelProps {
  boothKode: string;
  booths: Booth[];
  menuItems: MenuItem[];
  eventSetting?: EventSetting;
  onRefreshData: () => Promise<void>;
  onNavigateHome: () => void;
}
