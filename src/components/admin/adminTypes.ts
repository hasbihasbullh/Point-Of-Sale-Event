/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Booth, MasterMenu, MasterCategory, BoothMenu, MenuItem, Order, ReportSummary, EventSetting, KioskNode, ConsolidationLog, UserProfile } from '../../types';
export type { UserProfile };

export type AdminTabKey = 'dashboard' | 'master-menu' | 'booth' | 'transactions' | 'events' | 'consolidation' | 'profile';

export const ADMIN_TABS: { id: AdminTabKey; label: string; iconName: string }[] = [
  { id: 'dashboard', label: 'Dashboard & Analitik', iconName: 'LayoutDashboard' },
  { id: 'master-menu', label: 'Katalog Master Menu', iconName: 'Utensils' },
  { id: 'booth', label: 'Manajemen Stan', iconName: 'Store' },
  { id: 'transactions', label: 'Audit Transaksi', iconName: 'Receipt' },
  { id: 'events', label: 'Pengaturan Event & Struk', iconName: 'Settings' },
  { id: 'consolidation', label: 'Konsolidasi Multi-Terminal', iconName: 'Database' },
];

export const CATEGORY_COLORS: Record<string, { name: string; bg: string; text: string; border: string; activeBg: string; hex: string }> = {
  orange: { name: 'Jingga / Oranye', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', activeBg: 'bg-orange-500', hex: '#f97316' },
  blue: { name: 'Biru', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', activeBg: 'bg-blue-500', hex: '#3b82f6' },
  emerald: { name: 'Hijau Emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', activeBg: 'bg-emerald-500', hex: '#10b981' },
  purple: { name: 'Ungu', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', activeBg: 'bg-purple-500', hex: '#8b5cf6' },
  rose: { name: 'Merah Rose', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', activeBg: 'bg-rose-500', hex: '#f43f5e' },
  amber: { name: 'Kuning Amber', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', activeBg: 'bg-amber-500', hex: '#f59e0b' },
  cyan: { name: 'Cyan / Toska', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', activeBg: 'bg-cyan-500', hex: '#06b6d4' },
  slate: { name: 'Abu-abu Slate', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', activeBg: 'bg-slate-600', hex: '#64748b' },
};

export const getCategoryColorStyle = (colorName?: string | null) => {
  if (!colorName || !CATEGORY_COLORS[colorName]) {
    return CATEGORY_COLORS.orange;
  }
  return CATEGORY_COLORS[colorName];
};

export const formatIDR = (num: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const getAdminAuthHeader = () => {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('pos_admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};
