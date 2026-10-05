/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, Booth, EventSetting } from '../../types';

export type KioskScreen = 'welcome' | 'menu' | 'review' | 'payment' | 'success';

export interface KioskCartItem {
  menuItem: MenuItem;
  qty: number;
  catatan?: string;
}

export type KioskPaymentMethod = 'QRIS' | 'CASH' | 'EDC';

export type KioskReportDateMode = 'today' | 'yesterday' | 'custom';

export interface KioskTopMenuItem {
  nama: string;
  qty: number;
  harga: number;
  total_revenue: number;
  kategori: string;
}

export interface KioskPrinterSettings {
  paperWidth: '58mm' | '80mm';
  autoPrint: boolean;
  printCopies: 1 | 2;
  showCustomerName: boolean;
  showItemNotes: boolean;
}

export interface KioskPanelProps {
  boothKode: string;
  booths: Booth[];
  menuItems: MenuItem[];
  eventSetting?: EventSetting;
  onRefreshData: () => Promise<void>;
  onNavigateHome: () => void;
}
