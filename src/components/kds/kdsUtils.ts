/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ElapsedTimeBadge } from './kdsTypes';

/**
 * Calculate elapsed time text and heat color badge
 */
export function getElapsedTimeBadge(createdAtStr: string, now: number): ElapsedTimeBadge {
  const orderTime = new Date(createdAtStr).getTime();
  const elapsedMs = Math.max(0, now - orderTime);
  const elapsedMinutes = Math.floor(elapsedMs / 1000 / 60);

  let text = `${elapsedMinutes} mnt lalu`;
  if (elapsedMinutes === 0) {
    text = 'Baru Masuk';
  }

  let badgeClass = 'bg-slate-800/90 text-slate-300 border-slate-700';

  if (elapsedMinutes >= 15) {
    badgeClass = 'bg-rose-950/90 text-rose-300 border-rose-500 animate-pulse ring-1 ring-rose-500/50';
  } else if (elapsedMinutes >= 8) {
    badgeClass = 'bg-amber-950/90 text-amber-300 border-amber-600/80';
  } else if (elapsedMinutes >= 3) {
    badgeClass = 'bg-yellow-950/90 text-yellow-300 border-yellow-700/60';
  }

  return { text, badgeClass, isUrgent: elapsedMinutes >= 15 };
}
