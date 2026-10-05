/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- TIMEZONE WIB (Asia/Jakarta) HELPERS ---

export function getWibDateString(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD
}

export function getWibTimestampString(date: Date = new Date()): string {
  return date.toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T'); // YYYY-MM-DDTHH:mm:ss
}
