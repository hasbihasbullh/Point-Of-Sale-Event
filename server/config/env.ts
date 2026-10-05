/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
dotenv.config();

/**
 * Helper validasi ketat untuk variabel environment kritis.
 * Jika variabel tidak ditemukan di process.env maupun fallback,
 * proses akan dihentikan seketika dengan pesan diagnostik yang jelas.
 */
function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value || value.trim() === '') {
    console.error(`\n======================================================================`);
    console.error(`❌ FATAL CONFIGURATION ERROR:`);
    console.error(`Variabel '${key}' belum dikonfigurasi pada file .env Anda!`);
    console.error(`Harap salin dari .env.example atau periksa file .env di root project.`);
    console.error(`======================================================================\n`);
    process.exit(1);
  }
  return value.trim();
}

// --------------------------------------------------------------------------
// 1. KONFIGURASI UMUM (Sensible Defaults Diizinkan)
// --------------------------------------------------------------------------
export const PORT = Number(process.env.PORT) || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

// --------------------------------------------------------------------------
// 2. KREDENSIAL KRITIS & SECURITY (Wajib Terdefinisi di .env)
// --------------------------------------------------------------------------
export const DATABASE_URL = requireEnv('DATABASE_URL');
export const JWT_SECRET = requireEnv('JWT_SECRET');
export const SYNC_SECRET = requireEnv('SYNC_SECRET');
export const SUPERVISOR_PIN = requireEnv('SUPERVISOR_PIN', '8888');
