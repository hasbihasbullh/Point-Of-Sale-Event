/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type KdsFilterStatus = 'BELUM_SELESAI' | 'HANYA_SELESAI' | 'SEMUA';

export type KdsAction = 'DIPROSES' | 'SELESAI' | 'KEMBALIKAN';

export interface ConfirmingOrderState {
  id: string;
  action: KdsAction;
}

export interface ElapsedTimeBadge {
  text: string;
  badgeClass: string;
  isUrgent: boolean;
}
